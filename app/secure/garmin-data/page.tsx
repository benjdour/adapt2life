import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminConnections, garminDailySummaries, garminWebhookEvents, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

export const metadata: Metadata = {
  title: "Adapt2Life — Données Garmin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WebhookEventRow = {
  payload: unknown;
  createdAt: Date | null;
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

const formatDateTime = (seconds: number | null | undefined, offsetSeconds: number | null | undefined = 0): string | null => {
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

const computeStressDurations = (map: unknown): { low: string | null; moderate: string | null; high: string | null } | null => {
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
    .filter((entry): entry is { offset: number; stress: number } => entry !== null)
    .sort((a, b) => a.offset - b.offset);

  if (entries.length === 0) return null;

  const totals = { low: 0, moderate: 0, high: 0 };

  for (let i = 0; i < entries.length; i += 1) {
    const current = entries[i];
    const next = entries[i + 1];
    const delta = next ? Math.max(0, next.offset - current.offset) : 60;
    const bucket = current.stress >= 76 ? "high" : current.stress >= 51 ? "moderate" : "low";
    totals[bucket as "low" | "moderate" | "high"] += delta;
  }

  return {
    low: totals.low > 0 ? formatMinutes(totals.low) : null,
    moderate: totals.moderate > 0 ? formatMinutes(totals.moderate) : null,
    high: totals.high > 0 ? formatMinutes(totals.high) : null,
  };
};

const averageNumericValues = (input: unknown): number | null => {
  if (!input || typeof input !== "object") return null;
  const values = Object.values(input as Record<string, unknown>)
    .map((value) => toNumber(value))
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;
  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  return sum / values.length;
};

export default async function GarminDataPage() {
  noStore();

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/secure/garmin-data");
  }

  const [localUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    redirect("/integrations/garmin");
  }

  const [connection] = await db
    .select({
      garminUserId: garminConnections.garminUserId,
      updatedAt: garminConnections.updatedAt,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
    })
    .from(garminConnections)
    .where(eq(garminConnections.userId, localUser.id))
    .limit(1);

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
    .where(eq(garminDailySummaries.userId, localUser.id))
    .orderBy(desc(garminDailySummaries.createdAt))
    .limit(30);

  const latestSummary = dailySummaries[0] ?? null;
  const latestDailyRaw = (latestSummary?.raw as Record<string, unknown> | undefined) ?? undefined;

  let latestSleep: WebhookEventRow | null = null;
  let latestHrv: WebhookEventRow | null = null;
  let latestStress: WebhookEventRow | null = null;
  let latestUserMetrics: WebhookEventRow | null = null;
  let latestPulseOx: WebhookEventRow | null = null;
  let latestSkinTemp: WebhookEventRow | null = null;
  let latestBodyComposition: WebhookEventRow | null = null;
  let latestRespiration: WebhookEventRow | null = null;
  let latestActivity: WebhookEventRow | null = null;
  let latestActivityDetails: WebhookEventRow | null = null;

  if (connection) {
    const fetchLatestEvent = async (type: string): Promise<WebhookEventRow | null> => {
      const [event] = await db
        .select({
          payload: garminWebhookEvents.payload,
          createdAt: garminWebhookEvents.createdAt,
        })
        .from(garminWebhookEvents)
        .where(and(eq(garminWebhookEvents.userId, localUser.id), eq(garminWebhookEvents.type, type)))
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
  const sleepDurationSeconds = pickNumber(
    [sleepPayload],
    [
      "durationInSeconds",
      "totalSleepDurationInSeconds",
      "sleepDurationInSeconds",
      "actualSleepInSeconds",
      "totalSleepSeconds",
    ],
  );
  const sleepScore = pickNumber(
    [sleepPayload],
    [
      "sleepScore",
      "sleepScoreFeedback.score",
      "sleepScoreValue",
      "overallScore",
      "overallSleepScore",
    ],
  );
  const deepSleepSeconds = pickNumber([sleepPayload], ["deepSleepDurationInSeconds", "sleepLevels.deep.durationInSeconds"]);
  const remSleepSeconds = pickNumber([sleepPayload], ["remSleepInSeconds", "sleepLevels.rem.durationInSeconds"]);
  const lightSleepSeconds = pickNumber([sleepPayload], ["lightSleepDurationInSeconds", "sleepLevels.light.durationInSeconds"]);
  const sleepStartSeconds = pickNumber([sleepPayload], ["startTimeInSeconds", "sleepStartTimestamp", "sleepStartTimestampUtc"]);
  const sleepEndSeconds =
    pickNumber([sleepPayload], ["endTimeInSeconds", "sleepEndTimestamp", "sleepEndTimestampUtc"]) ??
    (sleepStartSeconds !== null && sleepDurationSeconds !== null ? sleepStartSeconds + sleepDurationSeconds : null);
  const sleepOffsetSeconds = pickNumber([sleepPayload], ["startTimeOffsetInSeconds", "sleepStartTimezoneOffsetInSeconds"]) ?? 0;
  const sleepBedtimeDisplay = formatDateTime(sleepStartSeconds, sleepOffsetSeconds);
  const sleepWakeDisplay = formatDateTime(sleepEndSeconds, sleepOffsetSeconds);
  const sleepPhasesParts: string[] = [];
  if (deepSleepSeconds !== null) sleepPhasesParts.push(`Profond ${formatHours(deepSleepSeconds)}`);
  if (remSleepSeconds !== null) sleepPhasesParts.push(`REM ${formatHours(remSleepSeconds)}`);
  if (lightSleepSeconds !== null) sleepPhasesParts.push(`Léger ${formatHours(lightSleepSeconds)}`);
  const sleepPhasesDisplay = sleepPhasesParts.length > 0 ? sleepPhasesParts.join(" · ") : null;

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
  const trainingLoad = pickNumber([userMetricsPayload, userMetricsNode], ["trainingLoad", "status.trainingLoad"]);
  const trainingStatus =
    pickString([userMetricsPayload, userMetricsNode], ["trainingStatus", "status.trainingStatus", "status.label"]) ?? undefined;
  const trainingReadiness = pickNumber([userMetricsPayload, userMetricsNode], ["trainingReadinessScore"]);
  const vo2Max = pickNumber(
    [userMetricsPayload, userMetricsNode, pickObject<Record<string, unknown>>([userMetricsPayload], "vo2Max")],
    ["vo2Max", "vo2Max.value", "vo2max"],
  );

  const stressPayload = (latestStress?.payload as Record<string, unknown>) ?? undefined;
  const stressAverage = pickNumber(
    [latestDailyRaw, stressPayload],
    ["averageStressLevel", "averageStress", "stressAvg"],
  );
  const stressMax = pickNumber(
    [latestDailyRaw, stressPayload],
    ["maxStressLevel", "stressMax"],
  );
  const stressDurations = computeStressDurations(getPathValue(stressPayload, "timeOffsetStressLevelValues"));
  const relaxationMinutes = formatMinutes(
    pickNumber(
      [stressPayload],
      ["relaxationDurationInSeconds", "recoveryDurationInSeconds", "totalRecoveryTimeInSeconds"],
    ),
  );

  const activeTimeSeconds = pickNumber(
    [latestDailyRaw],
    ["activeTimeInSeconds", "moderateIntensityDurationInSeconds", "totalActiveTimeInSeconds"],
  );
  const dailyArrayCandidate = getPathValue(latestDailyRaw, "dailies");
  const firstDailyEntry =
    Array.isArray(dailyArrayCandidate) && dailyArrayCandidate.length > 0 && typeof dailyArrayCandidate[0] === "object"
      ? (dailyArrayCandidate[0] as Record<string, unknown>)
      : undefined;
  const dailySummaryNode =
    firstDailyEntry && typeof firstDailyEntry === "object"
      ? pickObject<Record<string, unknown>>([firstDailyEntry], "summary") ?? undefined
      : undefined;

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
  const skinTempAverage = pickNumber(
    [skinTempPayload],
    ["meanSkinTemperature", "averageSkinTemperature", "skinTemperatureAverage"],
  );
  const skinTempDelta = pickNumber(
    [skinTempPayload],
    ["deltaSkinTemperature", "skinTemperatureDelta"],
  );

  const bodyCompPayload = (latestBodyComposition?.payload as Record<string, unknown>) ?? undefined;
  const bodyWeightGrams = pickNumber(
    [bodyCompPayload],
    ["weightInGrams", "bodyCompositions.0.weightInGrams", "weight"],
  );
  const bodyWeightKg =
    bodyWeightGrams !== null ? bodyWeightGrams / 1000 : pickNumber([bodyCompPayload], ["weightKg", "weightInKilograms"]);
  const bodyWeight = bodyWeightKg ?? (bodyWeightGrams !== null ? bodyWeightGrams / 1000 : null);
  const bodyFatPercent = pickNumber(
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
  const bodyFat = bodyFatPercent;
  const bodyHydration = bodyHydrationPercent;

  const respirationPayload = (latestRespiration?.payload as Record<string, unknown>) ?? undefined;
  const respirationAverage = pickNumber(
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
  const trainingEffectAerobic = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["aerobicTrainingEffect", "trainingEffectAerobic", "trainingEffect.aerobic"],
  );
  const trainingEffectAnaerobic = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["anaerobicTrainingEffect", "trainingEffectAnaerobic", "trainingEffect.anaerobic"],
  );
  const trainingEffectDisplay =
    trainingEffectAerobic !== null || trainingEffectAnaerobic !== null
      ? `Aérobie ${trainingEffectAerobic?.toFixed(1) ?? "—"} / Anaérobie ${trainingEffectAnaerobic?.toFixed(1) ?? "—"}`
      : null;
  const trainingEffectLabel =
    pickString([activityPayload, activityDetailsPayload], ["trainingEffectLabel", "trainingEffect.label"]) ?? undefined;
  const trainingEffectValue = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["trainingEffect", "trainingEffect.overall"],
  );
  const effortScoreDisplay =
    trainingEffectLabel || trainingEffectValue !== null
      ? [trainingEffectLabel, trainingEffectValue !== null ? trainingEffectValue.toFixed(1) : null].filter(Boolean).join(" ")
      : null;
  const recoveryTimeSeconds = pickNumber(
    [activityPayload, activityDetailsPayload],
    ["recoveryTimeInSeconds", "recoveryTimeInSec"],
  );

  const sections: Array<{
    title: string;
    description?: string;
    items: Array<{ label: string; value: string | null; hint?: string }>;
  }> = [
    {
      title: "🧠 Récupération & énergie",
      description: "Basé sur les résumés quotidiens, sommeil et HRV (Health API — Daily, Sleep, HRV summaries).",
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
      title: "💪 CHARGE D’ENTRAÎNEMENT",
      description: "Données issues de l’Activity API et des Training Status endpoints.",
      items: [
        {
          label: "Training Load (7 jours)",
          value: trainingLoad !== null ? `${Math.round(trainingLoad)}` : null,
          hint: "Training Status / User Metrics (docs/Activity_API-1.2.3_0.md).",
        },
        {
          label: "Training Effect (aérobie / anaérobie)",
          value: trainingEffectDisplay,
          hint: "Activity summaries & details — champs trainingEffect.",
        },
        {
          label: "VO₂ Max estimé",
          value: vo2Max !== null ? `${vo2Max.toFixed(1)} ml/kg/min` : null,
          hint: "User Metrics — champ vo2Max.",
        },
        {
          label: "Temps de récupération recommandé",
          value: recoveryTimeSeconds !== null ? formatHours(recoveryTimeSeconds, 1) : null,
          hint: "Activity Details — recoveryTimeInSeconds.",
        },
        {
          label: "Statut d’entraînement",
          value: trainingStatus ?? null,
          hint: "Training Status API / User Metrics.",
        },
        {
          label: "Training Readiness",
          value: trainingReadiness !== null ? `${Math.round(trainingReadiness)}/100` : null,
          hint: "User Metrics — trainingReadinessScore.",
        },
      ],
    },
    {
      title: "⚡ STRESS & SYSTÈME NERVEUX",
      description: "Utilise Stress Details summaries et HRV.",
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
          label: "Stress maximal de la journée",
          value: stressMax !== null ? `${Math.round(stressMax)}/100` : null,
          hint: "Daily summaries / Stress Details.",
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
      description: "Basé sur Daily summaries & Activity API.",
      items: [
        {
          label: "Nombre total de pas",
          value: latestSummary?.steps !== null && latestSummary?.steps !== undefined ? latestSummary.steps.toLocaleString("fr-FR") : null,
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
      description: "Nécessite Health API (Pulse Ox, Skin Temp, Body Composition).",
      items: [
        {
          label: "SpO₂ moyen",
          value: spo2Average !== null ? formatPercentage(spo2Average, 1) : null,
          hint: "Pulse Ox summaries (docs/Garmin_Health_API_1.2.2.md §7.8).",
        },
        {
          label: "Température corporelle moyenne / variation",
          value:
            skinTempAverage !== null || skinTempDelta !== null
              ? [
                  skinTempAverage !== null ? formatCelsius(skinTempAverage) : null,
                  skinTempDelta !== null ? `Δ ${formatCelsius(skinTempDelta)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : null,
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
                  bodyFat !== null ? `MG ${formatPercentage(bodyFat)}` : null,
                  bodyMuscle !== null ? `MM ${formatKg(bodyMuscle)}` : null,
                  bodyHydration !== null ? `Hydr. ${formatPercentage(bodyHydration)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : null,
          hint: "Body Composition summaries.",
        },
        {
          label: "Fréquence cardiaque moyenne (24h)",
          value: formatBpm(avgHeartRate24h),
          hint: "Daily summaries — averageHeartRate.",
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
      description: "Requiert Activity API (summaries & details).",
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

  const renderMetricValue = (value: string | null, hint?: string) => {
    if (value) {
      return <span className="text-base font-semibold text-white">{value}</span>;
    }

    return (
      <span className="text-sm text-yellow-200">
        En attente de synchro
        {hint ? (
          <>
            {" "}
            <span className="block text-xs text-yellow-200/80">{hint}</span>
          </>
        ) : null}
      </span>
    );
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Garmin</p>
        <h1 className="text-3xl font-semibold">Données synchronisées</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Cette page présente les métriques clés envoyées par Garmin Connect via les webhooks Push.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        {connection ? (
          <>
            <div>
              <p className="text-sm font-medium text-white/90">Garmin userId</p>
              <p className="font-mono text-base text-emerald-200">{connection.garminUserId}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Dernière mise à jour :{" "}
                <strong className="text-white">{connection.updatedAt?.toLocaleString() ?? "—"}</strong>
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Token valide jusqu&apos;au :{" "}
                <strong className="text-white">{connection.accessTokenExpiresAt?.toLocaleString() ?? "—"}</strong>
              </span>
            </div>
            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">Sources Garmin Health API</p>
              <p className="text-emerald-100/80">
                Les métriques ci-dessous proviennent des endpoints documentés dans <code>docs/Garmin_Health_API_1.2.2.md</code> et{" "}
                <code>docs/Activity_API-1.2.3_0.md</code>. Les cartes marquées &laquo; En attente de synchro &raquo; indiquent les
                endpoints à activer ou consommer.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Aucune connexion Garmin</p>
            <p className="text-sm text-white/70">
              Relie ton compte via la page d’intégration pour voir les données apparaître ici.
            </p>
          </div>
        )}
      </section>

      {connection ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
              <header className="mb-4 space-y-1">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                {section.description ? <p className="text-sm text-white/70">{section.description}</p> : null}
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">{item.label}</p>
                    <div className="mt-2">{renderMetricValue(item.value, item.hint)}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/integrations/garmin"
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Gérer l’intégration Garmin
        </Link>
      </div>
    </div>
  );
}
