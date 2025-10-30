import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { garminWebhookEvents } from "@/db/schema";
import {
  GarminConnectionRecord,
  fetchGarminConnectionByGarminUserId,
} from "@/lib/services/garmin-connections";

const SUPPORTED_SUMMARY_TYPES = new Set([
  "activities",
  "activityDetails",
  "activityFiles",
  "manuallyUpdatedActivities",
  "moveIQ",
  "deregistrations",
  "userPermissionsChange",
  "bloodPressure",
  "bodyCompositions",
  "epochs",
  "hrv",
  "healthSnapshot",
  "pulseOx",
  "respiration",
  "skinTemp",
  "sleeps",
  "stressDetails",
  "userMetrics",
  "womenHealth",
]);

const SUMMARY_KEY_ALIASES: Record<string, string[]> = {
  activities: ["activities", "activitySummaries"],
  activityDetails: ["activityDetails"],
  activityFiles: ["activityFiles"],
  manuallyUpdatedActivities: ["manuallyUpdatedActivities"],
  moveIQ: ["moveIQ", "moveIqEvents"],
  deregistrations: ["deregistrations"],
  userPermissionsChange: ["userPermissionsChange", "userPermissionChange"],
  bloodPressure: ["bloodPressure", "bloodPressures"],
  bodyCompositions: ["bodyCompositions", "bodyComposition"],
  epochs: ["epochs"],
  hrv: ["hrv", "hrvSummaries"],
  healthSnapshot: ["healthSnapshot", "healthSnapshots"],
  pulseOx: ["pulseOx", "pulseox"],
  respiration: ["respiration", "respirationSummaries", "allDayRespiration"],
  skinTemp: ["skinTemp", "skinTemps"],
  sleeps: ["sleeps"],
  stressDetails: ["stressDetails"],
  userMetrics: ["userMetrics"],
  womenHealth: ["womenHealth", "womenHealthData"],
};

type GarminGenericPayload = Record<string, unknown>;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ summaryType: string }> },
) {
  const { summaryType } = await params;

  if (summaryType === "dailies") {
    return NextResponse.json({ error: "Use /push/dailies endpoint." }, { status: 405 });
  }

  if (!SUPPORTED_SUMMARY_TYPES.has(summaryType)) {
    return NextResponse.json({ error: `Unsupported Garmin webhook type "${summaryType}".` }, { status: 404 });
  }

  try {
    const payload = await request.json();
    console.info(`Garmin push /${summaryType} received`, {
      bodyType: typeof payload,
      keys: payload && typeof payload === "object" ? Object.keys(payload as Record<string, unknown>) : undefined,
    });

    const entries = extractEntriesForSummary(payload, summaryType);
    const connectionCache = new Map<string, GarminConnectionRecord>();
    let processed = 0;

    for (const entry of entries) {
      const garminUserId = resolveGarminUserId(entry);
      if (!garminUserId) {
        continue;
      }

      const connection = await getConnectionWithCache(garminUserId, connectionCache);
      if (!connection) {
        continue;
      }

      await db.insert(garminWebhookEvents).values({
        userId: connection.userId,
        garminUserId,
        type: summaryType,
        entityId: resolveEntityId(entry),
        payload: entry,
      });

      processed += 1;
    }

    return NextResponse.json({ received: entries.length, processed }, { status: 200 });
  } catch (error) {
    console.error(`Garmin ${summaryType} webhook failed`, error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ summaryType: string }> },
) {
  const { summaryType } = await params;
  return new Response(`Garmin ${summaryType} webhook ready`, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

const extractEntriesForSummary = (payload: unknown, summaryType: string): GarminGenericPayload[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as GarminGenericPayload[];
  }

  if (typeof payload === "object") {
    const aliases = SUMMARY_KEY_ALIASES[summaryType] ?? [summaryType, `${summaryType}s`];
    for (const key of aliases) {
      const maybeArray = (payload as Record<string, unknown>)[key];
      if (Array.isArray(maybeArray)) {
        return maybeArray as GarminGenericPayload[];
      }
    }

    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray)) {
      return firstArray as GarminGenericPayload[];
    }
  }

  return [];
};

const resolveGarminUserId = (entry: GarminGenericPayload): string | null => {
  const record = entry as Record<string, unknown>;
  const candidates = [
    record.userId,
    record.userProfileId,
    record.ownerId,
    record.profileId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }

  return null;
};

const resolveEntityId = (entry: GarminGenericPayload): string | null => {
  const record = entry as Record<string, unknown>;
  const candidates = [
    record.summaryId,
    record.activityId,
    record.snapshotId,
    record.measurementId,
    record.id,
    record.fileId,
    record.startTimeInSeconds,
    record.changeTimeInSeconds,
    record.recordId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }

  return null;
};

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
