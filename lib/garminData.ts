import { desc, eq, and } from "drizzle-orm";

import { db } from "@/db";
import {
  garminConnections,
  garminDailySummaries,
  garminWebhookEvents,
} from "@/db/schema";
import { TrainingScoreData, mockGarminData } from "@/lib/trainingScore";

type GarminWebhookEventRow = {
  payload: unknown;
  createdAt: Date | null;
};

export type GarminSectionItem = {
  label: string;
  value: string | null;
  hint?: string;
};

export type GarminSection = {
  title: string;
  description?: string;
  items: GarminSectionItem[];
};

export type GarminConnectionSummary = {
  garminUserId: string | null;
  updatedAt: string | null;
  accessTokenExpiresAt: string | null;
};

export type GarminDataBundle = {
  connection: GarminConnectionSummary | null;
  sections: GarminSection[];
  trainingGaugeData: TrainingScoreData;
  usedRealtimeMetrics: boolean;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractNumber = (candidate: unknown): number | null => {
  const direct = toNumber(candidate);
  if (direct !== null) {
    return direct;
  }

  if (Array.isArray(candidate)) {
    for (const entry of candidate) {
      const nested = extractNumber(entry);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  }

  if (candidate && typeof candidate === "object") {
    const record = candidate as Record<string, unknown>;
    const priorityKeys = [
      "value",
      "score",
      "avg",
      "average",
      "mean",
      "amount",
      "total",
      "overall",
      "overallScore",
      "overallValue",
      "numericValue",
      "current",
      "currentLevel",
    ];

    for (const key of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const nested = extractNumber(record[key]);
        if (nested !== null) {
          return nested;
        }
      }
    }

    const values = Object.values(record);
    for (const value of values) {
      const nested = extractNumber(value);
      if (nested !== null) {
        return nested;
      }
    }
  }

  return null;
};

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return null;
};

const toSnakeCase = (input: string): string =>
  input
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();

const toCamelCase = (input: string): string =>
  input.replace(/[_-](\w)/g, (_, c: string) => c.toUpperCase());

const keyVariants = (segment: string): string[] => {
  const variants = new Set<string>();
  variants.add(segment);
  variants.add(segment.toLowerCase());
  variants.add(segment.toUpperCase());

  const snake = toSnakeCase(segment);
  variants.add(snake);

  const camel = toCamelCase(segment);
  variants.add(camel);

  if (camel.length > 0) {
    variants.add(camel[0].toUpperCase() + camel.slice(1));
  }

  if (snake.length > 0) {
    variants.add(snake.replace(/_/g, ""));
  }

  return Array.from(variants);
};

const getFromObject = (source: unknown, segment: string): unknown => {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keyVariants(segment)) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return (source as Record<string, unknown>)[key];
    }
  }
  return undefined;
};

const getPathValue = (source: unknown, path: string): unknown => {
  if (!source) return undefined;
  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isNaN(index) && current[index] !== undefined) {
        current = current[index];
        continue;
      }
      return undefined;
    }

    current = getFromObject(current, segment);
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
};

