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
  entityId: string | null;
};

export type GarminSectionItem = {
  label: string;
  value: string | null;
  hint?: string;
  hasHistory?: boolean;
};

export type GarminActivityHighlight = {
  id: string;
  type: string | null;
  startDisplay: string | null;
  startTimestampMs: number | null;
  durationSeconds: number | null;
  durationDisplay: string | null;
  intensityDisplay: string | null;
  averageHeartRate: number | null;
  heartRateDisplay: string | null;
  power: number | null;
  powerDisplay: string | null;
  cadence: number | null;
  cadenceDisplay: string | null;
  calories: number | null;
  caloriesDisplay: string | null;
};

export type GarminSection = {
  title: string;
  description?: string;
  items: GarminSectionItem[];
  activities?: GarminActivityHighlight[];
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
  hasSyncedOnce: boolean;
};

type FetchGarminDataOptions = {
  gender?: string | null;
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

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (["true", "1", "yes", "oui", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "non", "off"].includes(normalized)) return false;
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

const pickBoolean = (
  sources: Array<Record<string, unknown> | undefined>,
  paths: string[],
): boolean | null => {
  for (const source of sources) {
    if (!source) continue;
    for (const path of paths) {
      const candidate = getPathValue(source, path);
      const parsed = toBoolean(candidate);
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

const prettifyLabel = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
};

const computeStressDurations = (
  map: unknown,
): { low: number | null; moderate: number | null; high: number | null } | null => {
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

  const sanitize = (seconds: number): number | null => (seconds > 0 ? seconds : null);

  return {
    low: sanitize(durations.low),
    moderate: sanitize(durations.moderate),
    high: sanitize(durations.high),
  };
};

const buildActivityHighlight = (
  activityEvent: GarminWebhookEventRow | null,
  detailsEvent: GarminWebhookEventRow | null,
): GarminActivityHighlight | null => {
  const activityPayload = (activityEvent?.payload as Record<string, unknown> | undefined) ?? undefined;
  const detailsPayload = (detailsEvent?.payload as Record<string, unknown> | undefined) ?? undefined;

  if (!activityPayload && !detailsPayload) {
    return null;
  }

  const activityTypeRaw =
    pickString([activityPayload, detailsPayload], ["activityType", "activityName", "sportType"]) ?? null;
  const type = prettifyLabel(activityTypeRaw) ?? activityTypeRaw ?? "Activité";

  const startSeconds = pickNumber(
    [activityPayload, detailsPayload],
    ["startTimeInSeconds", "activityStartInSeconds", "startTimestamp"],
  );
  const offsetSeconds = pickNumber(
    [activityPayload, detailsPayload],
    ["startTimeOffsetInSeconds", "activityStartOffsetInSeconds"],
  );
  const fallbackStartGmt =
    typeof activityPayload?.startTimeGmt === "string"
      ? new Date(activityPayload.startTimeGmt).toLocaleString("fr-FR", { hour12: false })
      : null;
  const createdAtDisplay =
    activityEvent?.createdAt?.toLocaleString("fr-FR", { hour12: false }) ??
    detailsEvent?.createdAt?.toLocaleString("fr-FR", { hour12: false }) ??
    null;
  const startDisplay = formatDateTime(startSeconds, offsetSeconds) ?? fallbackStartGmt ?? createdAtDisplay;
  const rawStartTimeGmt =
    typeof activityPayload?.startTimeGmt === "string" || typeof activityPayload?.startTimeGmt === "number"
      ? activityPayload.startTimeGmt
      : null;
  const startTimestampMs =
    startSeconds !== null && startSeconds !== undefined
      ? (startSeconds + (offsetSeconds ?? 0)) * 1000
      : rawStartTimeGmt !== null
          ? new Date(rawStartTimeGmt).getTime()
          : activityEvent?.createdAt?.getTime() ?? detailsEvent?.createdAt?.getTime() ?? null;

  const durationSeconds = pickNumber(
    [activityPayload, detailsPayload],
    ["durationInSeconds", "activityDurationInSeconds"],
  );
  const durationDisplay = formatMinutes(durationSeconds);

  const avgHeartRate = pickNumber(
    [activityPayload, detailsPayload],
    ["averageHeartRateInBeatsPerMinute", "averageHeartRate", "avgHeartRate"],
  );
  const heartRateDisplay = formatBpm(avgHeartRate);

  const power = pickNumber([detailsPayload, activityPayload], ["averagePowerInWatts", "averagePower"]);
  const powerDisplay = power !== null ? `${Math.round(power)} W` : null;

  const cadence = pickNumber(
    [detailsPayload, activityPayload],
    ["averageCadenceInStepsPerMinute", "averageCadence"],
  );
  const cadenceDisplay = cadence !== null ? `${Math.round(cadence)} cad.` : null;

  const calories = pickNumber(
    [activityPayload, detailsPayload],
    ["activeKilocalories", "totalKilocalories", "caloriesBurned"],
  );
  const caloriesDisplay = formatKcal(calories);

  const intensityParts: string[] = [];
  if (durationDisplay) intensityParts.push(durationDisplay);
  if (avgHeartRate !== null) intensityParts.push(`${Math.round(avgHeartRate)} bpm`);
  if (power !== null) intensityParts.push(`${Math.round(power)} W`);
  if (cadence !== null) intensityParts.push(`${Math.round(cadence)} cad.`);
  const intensityDisplay = intensityParts.length > 0 ? intensityParts.join(" · ") : null;

  const idCandidate =
    pickString([activityPayload, detailsPayload], ["summaryId", "activityId", "eventId", "workoutId", "uuid"]) ??
    pickNumber([activityPayload, detailsPayload], ["summaryId", "activityId"])?.toString() ??
    activityEvent?.entityId ??
    detailsEvent?.entityId ??
    activityEvent?.createdAt?.toISOString() ??
    detailsEvent?.createdAt?.toISOString();

  if (!idCandidate) {
    return null;
  }

  return {
    id: idCandidate,
    type,
    startDisplay,
    startTimestampMs: startTimestampMs ?? null,
    durationSeconds,
    durationDisplay,
    intensityDisplay,
    averageHeartRate: avgHeartRate,
    heartRateDisplay,
    power,
    powerDisplay,
    cadence,
    cadenceDisplay,
    calories,
    caloriesDisplay,
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

const normalizeDurationSeconds = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  if (abs === 0) return 0;

  // Already in seconds if within reasonable sleep duration (<= 48h)
  if (abs <= 172800) return Math.round(value);

  // Milliseconds to seconds
  if (abs <= 172800 * 1000) return Math.round(value / 1000);

  // Minutes (value represents minutes) -> convert to seconds
  if (abs <= 172800 / 60 * 60) return Math.round(value * 60);

  // Milliseconds with extra factor (e.g. minutes * 1000)
  if (abs <= 172800 * 1000 * 60) return Math.round(value / 60000);

  // Fallback: return rounded value
  return Math.round(value);
};

const flattenToNodes = (value: unknown): Array<Record<string, unknown>> => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenToNodes(entry));
  }
  if (typeof value === "object") {
    return [value as Record<string, unknown>];
  }
  return [];
};

const collectNodes = (...inputs: Array<unknown>): Array<Record<string, unknown>> => {
  const nodes: Array<Record<string, unknown>> = [];
  for (const input of inputs) {
    nodes.push(...flattenToNodes(input));
  }
  return nodes;
};

const normalizeTimestampSeconds = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  if (abs === 0) return 0;

  if (abs > 1e12) {
    return Math.round(value / 1000);
  }

  if (abs > 315360000) {
    return Math.round(value);
  }

  return Math.round(value);
};

