import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, garminDailySummaries } from "@/db/schema";
import { env } from "@/lib/env";

type GarminDailyPayload = {
  summaryId?: string;
  calendarDate?: string;
  calendarDateLocal?: string;
  startTimeGmt?: string;
  endTimeGmt?: string;
  callbackURL?: string;
  userId?: string;
  userProfileId?: string;
  steps?: number;
  distanceInMeters?: number;
  distanceMeters?: number;
  calories?: number;
  totalKilocalories?: number;
  totalSteps?: number;
  sleepDurationInSeconds?: number;
  sleepSeconds?: number;
  maxStressLevel?: number;
  averageStressLevel?: number;
  minStressLevel?: number;
  [key: string]: unknown;
};

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const coerceInteger = (value: unknown): number | null => {
  const parsed = coerceNumber(value);
  return parsed !== null ? Math.round(parsed) : null;
};

const extractEntries = (body: unknown): GarminDailyPayload[] => {
  if (!body) return [];
  if (Array.isArray(body)) return body as GarminDailyPayload[];
  if (typeof body === "object") {
    const maybeArray = (body as { dailies?: GarminDailyPayload[] }).dailies;
    if (Array.isArray(maybeArray)) {
      return maybeArray;
    }
  }
  return [];
};

const resolveGarminUserId = (entry: GarminDailyPayload): string | null => {
  const candidates = [
    entry.userId,
    entry.userProfileId,
    typeof entry.userProfileId === "number" ? String(entry.userProfileId) : undefined,
  ];
  for (const candidate of candidates) {
    if (candidate && `${candidate}`.trim().length > 0) {
      return `${candidate}`.trim();
    }
  }
  return null;
};

const resolveSummaryId = (entry: GarminDailyPayload, garminUserId: string): string => {
  if (entry.summaryId && entry.summaryId.trim().length > 0) {
    return entry.summaryId.trim();
  }
  const date = entry.calendarDate ?? entry.calendarDateLocal ?? entry.startTimeGmt ?? new Date().toISOString();
  return `${garminUserId}-${date}`;
};

