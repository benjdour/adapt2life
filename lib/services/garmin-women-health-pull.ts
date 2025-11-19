import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, garminPullCursors, garminWebhookEvents, users } from "@/db/schema";
import { Logger } from "@/lib/logger";
import { extractEntriesForSummary, resolveEntityId, resolveGarminUserId } from "@/lib/garminWebhookIngestion";
import { ensureGarminAccessToken, GarminConnectionRecord } from "@/lib/services/garmin-connections";

const WOMEN_HEALTH_TYPE = "womenHealth" as const;
// Garmin expose Menstrual Cycle Tracking (Women Health) via the MCT endpoint on the wellness API host.
const GARMIN_WOMEN_HEALTH_URL = "https://apis.garmin.com/wellness-api/rest/mct";
const DEFAULT_LOOKBACK_SECONDS = 60 * 60 * 24 * 30; // 30 jours
const DEFAULT_BUFFER_SECONDS = 60 * 60 * 2; // relecture de 2 h pour éviter les trous
const DEFAULT_CHUNK_SECONDS = 60 * 60 * 24; // Garmin limite la fenêtre à 24h
const MIN_RANGE_SECONDS = 60 * 5; // éviter des appels inutiles (<5 min)

type WomenHealthConnectionRow = GarminConnectionRecord & {
  gender: string | null;
  cursorId: number | null;
  cursorLastUploadEndTime: Date | null;
};

export type WomenHealthPullStats = {
  connectionsConsidered: number;
  eligibleConnections: number;
  triggeredConnections: number;
  successfulConnections: number;
  requests: number;
  inserted: number;
};

type WomenHealthPullOptions = {
  logger: Logger;
  lookbackSeconds?: number;
  bufferSeconds?: number;
  chunkSeconds?: number;
};

type WomenHealthRange = { start: number; end: number };

export type WomenHealthPullPlan = {
  ranges: WomenHealthRange[];
  earliestStart: number;
  latestEnd: number;
};

export const computeWomenHealthPullPlan = (
  lastUploadEndTime: Date | null,
  now: Date,
  options: {
    lookbackSeconds?: number;
    bufferSeconds?: number;
    chunkSeconds?: number;
  } = {},
): WomenHealthPullPlan => {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (!Number.isFinite(nowSeconds) || nowSeconds <= 0) {
    return { ranges: [], earliestStart: 0, latestEnd: 0 };
  }

  const lookbackSeconds = Math.max(lookbackSecondsOrDefault(options.lookbackSeconds), MIN_RANGE_SECONDS);
  const bufferSeconds = Math.max(options.bufferSeconds ?? DEFAULT_BUFFER_SECONDS, 0);
  const chunkSeconds = Math.max(options.chunkSeconds ?? DEFAULT_CHUNK_SECONDS, MIN_RANGE_SECONDS);

  const minStart = Math.max(0, nowSeconds - lookbackSeconds);

  let startingPoint = minStart;
  if (lastUploadEndTime) {
    startingPoint = Math.floor(lastUploadEndTime.getTime() / 1000) - bufferSeconds;
  }

  if (!Number.isFinite(startingPoint)) {
    startingPoint = minStart;
  }

  const boundedStart = Math.min(nowSeconds, Math.max(minStart, startingPoint));

  const ranges: WomenHealthRange[] = [];
  let cursor = boundedStart;

  while (cursor < nowSeconds) {
    const chunkEnd = Math.min(cursor + chunkSeconds, nowSeconds);
    if (chunkEnd - cursor < MIN_RANGE_SECONDS && chunkEnd !== nowSeconds) {
      cursor = chunkEnd;
      continue;
    }
    ranges.push({ start: cursor, end: chunkEnd });
    cursor = chunkEnd;
  }

  return {
    ranges,
    earliestStart: ranges[0]?.start ?? boundedStart,
    latestEnd: nowSeconds,
  };
};

const lookbackSecondsOrDefault = (value?: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  return DEFAULT_LOOKBACK_SECONDS;
};