const parseTimestampString = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed / 1000);
};

const getTimestampFromPaths = (
  node: Record<string, unknown> | undefined,
  numericPaths: readonly string[],
  isoPaths: readonly string[],
): number | null => {
  if (!node) return null;

  for (const path of numericPaths) {
    const value = getPathValue(node, path);
    const numeric = toNumber(value);
    const normalized = normalizeTimestampSeconds(numeric);
    if (normalized !== null) return normalized;
  }

  for (const path of isoPaths) {
    const value = getPathValue(node, path);
    const parsed = parseTimestampString(value);
    if (parsed !== null) return parsed;
  }

  return null;
};

const getOffsetFromPaths = (node: Record<string, unknown> | undefined, offsetPaths: readonly string[]): number | null => {
  if (!node) return null;
  for (const path of offsetPaths) {
    const value = getPathValue(node, path);
    const numeric = toNumber(value);
    if (numeric !== null && Number.isFinite(numeric)) {
      return Math.round(numeric);
    }
  }
  return null;
};

const resolveTimestampSeconds = (
  nodes: Array<Record<string, unknown>>,
  numericPaths: readonly string[],
  isoPaths: readonly string[],
): number | null => {
  for (const node of nodes) {
    const timestamp = getTimestampFromPaths(node, numericPaths, isoPaths);
    if (timestamp !== null) return timestamp;
  }
  return null;
};

const resolveOffsetSeconds = (
  nodes: Array<Record<string, unknown>>,
  offsetPaths: readonly string[],
): number | null => {
  for (const node of nodes) {
    const offset = getOffsetFromPaths(node, offsetPaths);
    if (offset !== null) return offset;
  }
  return null;
};

const getDurationFromPaths = (node: Record<string, unknown> | undefined, paths: readonly string[]): number | null => {
  if (!node) return null;
  for (const path of paths) {
    const value = getPathValue(node, path);
    const numeric = toNumber(value);
    const normalized = normalizeDurationSeconds(numeric);
    if (normalized !== null) return normalized;
  }
  return null;
};