const resolveCalendarDate = (entry: GarminDailyPayload): string => {
  return (
    entry.calendarDate ??
    entry.calendarDateLocal ??
    (entry.startTimeGmt ? entry.startTimeGmt.slice(0, 10) : new Date().toISOString().slice(0, 10))
  );
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info("Garmin push /dailies received", {
      bodyType: typeof payload,
      keys: payload && typeof payload === "object" ? Object.keys(payload as Record<string, unknown>) : undefined,
    });
    const entries = extractEntries(payload);

    let processed = 0;

    const summaries = entries.filter((entry) => entry && !entry.callbackURL);
    const callbacks = entries.filter((entry) => entry?.callbackURL);

    if (callbacks.length > 0) {
      for (const callback of callbacks) {
        const callbackURL = callback?.callbackURL;
        if (!callbackURL) continue;

        console.info("Garmin dailies callback entry", {
          keys: Object.keys(callback as Record<string, unknown>),
        });

        const userAccessToken =
          typeof (callback as Record<string, unknown>).userAccessToken === "string"
            ? ((callback as Record<string, unknown>).userAccessToken as string)
            : undefined;

        try {
          const authorizationHeader = userAccessToken
            ? `Bearer ${userAccessToken}`
            : buildOAuthHeader(new URL(callbackURL), "GET");

          const response = await fetch(callbackURL, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip,deflate",
              Authorization: authorizationHeader,
              "User-Agent": "Adapt2Life-GarminWebhook/1.0",
            },
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => undefined);
            console.error("Garmin dailies callback failed", {
              callbackURL,
              status: response.status,
              statusText: response.statusText,
              body: errorBody,
            });
            continue;
          }

          const fetchedPayload = await response.json().catch((error: unknown) => {
            console.error("Garmin dailies callback json parse failed", error);
            return null;
          });

          if (!fetchedPayload) continue;

          const fetchedEntries = extractEntries(fetchedPayload);
          processed += await processSummaryEntries(fetchedEntries);
        } catch (error) {
          console.error("Garmin dailies callback fetch failed", { callbackURL, error });
        }
      }
    }

    if (summaries.length > 0) {
      processed += await processSummaryEntries(summaries);
    }

    const received = summaries.length + callbacks.length;

    return NextResponse.json({ received, processed }, { status: 200 });
  } catch (error) {
    console.error("Garmin dailies webhook failed", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

async function processSummaryEntries(entries: GarminDailyPayload[]): Promise<number> {
  if (entries.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const entry of entries) {
    const garminUserId = resolveGarminUserId(entry);
    if (!garminUserId) {
      continue;
    }

    const [connection] = await db
      .select({ userId: garminConnections.userId })
      .from(garminConnections)
      .where(eq(garminConnections.garminUserId, garminUserId))
      .limit(1);

    if (!connection) {
      continue;
    }

    const summaryId = resolveSummaryId(entry, garminUserId);
    const calendarDate = resolveCalendarDate(entry);

    await db
      .insert(garminDailySummaries)
      .values({
        userId: connection.userId,
        garminUserId,
        summaryId,
        calendarDate,
        steps: coerceInteger(entry.steps ?? entry.totalSteps),
        distanceMeters: coerceInteger(entry.distanceInMeters ?? entry.distanceMeters),
        calories: coerceInteger(entry.calories ?? entry.totalKilocalories),
        stressLevel: coerceInteger(entry.maxStressLevel ?? entry.averageStressLevel ?? entry.minStressLevel),
        sleepSeconds: coerceInteger(entry.sleepDurationInSeconds ?? entry.sleepSeconds),
        raw: entry,
      })
      .onConflictDoUpdate({
        target: garminDailySummaries.summaryId,
        set: {
          steps: coerceInteger(entry.steps ?? entry.totalSteps),
          distanceMeters: coerceInteger(entry.distanceInMeters ?? entry.distanceMeters),
          calories: coerceInteger(entry.calories ?? entry.totalKilocalories),
          stressLevel: coerceInteger(entry.maxStressLevel ?? entry.averageStressLevel ?? entry.minStressLevel),
          sleepSeconds: coerceInteger(entry.sleepDurationInSeconds ?? entry.sleepSeconds),
          raw: entry,
        },
      });

    processed += 1;
  }

  return processed;
}

export async function GET() {
  return new Response("Garmin dailies webhook ready", { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

const encode = (value: string) => encodeURIComponent(value).replace(/[!*'()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const buildOAuthHeader = (callbackUrl: URL, method: string): string => {
  const consumerKey = env.GARMIN_CLIENT_ID;
  const consumerSecret = env.GARMIN_CLIENT_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Garmin consumer key/secret missing for OAuth callback");
  }

  const oauthToken = callbackUrl.searchParams.get("token") ?? undefined;

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  if (oauthToken) {
    oauthParams.oauth_token = oauthToken;
  }

  const baseUrl = `${callbackUrl.protocol}//${callbackUrl.host}${callbackUrl.pathname}`;

  const signatureParams: Array<[string, string]> = [
    ...Array.from(callbackUrl.searchParams.entries()),
    ...Object.entries(oauthParams),
  ].map(([key, value]) => [key, value ?? ""]);

  signatureParams.sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey === bKey) {
      return aValue.localeCompare(bValue);
    }
    return aKey.localeCompare(bKey);
  });

  const parameterString = signatureParams.map(([key, value]) => `${encode(key)}=${encode(value)}`).join("&");
  const baseString = `${method.toUpperCase()}&${encode(baseUrl)}&${encode(parameterString)}`;
  const signingKey = `${encode(consumerSecret)}&${oauthToken ? encode(oauthToken) : ""}`;

  const oauthSignature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams = {
    ...oauthParams,
    oauth_signature: oauthSignature,
  };

  const header =
    "OAuth " +
    Object.entries(headerParams)
      .map(([key, value]) => `${encode(key)}="${encode(value)}"`)
      .join(", ");

  return header;
};
