import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { garminDailySummaries, garminWebhookEvents } from "@/db/schema";
import {
  GarminConnectionRecord,
  fetchGarminConnectionByGarminUserId,
} from "@/lib/services/garmin-connections";
import { createLogger } from "@/lib/logger";
import { verifyGarminSignature } from "@/lib/security/garminSignature";

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

export async function POST(request: NextRequest) {
  const logger = createLogger("garmin-webhook-dailies", { headers: request.headers });
  const rawBody = await request.text();
  const signatureCheck = verifyGarminSignature(request.headers, rawBody);
  if (!signatureCheck.valid) {
    const status = signatureCheck.reason === "GARMIN_WEBHOOK_SECRET missing" ? 500 : 401;
    logger.warn("garmin dailies invalid signature", { reason: signatureCheck.reason });
    return NextResponse.json({ error: "Invalid signature" }, { status });
  }

  try {
    const payload = rawBody.length > 0 ? JSON.parse(rawBody) : null;
    logger.info("garmin dailies received", {
      bodyType: typeof payload,
      keys: payload && typeof payload === "object" ? Object.keys(payload as Record<string, unknown>) : undefined,
    });
    const entries = extractEntries(payload);

    const connectionCache = new Map<string, GarminConnectionRecord>();

    const processed = await processSummaryEntries(entries, (garminUserId) =>
      getConnectionWithCache(garminUserId, connectionCache),
    );

    logger.info("garmin dailies processed", { received: entries.length, processed });
    return NextResponse.json({ received: entries.length, processed }, { status: 200 });
  } catch (error) {
    logger.error("garmin dailies webhook failed", { error });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

const getConnectionWithCache = async (
  garminUserId: string,
  cache: Map<string, GarminConnectionRecord>,
): Promise<GarminConnectionRecord | null> => {
  const cached = cache.get(garminUserId);
  if (cached) {
    return cached;
  }
  const connection = await fetchGarminConnectionByGarminUserId(garminUserId);
  if (connection) {
    cache.set(garminUserId, connection);
  }
  return connection;
};

async function processSummaryEntries(
  entries: GarminDailyPayload[],
  getConnection: (garminUserId: string) => Promise<GarminConnectionRecord | null>,
): Promise<number> {
  if (entries.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const entry of entries) {
    const garminUserId = resolveGarminUserId(entry);
    if (!garminUserId) {
      continue;
    }

    const connection = await getConnection(garminUserId);

    if (!connection) {
      continue;
    }

    const summaryId = resolveSummaryId(entry, garminUserId);
    const calendarDate = resolveCalendarDate(entry);

    await db.insert(garminWebhookEvents).values({
      userId: connection.userId,
      garminUserId,
      type: "dailies",
      entityId: summaryId,
      payload: entry,
    });

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