export const pullWomenHealthData = async (options: WomenHealthPullOptions): Promise<WomenHealthPullStats> => {
  const logger = options.logger;
  const now = new Date();
  const rows = await fetchEligibleConnections();
  const eligibleRows = rows.filter((row) => normalizeGender(row.gender) === "femme");

  const stats: WomenHealthPullStats = {
    connectionsConsidered: rows.length,
    eligibleConnections: eligibleRows.length,
    triggeredConnections: 0,
    successfulConnections: 0,
    requests: 0,
    inserted: 0,
  };

  for (const row of eligibleRows) {
    const plan = computeWomenHealthPullPlan(row.cursorLastUploadEndTime, now, {
      lookbackSeconds: options.lookbackSeconds,
      bufferSeconds: options.bufferSeconds,
      chunkSeconds: options.chunkSeconds,
    });

    if (plan.ranges.length === 0) {
      continue;
    }

    stats.triggeredConnections += 1;

    const connectionRecord: GarminConnectionRecord = {
      id: row.id,
      userId: row.userId,
      garminUserId: row.garminUserId,
      accessTokenEncrypted: row.accessTokenEncrypted,
      refreshTokenEncrypted: row.refreshTokenEncrypted,
      accessTokenExpiresAt: row.accessTokenExpiresAt,
      tokenType: row.tokenType,
      scope: row.scope,
    };

    try {
      const { accessToken, connection } = await ensureGarminAccessToken(connectionRecord);
      let lastCompletedEnd: number | null = null;

      for (const range of plan.ranges) {
        try {
          const entries = await fetchWomenHealthRange(accessToken, range.start, range.end, logger);
          stats.requests += 1;
          const insertedForRange = await persistWomenHealthEntries(connection, entries, logger);
          stats.inserted += insertedForRange;
          lastCompletedEnd = range.end;
        } catch (rangeError) {
          logger.error("garmin women health pull chunk failed", {
            garminUserId: connection.garminUserId,
            start: range.start,
            end: range.end,
            error: rangeError,
          });
          lastCompletedEnd = null;
          break;
        }
      }

      if (lastCompletedEnd !== null) {
        await upsertPullCursor(connection.userId, connection.garminUserId, lastCompletedEnd);
        stats.successfulConnections += 1;
      }
    } catch (error) {
      logger.error("garmin women health pull failed", {
        garminUserId: row.garminUserId,
        error,
      });
    }
  }

  logger.info("garmin women health pull completed", stats);
  return stats;
};

const fetchEligibleConnections = async (): Promise<WomenHealthConnectionRow[]> => {
  const rows = await db
    .select({
      id: garminConnections.id,
      userId: garminConnections.userId,
      garminUserId: garminConnections.garminUserId,
      accessTokenEncrypted: garminConnections.accessTokenEncrypted,
      refreshTokenEncrypted: garminConnections.refreshTokenEncrypted,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
      tokenType: garminConnections.tokenType,
      scope: garminConnections.scope,
      gender: users.gender,
      cursorId: garminPullCursors.id,
      cursorLastUploadEndTime: garminPullCursors.lastUploadEndTime,
    })
    .from(garminConnections)
    .innerJoin(users, eq(users.id, garminConnections.userId))
    .leftJoin(
      garminPullCursors,
      and(eq(garminPullCursors.userId, garminConnections.userId), eq(garminPullCursors.type, WOMEN_HEALTH_TYPE)),
    );

  return rows as WomenHealthConnectionRow[];
};

const normalizeGender = (gender: string | null): string | null => {
  return typeof gender === "string" ? gender.trim().toLowerCase() : null;
};

const fetchWomenHealthRange = async (
  accessToken: string,
  start: number,
  end: number,
  logger: Logger,
): Promise<ReturnType<typeof extractEntriesForSummary>> => {
  const url = new URL(GARMIN_WOMEN_HEALTH_URL);
  url.searchParams.set("uploadStartTimeInSeconds", Math.max(0, Math.floor(start)).toString());
  url.searchParams.set("uploadEndTimeInSeconds", Math.max(0, Math.floor(end)).toString());

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (response.status === 204) {
    return [];
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Women Health pull failed (${response.status}): ${responseText || "empty response"}`);
  }

  if (!responseText) {
    return [];
  }

  try {
    const payload = JSON.parse(responseText) as unknown;
    return extractEntriesForSummary(payload, WOMEN_HEALTH_TYPE);
  } catch (error) {
    logger.warn("garmin women health invalid json", {
      start,
      end,
      error,
    });
    return [];
  }
};

const persistWomenHealthEntries = async (
  connection: GarminConnectionRecord,
  entries: ReturnType<typeof extractEntriesForSummary>,
  logger: Logger,
): Promise<number> => {
  if (entries.length === 0) {
    return 0;
  }

  let inserted = 0;

  for (const entry of entries) {
    const garminUserId = resolveGarminUserId(entry);
    if (!garminUserId || garminUserId !== connection.garminUserId) {
      continue;
    }

    const entityId = resolveEntityId(entry);
    if (entityId) {
      const existing = await db
        .select({ id: garminWebhookEvents.id })
        .from(garminWebhookEvents)
        .where(
          and(
            eq(garminWebhookEvents.garminUserId, garminUserId),
            eq(garminWebhookEvents.type, WOMEN_HEALTH_TYPE),
            eq(garminWebhookEvents.entityId, entityId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        continue;
      }
    }

    await db.insert(garminWebhookEvents).values({
      userId: connection.userId,
      garminUserId,
      type: WOMEN_HEALTH_TYPE,
      entityId: entityId ?? null,
      payload: entry,
    });

    inserted += 1;
  }

  if (inserted > 0) {
    logger.info("garmin women health entries stored", {
      garminUserId: connection.garminUserId,
      inserted,
    });
  }

  return inserted;
};

const upsertPullCursor = async (userId: number, garminUserId: string, lastUploadEndSeconds: number) => {
  const lastUploadEndTime = new Date(lastUploadEndSeconds * 1000);
  await db
    .insert(garminPullCursors)
    .values({
      userId,
      garminUserId,
      type: WOMEN_HEALTH_TYPE,
      lastUploadEndTime,
    })
    .onConflictDoUpdate({
      target: [garminPullCursors.userId, garminPullCursors.type],
      set: {
        garminUserId,
        lastUploadEndTime,
        updatedAt: new Date(),
      },
    });
};
