import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, garminDailySummaries } from "@/db/schema";

type GarminDailyPayload = {
  summaryId?: string;
  calendarDate?: string;
  calendarDateLocal?: string;
  startTimeGmt?: string;
  endTimeGmt?: string;
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

    if (entries.length === 0) {
      return NextResponse.json({ received: 0, processed: 0 }, { status: 200 });
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

    return NextResponse.json({ received: entries.length, processed }, { status: 200 });
  } catch (error) {
    console.error("Garmin dailies webhook failed", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