const sleepStageDefinitions = {
  profond: {
    valuePaths: [
      "deepSleepDurationInSeconds",
      "deepSleepInSeconds",
      "deepSleepSeconds",
      "deep.durationInSeconds",
      "deep.seconds",
      "sleepSummary.deepSleepDurationInSeconds",
      "sleepSummary.deepSleepInSeconds",
      "sleepSummary.deepSleepSeconds",
      "sleepSummary.stages.deep.durationInSeconds",
      "sleepSummary.stages.deep.seconds",
      "stages.deep.durationInSeconds",
      "stages.deep.seconds",
      "sleepLevelsMap.deep.durationInSeconds",
      "sleepLevelsMap.deep.seconds",
      "sleepLevelsMap.DEEP.durationInSeconds",
      "sleepLevelsMap.deepSleep.durationInSeconds",
    ],
    mapKeys: ["deep", "deepSleep", "DEEP"],
    arrayLevels: ["deep", "DEEP", "SLEEP_DEEP", "deep_sleep"],
  },
  paradoxal: {
    valuePaths: [
      "remSleepInSeconds",
      "remSleepDurationInSeconds",
      "remSleepSeconds",
      "rem.durationInSeconds",
      "rem.seconds",
      "sleepSummary.remSleepInSeconds",
      "sleepSummary.remSleepDurationInSeconds",
      "sleepSummary.remSleepSeconds",
      "sleepSummary.stages.rem.durationInSeconds",
      "sleepSummary.stages.rem.seconds",
      "stages.rem.durationInSeconds",
      "stages.rem.seconds",
      "sleepLevelsMap.rem.durationInSeconds",
      "sleepLevelsMap.rem.seconds",
      "sleepLevelsMap.REM.durationInSeconds",
      "sleepLevelsMap.paradoxical.durationInSeconds",
    ],
    mapKeys: ["rem", "remSleep", "REM", "paradoxical"],
    arrayLevels: ["rem", "REM", "SLEEP_REM", "paradoxical"],
  },
  leger: {
    valuePaths: [
      "lightSleepDurationInSeconds",
      "lightSleepInSeconds",
      "lightSleepSeconds",
      "light.durationInSeconds",
      "light.seconds",
      "sleepSummary.lightSleepDurationInSeconds",
      "sleepSummary.lightSleepInSeconds",
      "sleepSummary.lightSleepSeconds",
      "sleepSummary.stages.light.durationInSeconds",
      "sleepSummary.stages.light.seconds",
      "stages.light.durationInSeconds",
      "stages.light.seconds",
      "sleepLevelsMap.light.durationInSeconds",
      "sleepLevelsMap.light.seconds",
      "sleepLevelsMap.LIGHT.durationInSeconds",
    ],
    mapKeys: ["light", "lightSleep", "LIGHT"],
    arrayLevels: ["light", "LIGHT", "SLEEP_LIGHT"],
  },
} as const;

type SleepStageKey = keyof typeof sleepStageDefinitions;

const stageArrayPaths = [
  "sleepLevels",
  "levels",
  "sleepSummary.sleepLevels",
  "sleepSummary.levels",
];

const stageLevelIdentifierPaths = [
  "levelType",
  "type",
  "level",
  "sleepLevelType",
];

const stageArrayDurationPaths = [
  "durationInSeconds",
  "sleepDurationInSeconds",
  "timeInSeconds",
  "seconds",
  "duration",
  "totalSeconds",
];

const resolveStageDuration = (
  nodes: Array<Record<string, unknown>>,
  stage: SleepStageKey,
): number | null => {
  const definition = sleepStageDefinitions[stage];
  const mapValuePaths = [...definition.valuePaths];

  for (const node of nodes) {
    const direct = getDurationFromPaths(node, definition.valuePaths);
    if (direct !== null) return direct;

    const candidateObjects = collectNodes(
      node,
      getPathValue(node, "sleepSummary"),
      getPathValue(node, "sleepLevelsMap"),
      getPathValue(node, "stages"),
    );

    for (const candidate of candidateObjects) {
      const candidateDuration = getDurationFromPaths(candidate, definition.valuePaths);
      if (candidateDuration !== null) return candidateDuration;

      if (definition.mapKeys) {
        for (const key of definition.mapKeys) {
          const entry = getPathValue(candidate, key);
          if (!entry) continue;

          if (typeof entry === "object") {
            const subDuration = getDurationFromPaths(entry as Record<string, unknown>, mapValuePaths);
            if (subDuration !== null) return subDuration;
          } else {
            const numeric = normalizeDurationSeconds(toNumber(entry));
            if (numeric !== null) return numeric;
          }
        }
      }
    }

    for (const path of stageArrayPaths) {
      const arr = getPathValue(node, path);
      if (!Array.isArray(arr)) continue;
      for (const entry of arr) {
        if (!entry || typeof entry !== "object") continue;
        const levelRaw = stageLevelIdentifierPaths
          .map((identifier) => getPathValue(entry, identifier))
          .find((value): value is string => typeof value === "string");
        if (!levelRaw) continue;
        if (!definition.arrayLevels?.some((target) => target.toLowerCase() === levelRaw.toLowerCase())) continue;

        const entryDuration = getDurationFromPaths(entry as Record<string, unknown>, [...definition.valuePaths, ...stageArrayDurationPaths]);
        if (entryDuration !== null) return entryDuration;
      }
    }
  }

  return null;
};