const pickNumber = (
  sources: Array<Record<string, unknown> | undefined>,
  paths: string[],
): number | null => {
  for (const source of sources) {
    if (!source) continue;
    for (const path of paths) {
      const candidate = getPathValue(source, path);
      const parsed = extractNumber(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
};

const pickString = (
  sources: Array<Record<string, unknown> | undefined>,
  paths: string[],
): string | null => {
  for (const source of sources) {
    if (!source) continue;
    for (const path of paths) {
      const candidate = getPathValue(source, path);
      const parsed = toTrimmedString(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
  }
  return null;
};

const pickObject = <T = Record<string, unknown>>(
  sources: Array<Record<string, unknown> | undefined>,
  path: string,
): T | undefined => {
  for (const source of sources) {
    if (!source) continue;
    const candidate = getPathValue(source, path);
    if (candidate && typeof candidate === "object") {
      return candidate as T;
    }
  }
  return undefined;
};

const formatHours = (seconds: number | null | undefined, digits = 1): string | null => {
  if (seconds === null || seconds === undefined) return null;
  return `${(seconds / 3600).toFixed(digits)} h`;
};

const formatMinutes = (seconds: number | null | undefined): string | null => {
  if (seconds === null || seconds === undefined) return null;
  return `${Math.round(seconds / 60)} min`;
};

const formatDateTime = (
  seconds: number | null | undefined,
  offsetSeconds: number | null | undefined = 0,
): string | null => {
  if (seconds === null || seconds === undefined) return null;
  const offset = offsetSeconds ?? 0;
  try {
    return new Date((seconds + offset) * 1000).toLocaleString("fr-FR", { hour12: false });
  } catch {
    return null;
  }
};

const formatPercentage = (value: number | null | undefined, fractionDigits = 1): string | null => {
  if (value === null || value === undefined) return null;
  return `${value.toFixed(fractionDigits)} %`;
};

const formatKcal = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${Math.round(value).toLocaleString("fr-FR")} kcal`;
};

const formatBpm = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${Math.round(value)} bpm`;
};

const formatMs = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${Math.round(value)} ms`;
};

const formatBrpm = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${value.toFixed(1)} brpm`;
};

const formatKg = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${value.toFixed(1)} kg`;
};

const formatCelsius = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return `${value.toFixed(1)} °C`;
};

const computeStressDurations = (
  map: unknown,
): { low: string | null; moderate: string | null; high: string | null } | null => {
  if (!map || typeof map !== "object") return null;

  const entries = Object.entries(map as Record<string, unknown>)
    .map(([offset, value]) => {
      const offsetSec = Number(offset);
      const stressValue = Number(value);
      if (!Number.isFinite(offsetSec) || !Number.isFinite(stressValue)) {
        return null;
      }
      return { offset: offsetSec, stress: stressValue };
    })
    .filter((entry): entry is { offset: number; stress: number } => Boolean(entry))
    .sort((a, b) => a.offset - b.offset);

  if (entries.length === 0) return null;

  const durations: Record<string, number> = {
    low: 0,
    moderate: 0,
    high: 0,
  };

  for (let index = 0; index < entries.length; index += 1) {
    const current = entries[index];
    const next = entries[index + 1];
    const duration = next ? next.offset - current.offset : 60;

    if (current.stress < 34) durations.low += duration;
    else if (current.stress < 67) durations.moderate += duration;
    else durations.high += duration;
  }

  const formatBucket = (seconds: number): string | null =>
    seconds > 0 ? formatMinutes(seconds) : null;

  return {
    low: formatBucket(durations.low),
    moderate: formatBucket(durations.moderate),
    high: formatBucket(durations.high),
  };
};

const averageNumericValues = (input: unknown, options?: { excludeZero?: boolean }): number | null => {
  if (!input || typeof input !== "object") return null;
  const values = Object.values(input as Record<string, unknown>)
    .map((value) => toNumber(value))
    .filter((value): value is number => value !== null);

  if (options?.excludeZero) {
    const filtered = values.filter((value) => value !== 0);
    if (filtered.length === 0) return null;
    const filteredSum = filtered.reduce((accumulator, value) => accumulator + value, 0);
    return filteredSum / filtered.length;
  }

  if (values.length === 0) return null;
  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  return sum / values.length;
};

export const fetchGarminData = async (localUserId: string | number): Promise<GarminDataBundle> => {
  const numericUserId = typeof localUserId === "string" ? Number(localUserId) : localUserId;

  if (!Number.isFinite(numericUserId)) {
    return {
      connection: null,
      sections: [],
      trainingGaugeData: mockGarminData(),
      usedRealtimeMetrics: false,
    };
  }

  const [connectionRow] = await db
    .select({
      garminUserId: garminConnections.garminUserId,
      updatedAt: garminConnections.updatedAt,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
      userId: garminConnections.userId,
    })
    .from(garminConnections)
    .where(eq(garminConnections.userId, numericUserId))
    .limit(1);

  const connection: GarminConnectionSummary | null = connectionRow
    ? {
        garminUserId: connectionRow.garminUserId ?? null,
        updatedAt: connectionRow.updatedAt ? connectionRow.updatedAt.toISOString() : null,
        accessTokenExpiresAt: connectionRow.accessTokenExpiresAt ? connectionRow.accessTokenExpiresAt.toISOString() : null,
      }
    : null;

  const dailySummaries = await db
    .select({
      id: garminDailySummaries.id,
      calendarDate: garminDailySummaries.calendarDate,
      steps: garminDailySummaries.steps,
      distanceMeters: garminDailySummaries.distanceMeters,
      calories: garminDailySummaries.calories,
      stressLevel: garminDailySummaries.stressLevel,
      sleepSeconds: garminDailySummaries.sleepSeconds,
      createdAt: garminDailySummaries.createdAt,
      raw: garminDailySummaries.raw,
    })
    .from(garminDailySummaries)
    .where(eq(garminDailySummaries.userId, numericUserId))
    .orderBy(desc(garminDailySummaries.createdAt))
    .limit(30);

  const latestSummary = dailySummaries[0] ?? null;
  const latestDailyRaw = (latestSummary?.raw as Record<string, unknown> | undefined) ?? undefined;
  const dailyArrayCandidate = getPathValue(latestDailyRaw, "dailies") ?? getPathValue(latestDailyRaw, "summary.dailies");
  const firstDailyEntry =
    Array.isArray(dailyArrayCandidate) && dailyArrayCandidate.length > 0 && typeof dailyArrayCandidate[0] === "object"
      ? (dailyArrayCandidate[0] as Record<string, unknown>)
      : undefined;
  const dailySummaryNode =
    firstDailyEntry && typeof firstDailyEntry === "object"
      ? pickObject<Record<string, unknown>>([firstDailyEntry], "summary") ?? undefined
      : undefined;
  const sleepSummaryNode = pickObject<Record<string, unknown>>([latestDailyRaw], "sleepSummary") ?? undefined;
  const firstEntrySleepSummary = pickObject<Record<string, unknown>>([firstDailyEntry], "sleepSummary") ?? undefined;
  const summarySleepNode = pickObject<Record<string, unknown>>([dailySummaryNode], "sleepSummary") ?? undefined;
  const topLevelSleepNode = pickObject<Record<string, unknown>>([latestDailyRaw], "sleep") ?? undefined;
  const nestedSummarySleepNode = pickObject<Record<string, unknown>>([latestDailyRaw], "summary.sleep") ?? undefined;

  let latestSleep: GarminWebhookEventRow | null = null;
  let latestHrv: GarminWebhookEventRow | null = null;
  let latestStress: GarminWebhookEventRow | null = null;
  let latestUserMetrics: GarminWebhookEventRow | null = null;
  let latestPulseOx: GarminWebhookEventRow | null = null;
  let latestSkinTemp: GarminWebhookEventRow | null = null;
  let latestBodyComposition: GarminWebhookEventRow | null = null;
  let latestRespiration: GarminWebhookEventRow | null = null;
  let latestActivity: GarminWebhookEventRow | null = null;
  let latestActivityDetails: GarminWebhookEventRow | null = null;

  if (connectionRow) {
    const fetchLatestEvent = async (type: string): Promise<GarminWebhookEventRow | null> => {
      const [event] = await db
        .select({
          payload: garminWebhookEvents.payload,
          createdAt: garminWebhookEvents.createdAt,
        })
        .from(garminWebhookEvents)
        .where(and(eq(garminWebhookEvents.userId, numericUserId), eq(garminWebhookEvents.type, type)))
        .orderBy(desc(garminWebhookEvents.createdAt))
        .limit(1);

      return event ?? null;
    };

    [
      latestSleep,
      latestHrv,
      latestStress,
      latestUserMetrics,
      latestPulseOx,
      latestSkinTemp,
      latestBodyComposition,
      latestRespiration,
      latestActivity,
      latestActivityDetails,
    ] = await Promise.all([
      fetchLatestEvent("sleeps"),
      fetchLatestEvent("hrv"),
      fetchLatestEvent("stressDetails"),
      fetchLatestEvent("userMetrics"),
      fetchLatestEvent("pulseOx"),
      fetchLatestEvent("skinTemp"),
      fetchLatestEvent("bodyCompositions"),
      fetchLatestEvent("respiration"),
      fetchLatestEvent("activities"),
      fetchLatestEvent("activityDetails"),
    ]);
  }

  const bodyBatteryLevel = pickNumber(
    [latestDailyRaw],
    [
      "bodyBatteryLevel",
      "bodyBatteryDynamicFeedbackEvent.bodyBatteryLevel",
      "bodyBatteryStatus.currentLevel",
    ],
  );
  const bodyBatteryCharged = pickNumber(
    [latestDailyRaw],
    [
      "bodyBatteryChargedValue",
      "bodyBatteryStatus.chargedValue",
    ],
  );
  const bodyBatteryDrained = pickNumber(
    [latestDailyRaw],
    [
      "bodyBatteryDrainedValue",
      "bodyBatteryStatus.drainedValue",
    ],
  );
  const bodyBatteryTrend =
    pickString(
      [latestDailyRaw],
      [
        "bodyBatteryTrend",
        "bodyBatteryDynamicFeedbackEvent.bodyBatteryTrend",
        "bodyBatteryStatus.trend",
      ],
    ) ?? undefined;
  const bodyBatteryParts: string[] = [];
  if (bodyBatteryLevel !== null) bodyBatteryParts.push(`${Math.round(bodyBatteryLevel)}/100`);
  if (bodyBatteryCharged !== null) bodyBatteryParts.push(`+${Math.round(bodyBatteryCharged)}`);
  if (bodyBatteryDrained !== null) bodyBatteryParts.push(`-${Math.round(bodyBatteryDrained)}`);
  if (bodyBatteryTrend) bodyBatteryParts.push(`tendance ${bodyBatteryTrend.toLowerCase()}`);
  const bodyBatteryDisplay = bodyBatteryParts.length > 0 ? bodyBatteryParts.join(" · ") : null;

  const sleepPayload = (latestSleep?.payload as Record<string, unknown>) ?? undefined;

  const sleepNodeSources: Array<unknown> = [
    sleepPayload,
    sleepSummaryNode,
    firstEntrySleepSummary,
    summarySleepNode,
    topLevelSleepNode,
    nestedSummarySleepNode,
    getPathValue(latestDailyRaw, "sleep"),
    getPathValue(latestDailyRaw, "summary.sleep"),
    getPathValue(latestDailyRaw, "summary.sleep.stages"),
    getPathValue(sleepPayload, "sleep"),
    dailySummaryNode,
    firstDailyEntry,
    latestDailyRaw,
  ];

  const sleepNodes: Array<Record<string, unknown>> = sleepNodeSources.flatMap((source) => {
    if (!source) return [];
    if (Array.isArray(source)) {
      return source.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object");
    }
    if (typeof source === "object") {
      return [source as Record<string, unknown>];
    }
    return [];
  });

  let sleepDurationSeconds =
    pickNumber(
      sleepNodes,
      [
        "sleepDurationInSeconds",
        "sleepDuration",
        "sleepSummary.sleepDurationInSeconds",
        "sleepSummary.durationInSeconds",
        "sleepSummary.duration",
        "sleepSummary.totalSleepSeconds",
        "sleepSummary.totalSleepTimeInSeconds",
        "summary.sleepDurationInSeconds",
        "summary.sleepDuration",
        "summary.sleep.sleepDurationInSeconds",
        "summary.totalSleepSeconds",
        "totalSleepSeconds",
        "sleepSeconds",
      ],
    ) ?? toNumber(latestSummary?.sleepSeconds);
  if (sleepDurationSeconds === null) {
    const candidateEntries = [getPathValue(latestDailyRaw, "sleep"), getPathValue(sleepPayload, "sleep")].filter(
      (value): value is Array<unknown> => Array.isArray(value),
    );
    for (const array of candidateEntries) {
      for (const entry of array) {
        if (entry && typeof entry === "object") {
          const candidate = pickNumber([
            entry as Record<string, unknown>,
            pickObject<Record<string, unknown>>([entry as Record<string, unknown>], "sleepSummary") ?? undefined,
          ], [
            "sleepSummary.totalSleepSeconds",
            "sleepSummary.totalSleepTimeInSeconds",
            "sleepSummary.sleepDurationInSeconds",
            "sleepSummary.durationInSeconds",
            "sleepDurationInSeconds",
          ]);
          if (candidate !== null) {
            sleepDurationSeconds = candidate;
            break;
          }
        }
      }
      if (sleepDurationSeconds !== null) break;
    }
  }
  let sleepScore =
    pickNumber(
      sleepNodes,
      [
        "sleepScore",
        "sleepScoreFeedback.score",
        "sleepScoreValue",
        "sleepSummary.sleepScore",
        "sleepSummary.overallSleepScore",
        "sleepSummary.totalScore",
        "summary.sleepScore",
        "summary.sleep.sleepScore",
        "sleep.totalScore",
        "overallSleepScore",
      ],
    ) ?? null;
  if (sleepScore === null) {
    const candidateEntries = [getPathValue(latestDailyRaw, "sleep"), getPathValue(sleepPayload, "sleep")].filter(
      (value): value is Array<unknown> => Array.isArray(value),
    );
    for (const array of candidateEntries) {
      for (const entry of array) {
        if (entry && typeof entry === "object") {
          const candidate = pickNumber([
            entry as Record<string, unknown>,
            pickObject<Record<string, unknown>>([entry as Record<string, unknown>], "sleepSummary") ?? undefined,
          ], ["sleepSummary.totalScore", "sleepSummary.overallSleepScore", "sleepSummary.sleepScore", "sleepScore"]);
          if (candidate !== null) {
            sleepScore = candidate;
            break;
          }
        }
      }
      if (sleepScore !== null) break;
    }
  }
  let sleepPhases = pickObject<Record<string, number>>(sleepNodes, "sleepPhasesDerived") ?? undefined;
  if (!sleepPhases) {
    const stageSources = [
      sleepSummaryNode,
      firstEntrySleepSummary,
      summarySleepNode,
      topLevelSleepNode,
      nestedSummarySleepNode,
      ...sleepNodes,
    ];
    for (const source of stageSources) {
      if (!source) continue;
      const sleepStages =
        pickObject<Record<string, unknown>>([source], "stages") ??
        pickObject<Record<string, unknown>>([source], "sleepLevelsMap") ??
        undefined;
      if (!sleepStages) continue;

      const deep = pickNumber(
        [sleepStages],
        ["deepSleepSeconds", "deepSleep", "deepSeconds", "deep", "slowWaveSeconds", "deepDurationInSeconds"],
      );
      const rem = pickNumber(
        [sleepStages],
        ["remSleepSeconds", "remSleep", "remSeconds", "rem", "paradoxicalSeconds", "remDurationInSeconds"],
      );
      const light = pickNumber(
        [sleepStages],
        ["lightSleepSeconds", "lightSleep", "lightSeconds", "light", "lightDurationInSeconds"],
      );

      if (deep !== null || rem !== null || light !== null) {
        sleepPhases = {
          profond: deep ?? 0,
          paradoxal: rem ?? 0,
          leger: light ?? 0,
        };
        break;
      }
    }
  }
  const sleepBedtimeSeconds = pickNumber(
    [sleepPayload, sleepSummaryNode],
    ["bedTimeInSeconds", "sleepStartTimeInSeconds", "startTimeInSeconds", "summary.startTimeInSeconds", "startTime"],
  );
  const sleepWakeSeconds = pickNumber(
    [sleepPayload, sleepSummaryNode],
    ["wakeupTimeInSeconds", "sleepEndTimeInSeconds", "endTimeInSeconds", "summary.endTimeInSeconds", "endTime"],
  );
  const sleepBedtimeOffset = pickNumber(
    [sleepPayload, sleepSummaryNode],
    ["bedTimeOffsetInSeconds", "startTimeOffsetInSeconds", "startTimeOffset"],
  );
  const sleepWakeOffset = pickNumber(
    [sleepPayload, sleepSummaryNode],
    ["wakeupTimeOffsetInSeconds", "endTimeOffsetInSeconds", "endTimeOffset"],
  );
  const sleepBedtimeDisplay = formatDateTime(sleepBedtimeSeconds, sleepBedtimeOffset);
  const sleepWakeDisplay = formatDateTime(sleepWakeSeconds, sleepWakeOffset);
  const sleepPhasesDisplay =
    sleepPhases && Object.keys(sleepPhases).length > 0
      ? Object.entries(sleepPhases)
          .map(([phase, seconds]) => `${phase} ${formatHours(seconds, 1)}`)
          .join(" · ")
      : null;

  const hrvPayloadRaw = (latestHrv?.payload as Record<string, unknown>) ?? undefined;
  const hrvSource = pickObject<Record<string, unknown>>([hrvPayloadRaw], "hrvSummary") ?? hrvPayloadRaw ?? {};
  const hrvAverage = pickNumber(
    [hrvSource],
    ["average", "rmssd", "lastNightRmssd", "lastNightAverage", "lastNightAvg", "value", "mean"],
  );
  const hrvMin = pickNumber([hrvSource], ["min", "minimum", "lastNightMinRmssd", "lower"]);
  const hrvMax = pickNumber([hrvSource], ["max", "maximum", "lastNightMaxRmssd", "upper"]);
  const hrvDisplay =
    hrvAverage !== null
      ? `${formatMs(hrvAverage)}${hrvMin !== null || hrvMax !== null ? ` (min ${formatMs(hrvMin)} / max ${formatMs(hrvMax)})` : ""}`
      : null;

  const userMetricsPayload = (latestUserMetrics?.payload as Record<string, unknown>) ?? undefined;
  const userMetricsNode = pickObject<Record<string, unknown>>([userMetricsPayload], "metrics");
  const restingHeartRate = pickNumber(
    [userMetricsPayload, userMetricsNode, latestDailyRaw],
    [
      "restingHeartRate",
      "restingHeartRateInBeatsPerMinute",
      "resting_heart_rate",
      "metrics.0.restingHeartRateInBeatsPerMinute",
      "userMetrics.restingHeartRateInBeatsPerMinute",
      "summary.restingHeartRateInBeatsPerMinute",
    ],
  );

  const stressPayload = (latestStress?.payload as Record<string, unknown>) ?? undefined;
  const stressAverage = pickNumber(
    [latestDailyRaw, stressPayload],
    ["averageStressLevel", "averageStress", "stressAvg"],
  );
  const stressDurations = computeStressDurations(getPathValue(stressPayload, "timeOffsetStressLevelValues"));

  const activeTimeSeconds = pickNumber(
    [latestDailyRaw],
    ["activeTimeInSeconds", "moderateIntensityDurationInSeconds", "totalActiveTimeInSeconds"],
  );
  const calorieSources: Array<Record<string, unknown> | undefined> = [
    dailySummaryNode,
    firstDailyEntry,
    latestDailyRaw,
  ];

  const activeKilocaloriesDaily = pickNumber(
    calorieSources,
    ["activeKilocalories", "activeCalories", "activeCal", "summary.activeKilocalories", "summary.activeCalories"],
  );
  const bmrKilocaloriesDaily = pickNumber(
    calorieSources,
    ["bmrKilocalories", "bmrCalories", "restingKilocalories", "restingCalories", "summary.bmrKilocalories", "summary.bmrCalories"],
  );
  const totalKilocaloriesRaw = pickNumber(
    calorieSources,
    ["totalKilocalories", "totalCalories", "calories", "summary.totalKilocalories", "summary.totalCalories"],
  );
  const totalKilocalories =
    activeKilocaloriesDaily !== null || bmrKilocaloriesDaily !== null
      ? (activeKilocaloriesDaily ?? 0) + (bmrKilocaloriesDaily ?? 0)
      : totalKilocaloriesRaw ?? toNumber(latestSummary?.calories);

  const pulsePayload = (latestPulseOx?.payload as Record<string, unknown>) ?? undefined;
  const spo2OffsetsAverage =
    averageNumericValues(getPathValue(pulsePayload, "timeOffsetSpo2Values")) ??
    averageNumericValues(getPathValue(pulsePayload, "pulseOx.timeOffsetSpo2Values"));
  const spo2Average =
    spo2OffsetsAverage ??
    pickNumber(
      [pulsePayload],
      ["avgSpO2", "averageSpO2", "avgValue", "spo2Average", "summary.avgSpO2", "summary.averageSpO2"],
    );

  const skinTempPayload = (latestSkinTemp?.payload as Record<string, unknown>) ?? undefined;
  const skinTempDeviation = pickNumber(
    [skinTempPayload, latestDailyRaw],
    [
      "avgDeviationCelsius",
      "averageDeviationCelsius",
      "avgDeviation",
      "averageDeviation",
      "skinTemperature.avgDeviationCelsius",
      "summary.avgDeviationCelsius",
      "summary.skinTemperature.avgDeviationCelsius",
    ],
  );

  const bodyCompPayload = (latestBodyComposition?.payload as Record<string, unknown>) ?? undefined;
  const bodyWeightGrams = pickNumber(
    [bodyCompPayload],
    ["weightInGrams", "bodyCompositions.0.weightInGrams", "weight"],
  );
  const bodyWeightKg =
    bodyWeightGrams !== null ? bodyWeightGrams / 1000 : pickNumber([bodyCompPayload], ["weightKg", "weightInKilograms"]);
  const bodyWeight = bodyWeightKg ?? (bodyWeightGrams !== null ? bodyWeightGrams / 1000 : null);
  const bodyFat = pickNumber(
    [bodyCompPayload],
    ["bodyFatInPercent", "percentFat", "bodyCompositions.0.bodyFatInPercent"],
  );
  const bodyMuscleGrams = pickNumber(
    [bodyCompPayload],
    ["muscleMassInGrams", "muscleMass", "bodyCompositions.0.muscleMassInGrams"],
  );
  const bodyMuscle =
    bodyMuscleGrams !== null ? bodyMuscleGrams / 1000 : pickNumber([bodyCompPayload], ["muscleMass", "skeletalMuscleMass", "leanMass"]);
  const bodyHydrationPercent = pickNumber(
    [bodyCompPayload],
    ["bodyWaterInPercent", "percentHydration", "bodyCompositions.0.bodyWaterInPercent"],
  );
  const bodyHydration = bodyHydrationPercent;

  const respirationPayload = (latestRespiration?.payload as Record<string, unknown>) ?? undefined;
  const respirationOffsetsAverage =
    averageNumericValues(getPathValue(respirationPayload, "timeOffsetEpochToBreaths"), { excludeZero: true }) ??
    averageNumericValues(getPathValue(respirationPayload, "respirationSummary.timeOffsetEpochToBreaths"), { excludeZero: true });
  const respirationAverage =
    respirationOffsetsAverage ??
    pickNumber(
      [respirationPayload],
      ["avgRespirationValue", "averageRespirationRate", "respirationAverage", "averageRespiration"],
    );

  const avgHeartRate24h = pickNumber(
    [latestDailyRaw],
    [
      "averageHeartRate",
      "averageHeartRateInBeatsPerMinute",
      "avgHeartRate",
      "heartRateAverage",
    ],
  );

  const activityPayload = (latestActivity?.payload as Record<string, unknown>) ?? undefined;
  const activityDetailsPayload = (latestActivityDetails?.payload as Record<string, unknown>) ?? undefined;
  const activityType =
    pickString([activityPayload, activityDetailsPayload], ["activityType", "activityName", "sportType"]) ?? undefined;
  const activityStartSeconds = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["startTimeInSeconds", "activityStartInSeconds", "startTimestamp"],
  );
  const activityOffsetSeconds = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["startTimeOffsetInSeconds", "activityStartOffsetInSeconds"],
  );
  const activityStartDisplay =
    formatDateTime(activityStartSeconds, activityOffsetSeconds) ??
    (typeof activityPayload?.startTimeGmt === "string"
      ? new Date(activityPayload.startTimeGmt).toLocaleString("fr-FR", { hour12: false })
      : null);
  const activityDurationSeconds = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["durationInSeconds", "activityDurationInSeconds"],
  );
  const activityDurationDisplay = formatMinutes(activityDurationSeconds);
  const activityAvgHr = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["averageHeartRateInBeatsPerMinute", "averageHeartRate", "avgHeartRate"],
  );
  const activityPower = pickNumber(
    [activityDetailsPayload, activityPayload],
    ["averagePowerInWatts", "averagePower"],
  );
  const activityCadence = pickNumber(
    [activityDetailsPayload, activityPayload],
    ["averageCadenceInStepsPerMinute", "averageCadence"],
  );
  const activityCalories = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["activeKilocalories", "totalKilocalories", "caloriesBurned"],
  );
  const activityIntensityParts: string[] = [];
  if (activityDurationDisplay) activityIntensityParts.push(activityDurationDisplay);
  if (activityAvgHr !== null) activityIntensityParts.push(`${Math.round(activityAvgHr)} bpm`);
  if (activityPower !== null) activityIntensityParts.push(`${Math.round(activityPower)} W`);
  if (activityCadence !== null) activityIntensityParts.push(`${Math.round(activityCadence)} cad.`);
  const activityIntensityDisplay = activityIntensityParts.length > 0 ? activityIntensityParts.join(" · ") : null;

  const trainingScoreData: TrainingScoreData = {
    sleepScore: sleepScore ?? undefined,
    bodyBattery:
      bodyBatteryCharged !== null || bodyBatteryDrained !== null
        ? {
            charged: bodyBatteryCharged ?? undefined,
            spent: bodyBatteryDrained ?? undefined,
          }
        : undefined,
    stressAverage: stressAverage ?? undefined,
    steps: latestSummary?.steps ?? undefined,
    hrv: hrvAverage ?? undefined,
    avgHR: avgHeartRate24h ?? restingHeartRate ?? activityAvgHr ?? undefined,
  };
  const hasTrainingInputs = [
    trainingScoreData.sleepScore,
    trainingScoreData.bodyBattery?.charged,
    trainingScoreData.bodyBattery?.spent,
    trainingScoreData.stressAverage,
    trainingScoreData.steps,
    trainingScoreData.hrv,
    trainingScoreData.avgHR,
  ].some((value) => value !== null && value !== undefined);
  const trainingGaugeData = hasTrainingInputs ? trainingScoreData : mockGarminData();

  const sections: GarminSection[] = [
    {
      title: "🧠 Récupération & énergie",
      description: undefined,
      items: [
        {
          label: "Body Battery (actuel / chargé / dépensé / tendance 24h)",
          value: bodyBatteryDisplay,
          hint: "Daily summaries — Body Battery (docs/Garmin_Health_API_1.2.2.md §7.1).",
        },
        {
          label: "Sommeil — durée totale",
          value: formatHours(sleepDurationSeconds),
          hint: "Sleep summaries (docs/Garmin_Health_API_1.2.2.md §7.3).",
        },
        {
          label: "Sommeil — score",
          value: sleepScore !== null ? `${Math.round(sleepScore)}/100` : null,
          hint: "Sleep summaries — champ overallSleepScore.",
        },
        {
          label: "Sommeil — phases (profond, paradoxal, léger)",
          value: sleepPhasesDisplay,
          hint: "Sleep summaries — deep/light/rem durations.",
        },
        {
          label: "Sommeil — coucher / lever",
          value:
            sleepBedtimeDisplay && sleepWakeDisplay
              ? `${sleepBedtimeDisplay} → ${sleepWakeDisplay}`
              : sleepBedtimeDisplay ?? sleepWakeDisplay,
          hint: "Sleep summaries — startTimeInSeconds/endTimeInSeconds.",
        },
        {
          label: "Fréquence cardiaque au repos (RHR)",
          value: formatBpm(restingHeartRate),
          hint: "User Metrics summaries — champ restingHeartRate.",
        },
        {
          label: "Niveau d’énergie global",
          value: bodyBatteryDisplay,
          hint: "Synthèse à construire (Body Battery + sommeil + HRV).",
        },
      ],
    },
    {
      title: "⚡ STRESS & SYSTÈME NERVEUX",
      description: undefined,
      items: [
        {
          label: "Stress moyen de la journée",
          value: stressAverage !== null ? `${Math.round(stressAverage)}/100` : null,
          hint: "Daily summaries — averageStressLevel.",
        },
        {
          label: "Durée en stress faible / moyen / élevé",
          value:
            stressDurations && (stressDurations.low || stressDurations.moderate || stressDurations.high)
              ? [
                  stressDurations.low ? `Faible ${stressDurations.low}` : null,
                  stressDurations.moderate ? `Moyen ${stressDurations.moderate}` : null,
                  stressDurations.high ? `Élevé ${stressDurations.high}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : null,
          hint: "Stress Details summaries — timeOffsetStressLevelValues.",
        },
        {
          label: "HRV (corrélé au stress)",
          value: hrvDisplay,
          hint: "HRV summaries.",
        },
      ],
    },
    {
      title: "🚶‍♂️ ACTIVITÉ GÉNÉRALE",
      description: undefined,
      items: [
        {
          label: "Nombre total de pas",
          value:
            latestSummary?.steps !== null && latestSummary?.steps !== undefined
              ? latestSummary.steps.toLocaleString("fr-FR")
              : null,
          hint: "Daily summaries — steps.",
        },
        {
          label: "Minutes actives",
          value: formatMinutes(activeTimeSeconds),
          hint: "Daily summaries — activeTimeInSeconds.",
        },
        {
          label: "Calories totales brûlées",
          value: formatKcal(totalKilocalories),
          hint: "Daily summaries — totalKilocalories.",
        },
        {
          label: "Temps actif cumulé",
          value: formatMinutes(activeTimeSeconds),
          hint: "Daily summaries — activeTimeInSeconds.",
        },
      ],
    },
    {
      title: "🩸 INDICATEURS PHYSIOLOGIQUES AVANCÉS",
      description: undefined,
      items: [
        {
          label: "SpO₂ moyen",
          value: spo2Average !== null ? formatPercentage(spo2Average, 1) : null,
          hint: "Pulse Ox summaries (docs/Garmin_Health_API_1.2.2.md §7.8).",
        },
        {
          label: "Variation de température corporelle",
          value: skinTempDeviation !== null ? `Δ ${formatCelsius(skinTempDeviation)}` : null,
          hint: "Skin Temperature summaries (§7.12).",
        },
        {
          label: "Poids corporel",
          value: formatKg(bodyWeight),
          hint: "Body Composition summaries (§7.4).",
        },
        {
          label: "Composition corporelle (masse grasse, musculaire, hydratation)",
          value:
            bodyFat !== null || bodyMuscle !== null || bodyHydration !== null
              ? [
                  bodyFat !== null ? `Graisse ${formatPercentage(bodyFat)}` : null,
                  bodyMuscle !== null ? `Muscle ${formatKg(bodyMuscle)}` : null,
                  bodyHydration !== null ? `Hydratation ${formatPercentage(bodyHydration)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : null,
          hint: "Body Composition summaries (§7.4).",
        },
        {
          label: "Hydratation estimée",
          value: bodyHydration !== null ? formatPercentage(bodyHydration) : null,
          hint: "Body Composition summaries (§7.4).",
        },
        {
          label: "Respiration moyenne (brpm)",
          value: formatBrpm(respirationAverage),
          hint: "Respiration summaries (§7.9).",
        },
      ],
    },
    {
      title: "🕒 MÉTADONNÉES D’ACTIVITÉ",
      description: undefined,
      items: [
        {
          label: "Dernière activité — date & heure",
          value: activityStartDisplay,
          hint: "Activity summaries (§7.1 Activity API).",
        },
        {
          label: "Type d’activité",
          value: activityType ?? null,
          hint: "Activity summaries — activityType.",
        },
        {
          label: "Durée & intensité (HR, puissance, cadence)",
          value:
            activityIntensityDisplay && activityIntensityDisplay.length > 0
              ? activityIntensityDisplay
              : activityDurationDisplay,
          hint: "Activity Details (docs/Activity_API-1.2.3_0.md).",
        },
        {
          label: "Calories de la dernière activité",
          value: formatKcal(activityCalories),
          hint: "Activity summaries — activeKilocalories.",
        },
      ],
    },
  ];

  return {
    connection,
    sections,
    trainingGaugeData,
    usedRealtimeMetrics: hasTrainingInputs,
  };
};