export const fetchGarminData = async (
  localUserId: string | number,
  options: FetchGarminDataOptions = {},
): Promise<GarminDataBundle> => {
  const numericUserId = typeof localUserId === "string" ? Number(localUserId) : localUserId;
  const normalizedGender =
    typeof options.gender === "string" ? options.gender.trim().toLowerCase() : null;
  const includeWomenHealthSection = normalizedGender === "femme";

  if (!Number.isFinite(numericUserId)) {
    return {
      connection: null,
      sections: [],
      trainingGaugeData: mockGarminData(),
      usedRealtimeMetrics: false,
      hasSyncedOnce: false,
    };
  }

  const buildFallback = (): GarminDataBundle => ({
    connection: null,
    sections: [],
    trainingGaugeData: mockGarminData(),
    usedRealtimeMetrics: false,
    hasSyncedOnce: false,
  });

  try {
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
  let latestWomenHealth: GarminWebhookEventRow | null = null;
  let activityHistory: GarminWebhookEventRow[] = [];
  let activityDetailHistory: GarminWebhookEventRow[] = [];

    if (connectionRow) {
    const fetchLatestEvents = async (type: string, limit = 1): Promise<GarminWebhookEventRow[]> => {
      return db
        .select({
          payload: garminWebhookEvents.payload,
          createdAt: garminWebhookEvents.createdAt,
          entityId: garminWebhookEvents.entityId,
        })
        .from(garminWebhookEvents)
        .where(and(eq(garminWebhookEvents.userId, numericUserId), eq(garminWebhookEvents.type, type)))
        .orderBy(desc(garminWebhookEvents.createdAt))
        .limit(limit);
    };

    const fetchLatestEvent = async (type: string): Promise<GarminWebhookEventRow | null> => {
      const [event] = await fetchLatestEvents(type, 1);
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
      latestWomenHealth,
      activityHistory,
      activityDetailHistory,
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
      fetchLatestEvent("womenHealth"),
      fetchLatestEvents("activities", 5),
      fetchLatestEvents("activityDetails", 5),
    ]);

    latestActivity = activityHistory[0] ?? latestActivity;
    latestActivityDetails = activityDetailHistory[0] ?? latestActivityDetails;
  }

    const stressPayload = (latestStress?.payload as Record<string, unknown>) ?? undefined;

  const bodyBatteryTimeSeriesSource = getPathValue(stressPayload, "timeOffsetBodyBatteryValues");
  const bodyBatteryTimeSeries: Array<{ offset: number; value: number }> = [];

  if (Array.isArray(bodyBatteryTimeSeriesSource)) {
    for (const entry of bodyBatteryTimeSeriesSource) {
      if (!entry || typeof entry !== "object") continue;
      const value = pickNumber([entry as Record<string, unknown>], ["bodyBatteryValue", "value", "bodyBattery", "level"]);
      if (value === null) continue;
      const offset =
        pickNumber([entry as Record<string, unknown>], ["offset", "offsetInSeconds", "offsetInSecond"]) ?? 0;
      bodyBatteryTimeSeries.push({ offset, value });
    }
  } else if (bodyBatteryTimeSeriesSource && typeof bodyBatteryTimeSeriesSource === "object") {
    for (const [offsetKey, rawValue] of Object.entries(bodyBatteryTimeSeriesSource as Record<string, unknown>)) {
      const value = toNumber(rawValue);
      if (value === null) continue;
      const offset = Number.parseFloat(offsetKey);
      bodyBatteryTimeSeries.push({ offset: Number.isFinite(offset) ? offset : 0, value });
    }
  }

  const lastBodyBatteryValue =
    bodyBatteryTimeSeries.length > 0
      ? bodyBatteryTimeSeries
          .reduce(
            (latest, current) => (current.offset >= latest.offset ? current : latest),
            bodyBatteryTimeSeries[0],
          )
          .value
      : null;

  const bodyBatteryLevel =
    lastBodyBatteryValue ??
    pickNumber(
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
  const bodyBatteryParts: string[] = [];
  if (bodyBatteryLevel !== null) bodyBatteryParts.push(`${Math.round(bodyBatteryLevel)}/100`);
  if (bodyBatteryCharged !== null) bodyBatteryParts.push(`+${Math.round(bodyBatteryCharged)}`);
  if (bodyBatteryDrained !== null) bodyBatteryParts.push(`-${Math.round(bodyBatteryDrained)}`);
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
  const sleepEntries = collectNodes(getPathValue(latestDailyRaw, "sleep"), getPathValue(sleepPayload, "sleep"));
  const stageNodes: Array<Record<string, unknown>> = [
    ...sleepNodes,
    ...sleepEntries,
    ...sleepEntries.flatMap((entry) =>
      collectNodes(
        pickObject<Record<string, unknown>>([entry], "sleepSummary") ?? undefined,
        getPathValue(entry, "sleepLevelsMap"),
        getPathValue(entry, "stages"),
      ),
    ),
  ];
  const timestampNodes = collectNodes(
    sleepNodes,
    sleepEntries,
    sleepSummaryNode,
    firstEntrySleepSummary,
    summarySleepNode,
    topLevelSleepNode,
    nestedSummarySleepNode,
    dailySummaryNode,
    firstDailyEntry,
    latestDailyRaw,
    sleepPayload,
  );

  let sleepDurationSeconds = normalizeDurationSeconds(
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
        "durationInSeconds",
        "sleepSummary.durationInSeconds",
      ],
    ) ?? toNumber(latestSummary?.sleepSeconds),
  );
  if (sleepDurationSeconds === null) {
    const candidateEntries = [getPathValue(latestDailyRaw, "sleep"), getPathValue(sleepPayload, "sleep")].filter(
      (value): value is Array<unknown> => Array.isArray(value),
    );
    for (const array of candidateEntries) {
      for (const entry of array) {
        if (entry && typeof entry === "object") {
          const candidate = normalizeDurationSeconds(
            pickNumber([
              entry as Record<string, unknown>,
              pickObject<Record<string, unknown>>([entry as Record<string, unknown>], "sleepSummary") ?? undefined,
            ], [
              "sleepSummary.totalSleepSeconds",
              "sleepSummary.totalSleepTimeInSeconds",
              "sleepSummary.sleepDurationInSeconds",
              "sleepSummary.durationInSeconds",
              "sleepDurationInSeconds",
              "durationInSeconds",
            ]),
          );
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
  const stageDurations = {
    profond: resolveStageDuration(stageNodes, "profond"),
    paradoxal: resolveStageDuration(stageNodes, "paradoxal"),
    leger: resolveStageDuration(stageNodes, "leger"),
  };
  const sleepPhases =
    stageDurations.profond !== null || stageDurations.paradoxal !== null || stageDurations.leger !== null
      ? {
          profond: stageDurations.profond ?? 0,
          paradoxal: stageDurations.paradoxal ?? 0,
          leger: stageDurations.leger ?? 0,
        }
      : pickObject<Record<string, number>>(sleepNodes, "sleepPhasesDerived") ?? undefined;
  const sleepStartNumericPaths = [
    "bedTimeInSeconds",
    "sleepStartTimeInSeconds",
    "startTimeInSeconds",
    "sleepSummary.startTimeInSeconds",
    "sleepSummary.sleepStartTimeInSeconds",
    "sleepSummary.startSeconds",
    "startSeconds",
    "sleepSummary.startTimestamp",
    "sleepSummary.sleepStartTimestamp",
    "startTimestamp",
    "sleepSummary.sleepStartTime",
    "sleepSummary.startTime",
    "summary.startTimeInSeconds",
    "summary.sleep.startTimeInSeconds",
    "sleep.startTimeInSeconds",
    "sleepSummary.startTimeSeconds",
    "sleepSummary.sleepStartTimeSeconds",
  ] as const;
  const sleepStartIsoPaths = [
    "startTimeGmt",
    "sleepStartTimeGmt",
    "sleepSummary.startTimeGmt",
    "sleepSummary.sleepStartTimeGmt",
    "startTimeLocal",
    "sleepSummary.startTimeLocal",
  ] as const;
  const sleepEndNumericPaths = [
    "wakeupTimeInSeconds",
    "sleepEndTimeInSeconds",
    "endTimeInSeconds",
    "sleepSummary.endTimeInSeconds",
    "sleepSummary.sleepEndTimeInSeconds",
    "sleepSummary.endSeconds",
    "endSeconds",
    "sleepSummary.endTimestamp",
    "sleepSummary.sleepEndTimestamp",
    "endTimestamp",
    "summary.endTimeInSeconds",
    "summary.sleep.endTimeInSeconds",
    "sleep.endTimeInSeconds",
  ] as const;
  const sleepEndIsoPaths = [
    "endTimeGmt",
    "sleepEndTimeGmt",
    "sleepSummary.endTimeGmt",
    "sleepSummary.sleepEndTimeGmt",
    "endTimeLocal",
    "sleepSummary.endTimeLocal",
  ] as const;
  const sleepStartOffsetPaths = [
    "bedTimeOffsetInSeconds",
    "sleepStartOffsetInSeconds",
    "startTimeOffsetInSeconds",
    "sleepSummary.startTimeOffsetInSeconds",
    "sleepSummary.sleepStartOffsetInSeconds",
    "startTimeOffset",
    "sleepSummary.startTimeOffset",
    "sleepSummary.sleepStartTimeOffset",
  ] as const;
  const sleepEndOffsetPaths = [
    "wakeupTimeOffsetInSeconds",
    "sleepEndOffsetInSeconds",
    "endTimeOffsetInSeconds",
    "sleepSummary.endTimeOffsetInSeconds",
    "sleepSummary.sleepEndOffsetInSeconds",
    "endTimeOffset",
    "sleepSummary.endTimeOffset",
    "sleepSummary.sleepEndTimeOffset",
  ] as const;

  const sleepBedtimeSeconds = resolveTimestampSeconds(timestampNodes, sleepStartNumericPaths, sleepStartIsoPaths);
  let sleepWakeSeconds = resolveTimestampSeconds(timestampNodes, sleepEndNumericPaths, sleepEndIsoPaths);
  const sleepBedtimeOffset = resolveOffsetSeconds(timestampNodes, sleepStartOffsetPaths);
  let sleepWakeOffset = resolveOffsetSeconds(timestampNodes, sleepEndOffsetPaths);
  const sleepBedtimeDisplay = formatDateTime(sleepBedtimeSeconds, sleepBedtimeOffset);
  if (sleepWakeSeconds === null && sleepBedtimeSeconds !== null && sleepDurationSeconds !== null) {
    sleepWakeSeconds = sleepBedtimeSeconds + sleepDurationSeconds;
  }
  if (sleepWakeOffset === null && sleepBedtimeOffset !== null) {
    sleepWakeOffset = sleepBedtimeOffset;
  }
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

  const activityDetailsMap = new Map<string, GarminWebhookEventRow>();
  for (const detailEvent of activityDetailHistory) {
    if (detailEvent?.entityId) {
      activityDetailsMap.set(detailEvent.entityId, detailEvent);
    }
  }

  const activityHighlights = activityHistory
    .map((activityEvent, index) => {
      const matchedDetails =
        (activityEvent.entityId ? activityDetailsMap.get(activityEvent.entityId) : undefined) ??
        activityDetailHistory[index] ??
        null;
      return buildActivityHighlight(activityEvent, matchedDetails ?? null);
    })
    .filter((highlight): highlight is GarminActivityHighlight => Boolean(highlight));

  const latestActivityHighlight =
    activityHighlights[0] ?? buildActivityHighlight(latestActivity, latestActivityDetails) ?? null;
  const activityHighlightsForSnapshots =
    activityHighlights.length > 0
      ? activityHighlights
      : latestActivityHighlight
        ? [latestActivityHighlight]
        : [];

  const activityType = latestActivityHighlight?.type ?? null;
  const activityStartDisplay = latestActivityHighlight?.startDisplay ?? null;
  const activityDurationSeconds = latestActivityHighlight?.durationSeconds ?? null;
  const activityDurationDisplay = latestActivityHighlight?.durationDisplay ?? null;
  const activityIntensityDisplay = latestActivityHighlight?.intensityDisplay ?? null;
  const activityAvgHr = latestActivityHighlight?.averageHeartRate ?? null;
  const activityCalories = latestActivityHighlight?.calories ?? null;
  const activityCaloriesDisplay = latestActivityHighlight?.caloriesDisplay ?? null;
  const recentActivityEntries = activityHighlightsForSnapshots
    .slice(0, 5)
    .map((activity) => ({
      durationMin: activity.durationSeconds !== null && activity.durationSeconds !== undefined ? activity.durationSeconds / 60 : null,
      avgHr: activity.averageHeartRate,
      calories: activity.calories,
      timestampMs: activity.startTimestampMs,
    }))
    .filter(
      (entry) =>
        entry.durationMin !== null || entry.avgHr !== null || entry.calories !== null || entry.timestampMs !== null,
    );

  const womenHealthPayloadRaw = latestWomenHealth?.payload ?? null;
  const womenHealthPayload =
    Array.isArray(womenHealthPayloadRaw)
      ? (womenHealthPayloadRaw.find(
          (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
        ) as Record<string, unknown> | undefined)
      : womenHealthPayloadRaw && typeof womenHealthPayloadRaw === "object"
        ? (womenHealthPayloadRaw as Record<string, unknown>)
        : undefined;

  let womenHealthSummary: Record<string, unknown> | undefined =
    pickObject<Record<string, unknown>>([womenHealthPayload], "summary") ??
    pickObject<Record<string, unknown>>([womenHealthPayload], "womenHealthSummary") ??
    pickObject<Record<string, unknown>>([womenHealthPayload], "womenHealth") ??
    undefined;

  if (!womenHealthSummary && womenHealthPayload) {
    const logsCandidate = getPathValue(womenHealthPayload, "logs");
    if (Array.isArray(logsCandidate)) {
      const firstLog = logsCandidate.find(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
      );
      if (firstLog) {
        womenHealthSummary = firstLog;
      }
    }
  }

  if (!womenHealthSummary) {
    womenHealthSummary = womenHealthPayload;
  }

  const currentPhaseTypeRaw = pickString(
    [womenHealthSummary],
    ["currentPhaseType", "phaseType", "cyclePhaseType", "cycleSummary.currentPhaseType"],
  );
  const currentPhaseTypeDisplay = prettifyLabel(currentPhaseTypeRaw) ?? currentPhaseTypeRaw ?? null;

  const dayInCycleValue = pickNumber(
    [womenHealthSummary],
    ["dayInCycle", "cycleSummary.dayInCycle", "cycleDay", "currentCycleDay", "cycleDayNumber", "dayOfCycle"],
  );
  const dayInCycleDisplay = dayInCycleValue !== null ? `Jour ${Math.round(dayInCycleValue)}` : null;

  const cycleLengthValue = pickNumber(
    [womenHealthSummary],
    ["cycleLength", "cycleSummary.cycleLength", "cycleLengthDays", "averageCycleLength", "avgCycleLength"],
  );
  const predictedCycleLengthValue = pickNumber(
    [womenHealthSummary],
    [
      "predictedCycleLength",
      "predictedCycleLengthDays",
      "cyclePrediction.predictedCycleLength",
      "cyclePrediction.predictedLength",
      "cycleSummary.predictedCycleLength",
    ],
  );
  const cycleLengthSegments: string[] = [];
  if (cycleLengthValue !== null) {
    cycleLengthSegments.push(`Observé ${Math.round(cycleLengthValue)} j`);
  }
  if (
    predictedCycleLengthValue !== null &&
    (cycleLengthValue === null || Math.round(predictedCycleLengthValue) !== Math.round(cycleLengthValue))
  ) {
    cycleLengthSegments.push(`Prévu ${Math.round(predictedCycleLengthValue)} j`);
  }
  const cycleLengthDisplay = cycleLengthSegments.length > 0 ? cycleLengthSegments.join(" · ") : null;

  const hasSpecifiedCycleLength = pickBoolean(
    [womenHealthSummary],
    ["hasSpecifiedCycleLength", "cycleLengthSpecified", "cycleSummary.hasSpecifiedCycleLength"],
  );
  const hasSpecifiedPeriodLength = pickBoolean(
    [womenHealthSummary],
    ["hasSpecifiedPeriodLength", "periodLengthSpecified", "cycleSummary.hasSpecifiedPeriodLength"],
  );
  const lengthConfigurationParts: string[] = [];
  if (hasSpecifiedCycleLength !== null) {
    lengthConfigurationParts.push(`Cycle personnalisé: ${hasSpecifiedCycleLength ? "Oui" : "Non"}`);
  }
  if (hasSpecifiedPeriodLength !== null) {
    lengthConfigurationParts.push(`Règles personnalisées: ${hasSpecifiedPeriodLength ? "Oui" : "Non"}`);
  }
  const lengthConfigurationDisplay =
    lengthConfigurationParts.length > 0 ? lengthConfigurationParts.join(" · ") : null;

  const sleepDurationHours =
    sleepDurationSeconds !== null && sleepDurationSeconds !== undefined
      ? sleepDurationSeconds / 3600
      : undefined;
  const deepSleepSeconds = sleepPhases?.profond ?? stageDurations.profond ?? null;
  const remSleepSeconds = sleepPhases?.paradoxal ?? stageDurations.paradoxal ?? null;
  const lightSleepSeconds = sleepPhases?.leger ?? stageDurations.leger ?? null;

  const sleepSnapshot =
    sleepScore !== null ||
    sleepDurationHours !== undefined ||
    deepSleepSeconds !== null ||
    remSleepSeconds !== null ||
    lightSleepSeconds !== null
      ? {
          score: sleepScore ?? undefined,
          durationHours: sleepDurationHours,
          deepHours: deepSleepSeconds !== null ? deepSleepSeconds / 3600 : undefined,
          remHours: remSleepSeconds !== null ? remSleepSeconds / 3600 : undefined,
          lightHours: lightSleepSeconds !== null ? lightSleepSeconds / 3600 : undefined,
        }
      : undefined;

  const bodyBatterySnapshot =
    bodyBatteryLevel !== null || bodyBatteryCharged !== null || bodyBatteryDrained !== null
      ? {
          current: bodyBatteryLevel ?? undefined,
          charged: bodyBatteryCharged ?? undefined,
          drained: bodyBatteryDrained ?? undefined,
        }
      : undefined;

  const stressLowSeconds = stressDurations?.low ?? null;
  const stressModerateSeconds = stressDurations?.moderate ?? null;
  const stressHighSeconds = stressDurations?.high ?? null;
  const stressSnapshot =
    stressAverage !== null ||
    stressLowSeconds !== null ||
    stressModerateSeconds !== null ||
    stressHighSeconds !== null
      ? {
          average: stressAverage ?? undefined,
          lowMin: stressLowSeconds !== null ? stressLowSeconds / 60 : undefined,
          mediumMin: stressModerateSeconds !== null ? stressModerateSeconds / 60 : undefined,
          highMin: stressHighSeconds !== null ? stressHighSeconds / 60 : undefined,
        }
      : undefined;

  const hasActivitySnapshot =
    (activityDurationSeconds !== null && activityDurationSeconds !== undefined) ||
    (activityAvgHr !== null && activityAvgHr !== undefined) ||
    (activityCalories !== null && activityCalories !== undefined) ||
    Boolean(activityType);

  const lastActivitySnapshot = hasActivitySnapshot
    ? {
        durationMin:
          activityDurationSeconds !== null && activityDurationSeconds !== undefined
            ? activityDurationSeconds / 60
            : undefined,
        avgHr: activityAvgHr ?? undefined,
        calories: activityCalories ?? undefined,
        type: activityType ?? undefined,
      }
    : undefined;

  const physioSnapshot =
    spo2Average !== null ||
    skinTempDeviation !== null ||
    respirationAverage !== null ||
    bodyHydration !== null
      ? {
          spo2: spo2Average ?? undefined,
          tempDelta: skinTempDeviation ?? undefined,
          respiration: respirationAverage ?? undefined,
          hydrationPercent: bodyHydration ?? undefined,
        }
      : undefined;

  const allowedCyclePhases = new Set(["MENSTRUAL", "FOLLICULAR", "OVULATION", "LUTEAL"]);
  const cyclePhaseNormalized =
    typeof currentPhaseTypeRaw === "string" ? currentPhaseTypeRaw.trim().toUpperCase() : null;
  const femaleSnapshot =
    cyclePhaseNormalized && allowedCyclePhases.has(cyclePhaseNormalized)
      ? { currentPhaseType: cyclePhaseNormalized as "MENSTRUAL" | "FOLLICULAR" | "OVULATION" | "LUTEAL" }
      : undefined;

  const baselinesSnapshot =
    (hrvAverage !== null && hrvAverage !== undefined) ||
    (restingHeartRate !== null && restingHeartRate !== undefined)
      ? {
          hrv: hrvAverage ?? undefined,
          rhr: restingHeartRate ?? undefined,
        }
      : undefined;

  const trainingScoreData: TrainingScoreData = {
    bodyBattery: bodyBatterySnapshot,
    sleep: sleepSnapshot,
    rhr: (restingHeartRate ?? avgHeartRate24h) ?? undefined,
    stress: stressSnapshot,
    hrv: hrvAverage ?? undefined,
    steps: latestSummary?.steps ?? undefined,
    activeMinutes:
      activeTimeSeconds !== null && activeTimeSeconds !== undefined ? activeTimeSeconds / 60 : undefined,
    totalCalories: totalKilocalories ?? undefined,
    lastActivity: lastActivitySnapshot,
    recentActivities: recentActivityEntries.length > 0 ? recentActivityEntries : undefined,
    physio: physioSnapshot,
    female: femaleSnapshot,
    baselines: baselinesSnapshot,
  };

  const trainingDataCandidates = [
    bodyBatteryLevel,
    bodyBatteryCharged,
    bodyBatteryDrained,
    sleepScore,
    sleepDurationSeconds,
    stageDurations.profond,
    stageDurations.paradoxal,
    stageDurations.leger,
    restingHeartRate,
    hrvAverage,
    stressAverage,
    stressLowSeconds,
    stressModerateSeconds,
    stressHighSeconds,
    latestSummary?.steps,
    activeTimeSeconds,
    totalKilocalories,
    spo2Average,
    skinTempDeviation,
    respirationAverage,
    bodyHydration,
    activityDurationSeconds,
    activityAvgHr,
    activityCalories,
    avgHeartRate24h,
  ];
  const hasTrainingInputs = trainingDataCandidates.some(
    (value) => value !== null && value !== undefined,
  );
  const trainingGaugeData = hasTrainingInputs ? trainingScoreData : mockGarminData();

  const sections: GarminSection[] = [
    {
      title: "🧠 RÉCUPÉRATION & ÉNERGIE",
      description: undefined,
      items: [
        {
          label: "Body Battery (actuel / chargé / dépensé)",
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
                  stressDurations.low ? `Faible ${formatMinutes(stressDurations.low)}` : null,
                  stressDurations.moderate ? `Moyen ${formatMinutes(stressDurations.moderate)}` : null,
                  stressDurations.high ? `Élevé ${formatMinutes(stressDurations.high)}` : null,
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
          hasHistory: Boolean(latestPulseOx),
        },
        {
          label: "Variation de température corporelle",
          value: skinTempDeviation !== null ? `Δ ${formatCelsius(skinTempDeviation)}` : null,
          hint: "Skin Temperature summaries (§7.12).",
          hasHistory: Boolean(latestSkinTemp),
        },
        {
          label: "Poids corporel",
          value: formatKg(bodyWeight),
          hint: "Body Composition summaries (§7.4).",
          hasHistory: bodyWeight !== null || Boolean(latestBodyComposition),
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
          hasHistory: Boolean(latestBodyComposition),
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
  ];

  if (includeWomenHealthSection) {
    sections.push({
      title: "🌸 SANTÉ FÉMININE",
      description: undefined,
      items: [
        {
          label: "Phase actuelle",
          value: currentPhaseTypeDisplay,
          hint: "Women's Health API — currentPhaseType (docs/Womens_API_1.0.4.md).",
        },
        {
          label: "Jour dans le cycle",
          value: dayInCycleDisplay,
          hint: "Women's Health API — dayInCycle.",
        },
        {
          label: "Durée du cycle observée/prévue",
          value: cycleLengthDisplay,
          hint: "Women's Health API — cycleLength & predictedCycleLength.",
        },
        {
          label: "Durées personnalisées fournies",
          value: lengthConfigurationDisplay,
          hint: "Women's Health API — hasSpecifiedCycleLength / hasSpecifiedPeriodLength.",
        },
      ],
    });
  }

  sections.push({
    title: "🕒 MÉTADONNÉES D’ACTIVITÉ",
    description:
      activityHighlights.length > 1
        ? "Balaye horizontalement (ou utilise les boutons sur desktop) pour parcourir les 5 dernières activités synchronisées."
        : undefined,
    items:
      activityHighlights.length === 0
        ? [
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
              value: activityCaloriesDisplay,
              hint: "Activity summaries — activeKilocalories.",
            },
          ]
        : [],
    activities: activityHighlights,
  });

  const webhookEntries = [
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
    latestWomenHealth,
  ];

  const hasWebhookData =
    webhookEntries.some((entry) => Boolean(entry)) ||
    activityHistory.length > 0 ||
    activityDetailHistory.length > 0;
  const hasDailyData = Boolean(latestDailyRaw);

    return {
      connection,
      sections,
      trainingGaugeData,
      usedRealtimeMetrics: hasTrainingInputs,
      hasSyncedOnce: hasWebhookData || hasDailyData,
    };
  } catch (error) {
    console.error("Failed to fetch Garmin data", {
      userId: numericUserId,
      error,
    });
    return buildFallback();
  }
};
