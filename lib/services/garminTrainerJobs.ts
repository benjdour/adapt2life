import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { garminTrainerJobs, users } from "@/db/schema";
import { GarminTrainerWorkout, workoutSchema } from "@/schemas/garminTrainer.schema";
import { fetchGarminConnectionByUserId, ensureGarminAccessToken } from "@/lib/services/garmin-connections";
import { saveGarminWorkoutForUser } from "@/lib/services/userGeneratedArtifacts";
import { getAiModelCandidates } from "@/lib/services/aiModelConfig";
import { parseJsonWithCodeFence } from "@/lib/utils/jsonCleanup";
import { createLogger, type Logger } from "@/lib/logger";
import { buildGarminExerciseCatalogSnippet } from "@/lib/garminExercises";
import { shouldUseExerciseTool, EXERCISE_TOOL_FEATURE_ENABLED } from "@/lib/ai/exercisePolicy";
import {
  inferExerciseSportsFromMarkdown,
  inferPrimarySportFromMarkdown,
  isFallbackExerciseSportsList,
} from "@/lib/garmin/exerciseInference";
import { getGarminAiClients, type GarminAiResult } from "@/lib/ai/garminAiClient";
import { GarminConversionError } from "@/lib/errors";
import {
  getGarminExerciseNames,
  hasGarminExerciseCategory,
  isKnownGarminExercise,
} from "@/constants/garminExerciseData";
import { refundGarminConversionCredit } from "@/lib/services/userCredits";
import { DEFAULT_USER_PLAN, getUserPlanConfig } from "@/lib/constants/userPlans";

const GARMIN_PROMPT_FILENAME = "docs/garmin_trainer_prompt.txt";

let cachedPromptTemplate: string | null | undefined;

const loadPromptTemplate = async (): Promise<string | null> => {
  if (cachedPromptTemplate !== undefined) {
    return cachedPromptTemplate;
  }

  const envPrompt = process.env.GARMIN_TRAINER_PROMPT;
  if (envPrompt && envPrompt.trim()) {
    cachedPromptTemplate = envPrompt;
    return cachedPromptTemplate;
  }

  try {
    const fileBuffer = await readFile(resolve(process.cwd(), GARMIN_PROMPT_FILENAME));
    cachedPromptTemplate = fileBuffer.toString("utf8").trim();
    return cachedPromptTemplate || null;
  } catch {
    cachedPromptTemplate = null;
    return null;
  }
};

const buildFinalPrompt = (template: string, example: string): string => {
  let prompt = template;

  if (prompt.includes("{{STRUCTURED_PLAN_JSON}}")) {
    prompt = prompt.replaceAll("{{STRUCTURED_PLAN_JSON}}", example);
  }

  if (prompt.includes("{{HUMAN_PLAN_MARKDOWN}}")) {
    prompt = prompt.replaceAll("{{HUMAN_PLAN_MARKDOWN}}", example);
  }

  if (prompt.includes("{{EXAMPLE_MARKDOWN}}")) {
    prompt = prompt.replaceAll("{{EXAMPLE_MARKDOWN}}", example);
  } else if (!prompt.includes("{{HUMAN_PLAN_MARKDOWN}}")) {
    prompt = `${prompt.trim()}\n\n---\nExemple d’entraînement (Markdown) :\n${example}`;
  }

  return prompt;
};

const sanitizeWorkoutValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWorkoutValue(item));
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      sanitized[key] = sanitizeWorkoutValue(entry);
    }

    const booleanKeys = new Set(["skipLastRestStep", "isSessionTransitionEnabled"]);
    for (const key of booleanKeys) {
      if (typeof sanitized[key] === "string") {
        if ((sanitized[key] as string).toLowerCase() === "true") {
          sanitized[key] = true;
        } else if ((sanitized[key] as string).toLowerCase() === "false") {
          sanitized[key] = false;
        }
      }
    }

    return sanitized;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  return value;
};

const toSearchableText = (value: string | null | undefined): string =>
  value
    ? value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
    : "";

type StepStatus = "ok" | "ko";

const logStepStatus = (logger: Logger, step: string, status: StepStatus, context?: Record<string, unknown>) => {
  const payload = { step, status, ...context };
  if (status === "ok") {
    logger.info("garmin trainer job step", payload);
  } else {
    logger.error("garmin trainer job step", payload);
  }
};

const pickFallbackExerciseName = (
  sport: string | null | undefined,
  category: string,
  currentName: string | null | undefined,
  description: string | null | undefined,
): string | null => {
  const candidates = getGarminExerciseNames(sport ?? "", category);
  if (!candidates.length) {
    return null;
  }

  const searchable = `${toSearchableText(currentName)} ${toSearchableText(description)}`;
  const directMatch = candidates.find((entry) => searchable.includes(entry.toLowerCase()));
  if (directMatch) {
    return directMatch;
  }

  if (/jog|run|course|footing/.test(searchable)) {
    const jogCandidate = candidates.find((entry) => entry.toLowerCase().includes("jog"));
    if (jogCandidate) {
      return jogCandidate;
    }
  }

  if (/walk|marche|recover|recup|repos|cooldown/.test(searchable)) {
    const walkCandidate = candidates.find((entry) => entry.toLowerCase().includes("walk"));
    if (walkCandidate) {
      return walkCandidate;
    }
  }

  return candidates[0];
};

const GARMIN_SWIM_STROKES = new Set(["BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "FREESTYLE", "MIXED", "IM", "RIMO", "CHOICE"]);
const SECONDARY_TARGET_RANGE_TYPES = new Set(["CADENCE", "HEART_RATE", "POWER", "SPEED", "PACE"]);
const SECONDARY_TARGET_SPORTS = new Set(["CYCLING", "LAP_SWIMMING"]);
const PERCENT_RANGE_SPORTS = new Set(["RUNNING", "CYCLING", "CARDIO_TRAINING"]);
const HR_ZONE_TO_PERCENT: Record<number, { low: number; high: number }> = {
  1: { low: 55, high: 65 },
  2: { low: 65, high: 75 },
  3: { low: 75, high: 85 },
  4: { low: 85, high: 95 },
  5: { low: 95, high: 100 },
};
const SWIM_INTENSITY_TO_INSTRUCTION: Record<string, number> = {
  REST: 2,
  RECOVERY: 3,
  WARMUP: 4,
  COOLDOWN: 3,
  ACTIVE: 6,
  INTERVAL: 8,
  MAIN: 7,
};

const toNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const ENDURANCE_SPORTS = new Set([
  "RUNNING",
  "TRAIL_RUNNING",
  "TREADMILL_RUNNING",
  "TRACK_RUNNING",
  "CYCLING",
  "INDOOR_CYCLING",
  "MOUNTAIN_BIKING",
  "FAT_BIKING",
  "VIRTUAL_CYCLING",
  "LAP_SWIMMING",
  "OPEN_WATER_SWIMMING",
]);

class TimeoutError extends Error {
  label: string;
  timeoutMs: number;

  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.label = label;
    this.timeoutMs = timeoutMs;
  }
}

const sanitizeStrokeType = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (GARMIN_SWIM_STROKES.has(normalized)) {
    return normalized;
  }
  const helpers = normalized.replace(/\s+/g, " ");
  if (/CRAWL|FREESTYLE|FREE/.test(helpers)) {
    return "FREESTYLE";
  }
  if (/BACK|DOS/.test(helpers)) {
    return "BACKSTROKE";
  }
  if (/BREAST|BRASSE/.test(helpers)) {
    return "BREASTSTROKE";
  }
  if (/BUTTER/.test(helpers)) {
    return "BUTTERFLY";
  }
  if (/IM/.test(helpers)) {
    return "IM";
  }
  if (/MIX|MEDLEY/.test(helpers)) {
    return "MIXED";
  }
  if (/RIMO/.test(helpers)) {
    return "RIMO";
  }
  if (/CHOICE|CHOIX/.test(helpers)) {
    return "CHOICE";
  }
  if (/KICK|JAMBE/.test(helpers)) {
    return "CHOICE";
  }
  return null;
};

const normalizeExerciseMetadata = (step: Record<string, unknown>, segmentSport: string | null | undefined) => {
  const intensity = typeof step.intensity === "string" ? step.intensity.toUpperCase() : null;

  const ensureRestMetadata = () => {
    const restCategory =
      (hasGarminExerciseCategory(segmentSport, "CARDIO") && "CARDIO") ||
      (hasGarminExerciseCategory(segmentSport, "WARM_UP") && "WARM_UP") ||
      null;
    if (!restCategory) {
      return;
    }
    const restName =
      pickFallbackExerciseName(segmentSport, restCategory, "walk", "walk") ??
      pickFallbackExerciseName(segmentSport, restCategory, "recover", "recover") ??
      pickFallbackExerciseName(segmentSport, restCategory, null, null);
    if (restName) {
      step.exerciseCategory = restCategory;
      step.exerciseName = restName;
    }
  };

  const category = typeof step.exerciseCategory === "string" ? step.exerciseCategory : null;
  const name = typeof step.exerciseName === "string" ? step.exerciseName : null;

  if (category && name && isKnownGarminExercise(segmentSport, category, name)) {
    return;
  }

  if (!category || !hasGarminExerciseCategory(segmentSport, category)) {
    if (intensity === "REST" || intensity === "RECOVERY") {
      ensureRestMetadata();
    }
    return;
  }

  const fallbackName = pickFallbackExerciseName(
    segmentSport,
    category,
    name,
    typeof step.description === "string" ? step.description : null,
  );

  if (fallbackName) {
    step.exerciseCategory = category;
    step.exerciseName = fallbackName;
    return;
  }

  if (intensity === "REST" || intensity === "RECOVERY") {
    const restName =
      pickFallbackExerciseName(segmentSport, category, "walk", "walk") ??
      pickFallbackExerciseName(segmentSport, category, "recover", "recover");
    if (restName) {
      step.exerciseCategory = category;
      step.exerciseName = restName;
      return;
    }
  }

  const finalFallback =
    pickFallbackExerciseName(segmentSport, category, null, typeof step.description === "string" ? step.description : null) ??
    getGarminExerciseNames(segmentSport ?? "", category)[0] ??
    null;
  step.exerciseCategory = category;
  step.exerciseName = finalFallback;
};

const ensureStepDescription = (step: Record<string, unknown>) => {
  if (typeof step.description !== "string") {
    step.description = "";
  }
};

const enforceWorkoutPostProcessing = (workout: Record<string, unknown>): Record<string, unknown> => {
  const clone: Record<string, unknown> = { ...workout };

  const swimSegmentPoolValues: Array<{ length: number | null; unit: string | null }> = [];

  const inferRepeatIntensity = (repeatStep: Record<string, unknown>): string => {
    const childSteps = Array.isArray(repeatStep.steps) ? repeatStep.steps : [];
    const firstChild = childSteps.find((child) => child && typeof child === "object" && (child as Record<string, unknown>).intensity);
    if (firstChild && typeof (firstChild as Record<string, unknown>).intensity === "string") {
      const childIntensity = ((firstChild as Record<string, unknown>).intensity as string).trim();
      if (childIntensity) {
        return childIntensity;
      }
    }

    const effortChild = childSteps.find((child) => child && typeof child === "object" && (child as Record<string, unknown>).intensity !== "REST");
    if (effortChild && typeof (effortChild as Record<string, unknown>).intensity === "string") {
      const childIntensity = ((effortChild as Record<string, unknown>).intensity as string).trim();
      if (childIntensity) {
        return childIntensity;
      }
    }

    return "ACTIVE";
  };

  const flattenNestedRepeatChildren = (repeatStep: Record<string, unknown>) => {
    if (!Array.isArray(repeatStep.steps)) {
      repeatStep.steps = [];
      return;
    }

    const expandRepeatStep = (nestedRepeat: Record<string, unknown>): Record<string, unknown>[] => {
      const rawChildren = Array.isArray(nestedRepeat.steps) ? nestedRepeat.steps : [];
      const normalizedChildren: Record<string, unknown>[] = rawChildren.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }
        const child = { ...(entry as Record<string, unknown>) };
        if (child.type === "WorkoutRepeatStep") {
          return expandRepeatStep(child);
        }
        child.stepId = null;
        return [child];
      });

      const repeatValue =
        typeof nestedRepeat.repeatValue === "number" && Number.isFinite(nestedRepeat.repeatValue)
          ? Math.max(1, Math.floor(nestedRepeat.repeatValue))
          : 1;

      const expanded: Record<string, unknown>[] = [];
      for (let round = 0; round < repeatValue; round += 1) {
        normalizedChildren.forEach((child, index) => {
          const intensity = typeof child.intensity === "string" ? child.intensity : null;
          const isRestIntensity = intensity === "REST" || intensity === "RECOVERY" || intensity === "EASY";
          const isLastIteration = round === repeatValue - 1;
          const isLastChild = index === normalizedChildren.length - 1;
          if (nestedRepeat.skipLastRestStep && isRestIntensity && isLastIteration && isLastChild) {
            return;
          }
          const clonedChild = { ...child };
          clonedChild.stepId = null;
          expanded.push(clonedChild);
        });
      }

      return expanded;
    };

    const flattenedChildren: Record<string, unknown>[] = [];
    repeatStep.steps.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const child = { ...(entry as Record<string, unknown>) };
      if (child.type === "WorkoutRepeatStep") {
        flattenedChildren.push(...expandRepeatStep(child));
        return;
      }
      child.stepId = null;
      flattenedChildren.push(child);
    });

    flattenedChildren.forEach((child, index) => {
      child.stepOrder = index + 1;
    });

    repeatStep.steps = flattenedChildren;
  };

  const normalizeSteps = (
    steps: unknown,
    isSwim: boolean,
    segmentSport: string | null | undefined,
  ): unknown => {
    if (!Array.isArray(steps)) {
      return steps;
    }
    const normalizedSport = segmentSport ? segmentSport.toUpperCase() : null;
    const supportsSecondaryTargets = normalizedSport ? SECONDARY_TARGET_SPORTS.has(normalizedSport) : false;

    const ensureCadenceTargets = (step: Record<string, unknown>) => {
      if (step.type === "WorkoutRepeatStep") {
        return;
      }
      const applyCadenceRange = (low: number | null, high: number | null, single: number | null, promotePrimary: boolean) => {
        if (low == null && high == null && single == null) {
          return false;
        }
        const resolvedLow = low ?? high ?? single;
        let resolvedHigh = high ?? low ?? single ?? resolvedLow;
        if (resolvedLow == null && resolvedHigh == null) {
          return false;
        }
        if (resolvedLow != null && resolvedHigh != null && resolvedLow >= resolvedHigh) {
          resolvedHigh = resolvedLow + 1;
        }
        if (promotePrimary) {
          step.targetType = "CADENCE";
          step.targetValue = null;
          step.targetValueType = null;
          step.targetValueLow = resolvedLow ?? null;
          step.targetValueHigh = resolvedHigh ?? resolvedLow ?? null;
          step.secondaryTargetType = null;
          step.secondaryTargetValue = null;
          step.secondaryTargetValueLow = null;
          step.secondaryTargetValueHigh = null;
          step.secondaryTargetValueType = null;
        } else {
          step.secondaryTargetType = "CADENCE";
          step.secondaryTargetValue = null;
          step.secondaryTargetValueType = null;
          step.secondaryTargetValueLow = resolvedLow ?? null;
          step.secondaryTargetValueHigh = resolvedHigh ?? resolvedLow ?? null;
        }
        return true;
      };

      if (typeof step.targetType === "string" && step.targetType.toUpperCase() === "CADENCE") {
        const low = toNumberOrNull(step.targetValueLow);
        const high = toNumberOrNull(step.targetValueHigh);
        const single = toNumberOrNull(step.targetValue);
        if (applyCadenceRange(low, high, single, true)) {
          return;
        }
      }

      const description = typeof step.description === "string" ? step.description : "";
      if (!description || !/cadence/i.test(description)) {
        return;
      }

      const cadenceMatch = description.match(/cadence[^0-9]*(\d{2,3})(?:\D+(\d{2,3}))?/i);
      if (!cadenceMatch) {
        return;
      }

      const rawLow = cadenceMatch[1] ? Number.parseInt(cadenceMatch[1], 10) : NaN;
      const rawHigh = cadenceMatch[2] ? Number.parseInt(cadenceMatch[2], 10) : NaN;

      const low = Number.isFinite(rawLow) ? rawLow : null;
      const high = Number.isFinite(rawHigh) ? rawHigh : null;

      if (low == null && high == null) {
        return;
      }

      const hasPrimary =
        typeof step.targetType === "string" && step.targetType !== "" && step.targetType !== "OPEN";
      const cadenceRange = {
        low: low != null ? low : high,
        high: high != null ? high : low,
      };

      if (!hasPrimary || step.targetType === "CADENCE") {
        applyCadenceRange(cadenceRange.low ?? null, cadenceRange.high ?? cadenceRange.low ?? null, null, true);
        return;
      }

      if (step.secondaryTargetType == null || step.secondaryTargetType === "CADENCE") {
        applyCadenceRange(cadenceRange.low ?? null, cadenceRange.high ?? cadenceRange.low ?? null, null, false);
      }
    };

    const ensureRestDescriptions = (step: Record<string, unknown>) => {
      const durationType = typeof step.durationType === "string" ? step.durationType : null;
      const durationValue =
        typeof step.durationValue === "number" && Number.isFinite(step.durationValue) ? step.durationValue : null;
      const intensity = typeof step.intensity === "string" ? step.intensity : null;

      if (!durationValue) {
        return;
      }

      const isRestStep = intensity === "REST" || intensity === "EASY" || step.type === "WorkoutRestStep";
      if (!isRestStep) {
        return;
      }

      if (durationType === "REPETITION_SWIM_CSS_OFFSET" || durationType === "FIXED_REPETITION") {
        if (typeof step.description !== "string" || !step.description.trim()) {
          step.description = "Repos (envoyer à la prochaine répétition)";
        }
      }
    };

    const ensureSwimTargets = (step: Record<string, unknown>) => {
      if (!isSwim || step.type === "WorkoutRepeatStep") {
        return;
      }

      const dropSecondaryTarget = () => {
        step.secondaryTargetType = null;
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = null;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
      };

      const applySwimInstruction = (intensity: string | null, providedValue: number | null = null) => {
        const normalizedIntensity = intensity ? intensity.toUpperCase() : null;
        const intensityCandidate =
          (normalizedIntensity && SWIM_INTENSITY_TO_INSTRUCTION[normalizedIntensity]) ?? providedValue ?? 5;
        const intensityValue =
          typeof intensityCandidate === "number" && Number.isFinite(intensityCandidate) ? intensityCandidate : 5;
        const clampedValue = Math.min(10, Math.max(1, Math.round(intensityValue)));
        step.secondaryTargetType = "SWIM_INSTRUCTION";
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = clampedValue;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
      };

      const applyCssOffset = (value: number | null) => {
        const resolved = value == null ? null : Math.max(-60, Math.min(60, Math.round(value)));
        if (resolved == null) {
          dropSecondaryTarget();
          return;
        }
        step.secondaryTargetType = "SWIM_CSS_OFFSET";
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = resolved;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
      };

      const applyPaceZone = (value: number | null) => {
        if (value == null) {
          dropSecondaryTarget();
          return;
        }
        const resolved = Math.max(0, value);
        step.secondaryTargetType = "PACE_ZONE";
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = resolved;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
      };

      const intensity = typeof step.intensity === "string" ? step.intensity.toUpperCase() : null;
      const primaryType =
        typeof step.targetType === "string" && step.targetType.trim().length > 0
          ? step.targetType.toUpperCase()
          : null;
      const primaryLow = toNumberOrNull(step.targetValueLow);
      const primaryHigh = toNumberOrNull(step.targetValueHigh);
      const primaryValue = toNumberOrNull(step.targetValue);

      if (primaryType && primaryType !== "OPEN") {
        if (primaryType === "PACE" || primaryType === "SPEED") {
          applyPaceZone(primaryLow ?? primaryHigh ?? primaryValue);
        } else if (primaryType === "SWIM_CSS_OFFSET") {
          applyCssOffset(primaryLow ?? primaryHigh ?? primaryValue);
        } else {
          applySwimInstruction(intensity);
        }

        step.targetType = null;
        step.targetValue = null;
        step.targetValueLow = null;
        step.targetValueHigh = null;
        step.targetValueType = null;
      } else {
        step.targetType = null;
        step.targetValue = null;
        step.targetValueLow = null;
        step.targetValueHigh = null;
        step.targetValueType = null;
      }

      const secondaryType =
        typeof step.secondaryTargetType === "string" ? step.secondaryTargetType.toUpperCase() : null;

      if (!secondaryType) {
        step.secondaryTargetType = "SWIM_INSTRUCTION";
        applySwimInstruction(intensity);
        return;
      }

      if (secondaryType === "SWIM_INSTRUCTION") {
        applySwimInstruction(intensity, toNumberOrNull(step.secondaryTargetValueLow));
        return;
      }

      if (secondaryType === "SWIM_CSS_OFFSET") {
        applyCssOffset(toNumberOrNull(step.secondaryTargetValueLow));
        return;
      }

      if (secondaryType === "PACE_ZONE") {
        applyPaceZone(
          toNumberOrNull(step.secondaryTargetValueLow) ??
            toNumberOrNull(step.secondaryTargetValueHigh) ??
            toNumberOrNull(step.secondaryTargetValue),
        );
        return;
      }

      applySwimInstruction(intensity);
    };

    const convertZonesToPercentRange = (
      lowZone: number | null,
      highZone: number | null,
      singleZone: number | null,
    ): { low: number | null; high: number | null } | null => {
      const zones = [lowZone, highZone, singleZone]
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
        .map((value) => Math.round(value))
        .filter((value) => value >= 1 && value <= 5);
      if (zones.length === 0) {
        return null;
      }
      const minZone = Math.min(...zones);
      const maxZone = Math.max(...zones);
      const minPercent = HR_ZONE_TO_PERCENT[minZone]?.low ?? null;
      const maxPercent = HR_ZONE_TO_PERCENT[maxZone]?.high ?? HR_ZONE_TO_PERCENT[minZone]?.high ?? null;
      return { low: minPercent, high: maxPercent };
    };

    const ensurePrimaryTargetRanges = (step: Record<string, unknown>) => {
      if (step.type === "WorkoutRepeatStep") {
        return;
      }
      const rawTargetType = typeof step.targetType === "string" ? step.targetType.toUpperCase() : null;
      if (!rawTargetType) {
        return;
      }
      step.targetType = rawTargetType;
      const normalizedSegmentSport = normalizedSport ?? null;
      const shouldForcePercent = normalizedSegmentSport ? PERCENT_RANGE_SPORTS.has(normalizedSegmentSport) : true;
      const requiresPercentRange = shouldForcePercent && (rawTargetType === "POWER" || rawTargetType === "HEART_RATE");
      if (!requiresPercentRange) {
        if ((rawTargetType === "PACE" || rawTargetType === "SPEED") && (step.targetValueLow == null || step.targetValueHigh == null)) {
          step.targetType = "OPEN";
          step.targetValue = null;
          step.targetValueLow = null;
          step.targetValueHigh = null;
          step.targetValueType = null;
        }
        return;
      }

      const low = toNumberOrNull(step.targetValueLow);
      const high = toNumberOrNull(step.targetValueHigh);
      const single = toNumberOrNull(step.targetValue);
      const zoneRange = convertZonesToPercentRange(low, high, single);
      if (low == null && high == null && single == null && !zoneRange) {
        return;
      }

      const resolvedLow = zoneRange?.low ?? low ?? high ?? single;
      let resolvedHigh = zoneRange?.high ?? high ?? low ?? single ?? resolvedLow;
      if (resolvedLow != null && resolvedHigh != null && resolvedLow >= resolvedHigh) {
        resolvedHigh = resolvedLow + 0.1;
      }
      step.targetValue = null;
      step.targetValueLow = resolvedLow ?? null;
      step.targetValueHigh = resolvedHigh ?? resolvedLow ?? null;
      step.targetValueType = "PERCENT";
    };

    const ensureSecondaryTargetRanges = (step: Record<string, unknown>) => {
      if (step.type === "WorkoutRepeatStep") {
        return;
      }
      if (!supportsSecondaryTargets) {
        step.secondaryTargetType = null;
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = null;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
        return;
      }
      const rawType = typeof step.secondaryTargetType === "string" ? step.secondaryTargetType.toUpperCase() : null;
      if (!rawType || !SECONDARY_TARGET_RANGE_TYPES.has(rawType)) {
        return;
      }
      step.secondaryTargetType = rawType;
      const low = toNumberOrNull(step.secondaryTargetValueLow);
      const high = toNumberOrNull(step.secondaryTargetValueHigh);
      const single = toNumberOrNull(step.secondaryTargetValue);
      if (low == null && high == null && single == null) {
        return;
      }
      const resolvedLow = low ?? single ?? high;
      let resolvedHigh = high ?? single ?? low ?? resolvedLow;
      if (resolvedLow != null && resolvedHigh != null && resolvedLow >= resolvedHigh) {
        resolvedHigh = resolvedLow + 1;
      }
      step.secondaryTargetValueLow = resolvedLow ?? null;
      step.secondaryTargetValueHigh = resolvedHigh ?? resolvedLow ?? null;
      step.secondaryTargetValue = null;
      step.secondaryTargetValueType = null;
    };

    return steps.map((entry) => {
      if (!entry || typeof entry !== "object") {
        return entry;
      }

      const step = { ...(entry as Record<string, unknown>) };
      if (isSwim && step.type === "WorkoutRepeatStep") {
        step.skipLastRestStep = false;
      }
      ensureStepDescription(step);
      ensureCadenceTargets(step);
      ensurePrimaryTargetRanges(step);
      ensureSecondaryTargetRanges(step);
      ensureRestDescriptions(step);
      ensureSwimTargets(step);
      normalizeExerciseMetadata(step, segmentSport);
      const rawStrokeType = typeof step.strokeType === "string" ? step.strokeType : null;
      const sanitizedStrokeType = sanitizeStrokeType(rawStrokeType);
      if (rawStrokeType && !sanitizedStrokeType) {
        step.strokeType = null;
      } else if (sanitizedStrokeType) {
        step.strokeType = sanitizedStrokeType;
      }

      if (step.type === "WorkoutRepeatStep") {
        step.intensity = typeof step.intensity === "string" && step.intensity.trim() ? step.intensity : inferRepeatIntensity(step);
        step.steps = normalizeSteps(step.steps, isSwim, segmentSport);
        flattenNestedRepeatChildren(step);
      }

      if (isSwim && step.poolLength && typeof step.poolLength === "object") {
        const pool = step.poolLength as Record<string, unknown>;
        const lengthValue = toNumberOrNull(pool.value);
        const lengthUnit = typeof pool.unit === "string" ? pool.unit : null;
        swimSegmentPoolValues.push({ length: lengthValue, unit: lengthUnit });
        delete step.poolLength;
      }

      return step;
    });
  };

  const segments = Array.isArray(clone.segments) ? clone.segments : [];

  const normalizedSegments = segments.map((segment) => {
    if (!segment || typeof segment !== "object") {
      return segment;
    }

    const segmentRecord = { ...(segment as Record<string, unknown>) };
    if ("segmentId" in segmentRecord) {
      delete segmentRecord.segmentId;
    }
    if ("segmentName" in segmentRecord) {
      delete segmentRecord.segmentName;
    }
    if ("name" in segmentRecord) {
      delete segmentRecord.name;
    }
    if ("segmentType" in segmentRecord) {
      delete segmentRecord.segmentType;
    }
    if ("workoutSteps" in segmentRecord && !segmentRecord.steps) {
      segmentRecord.steps = segmentRecord.workoutSteps;
    }
    if ("workoutSteps" in segmentRecord) {
      delete segmentRecord.workoutSteps;
    }
    const sportType = typeof segmentRecord.sportType === "string" ? segmentRecord.sportType : null;

    const isSwim = sportType === "swimming" || sportType === "pool_swimming" || segmentRecord.sport === "LAP_SWIMMING";
    const segmentSport = typeof segmentRecord.sport === "string" ? segmentRecord.sport : null;
    segmentRecord.steps = normalizeSteps(segmentRecord.steps, isSwim, segmentSport);

    if (isSwim) {
      const poolLengthObject =
        segmentRecord.poolLength && typeof segmentRecord.poolLength === "object"
          ? (segmentRecord.poolLength as Record<string, unknown>)
          : null;
      const directPoolLength = toNumberOrNull(segmentRecord.poolLength);
      const inferredLength = directPoolLength ?? (poolLengthObject ? toNumberOrNull(poolLengthObject.value) : null);
      const directPoolUnit =
        typeof segmentRecord.poolLengthUnit === "string"
          ? segmentRecord.poolLengthUnit
          : poolLengthObject && typeof poolLengthObject.unit === "string"
            ? (poolLengthObject.unit as string)
            : null;

      segmentRecord.poolLength = inferredLength ?? null;
      if (directPoolUnit) {
        segmentRecord.poolLengthUnit = directPoolUnit;
      }

      if (segmentRecord.poolLength == null && swimSegmentPoolValues.length > 0) {
        const fallback = swimSegmentPoolValues[0];
        segmentRecord.poolLength = fallback.length ?? null;
        if (fallback.unit && !segmentRecord.poolLengthUnit) {
          segmentRecord.poolLengthUnit = fallback.unit;
        }
      }
    }

    return segmentRecord;
  });

  const workoutSport = typeof clone.sport === "string" ? clone.sport : null;
  if (workoutSport !== "MULTI_SPORT" && normalizedSegments.length > 1) {
    const [firstSegment, ...extraSegments] = normalizedSegments;
    const mergedSteps = Array.isArray(firstSegment?.steps) ? [...(firstSegment.steps as Record<string, unknown>[])] : [];
    let currentOrder = mergedSteps.length;
    for (const extra of extraSegments) {
      const steps = Array.isArray(extra?.steps) ? (extra.steps as Record<string, unknown>[]) : [];
      for (const entry of steps) {
        const clonedStep = entry && typeof entry === "object" ? { ...(entry as Record<string, unknown>) } : entry;
        if (clonedStep && typeof clonedStep === "object") {
          currentOrder += 1;
          clonedStep.stepOrder = currentOrder;
          mergedSteps.push(clonedStep);
        }
      }
    }
    if (firstSegment && typeof firstSegment === "object") {
      const baseSegment = { ...(firstSegment as Record<string, unknown>) };
      baseSegment.steps = mergedSteps;
      const estimatedDurationSum = normalizedSegments.reduce((total, segment) => {
        const duration = segment && typeof segment === "object" ? (segment as Record<string, unknown>).estimatedDurationInSecs : null;
        if (typeof duration === "number" && Number.isFinite(duration)) {
          return total + duration;
        }
        return total;
      }, 0);
      baseSegment.estimatedDurationInSecs = estimatedDurationSum > 0 ? estimatedDurationSum : baseSegment.estimatedDurationInSecs ?? null;
      clone.segments = [baseSegment];
    } else {
      clone.segments = normalizedSegments.slice(0, 1);
    }
  } else {
    clone.segments = normalizedSegments;
  }

  return clone;
};

const ensureOwnerIdType = (garminUserId: string): string | number => {
  const numeric = Number.parseInt(garminUserId, 10);
  if (Number.isFinite(numeric) && Number.isSafeInteger(numeric)) {
    return numeric;
  }
  return garminUserId;
};

const baseLogger = createLogger("garmin-trainer-jobs");
const DEFAULT_JOB_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_JOB_TIMEOUT_MS ?? "600000");
const FETCH_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_FETCH_TIMEOUT_MS ?? "120000");
const CONVERSION_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_CONVERSION_TIMEOUT_MS ?? "300000");
const PUSH_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_PUSH_TIMEOUT_MS ?? "300000");
const MAX_PLAN_MARKDOWN_CHARS = Number(process.env.GARMIN_TRAINER_PLAN_MAX_CHARS ?? "12000");
const JOB_HEARTBEAT_INTERVAL_MS = Number(process.env.GARMIN_TRAINER_JOB_HEARTBEAT_MS ?? "30000");

const runWithTimeout = async <T>(factory: () => Promise<T>, timeoutMs: number, label: string, logger?: Logger): Promise<T> => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return factory();
  }

  const startedAt = Date.now();
  logger?.info(`${label} started`, { label, timeoutMs });

  return await new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      const timeoutError = new TimeoutError(label, timeoutMs);
      logger?.error(`${label} timed out`, { label, timeoutMs, durationMs: Date.now() - startedAt });
      reject(timeoutError);
    }, timeoutMs);

    const clear = () => {
      clearTimeout(timer);
    };

    factory()
      .then((value) => {
        if (settled) {
          return;
        }
        settled = true;
        clear();
        logger?.info(`${label} completed`, { label, durationMs: Date.now() - startedAt });
        resolve(value);
      })
      .catch((error) => {
        if (settled) {
          return;
        }
        settled = true;
        clear();
        logger?.error(`${label} failed`, { label, durationMs: Date.now() - startedAt, error });
        reject(error);
      });
  });
};

const updateJob = async (jobId: number, values: Partial<typeof garminTrainerJobs.$inferInsert>) => {
  await db
    .update(garminTrainerJobs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(garminTrainerJobs.id, jobId));
};

const touchJob = async (jobId: number) => {
  await db
    .update(garminTrainerJobs)
    .set({ updatedAt: new Date() })
    .where(eq(garminTrainerJobs.id, jobId));
};

const convertPlanMarkdownForUser = async (
  userId: number,
  planMarkdown: string,
  jobLogger?: Logger,
  options?: { jobId?: number },
) => {
  const logger = jobLogger ?? baseLogger.child({ userId });
  const startedAt = Date.now();
  const trimmedPlan = planMarkdown.trim();
  const normalizedPlan = MAX_PLAN_MARKDOWN_CHARS > 0 ? trimmedPlan.slice(0, MAX_PLAN_MARKDOWN_CHARS) : trimmedPlan;
  logger.info("garmin trainer job conversion started", {
    planLength: planMarkdown.length,
    normalizedLength: normalizedPlan.length,
  });
  const connection = await fetchGarminConnectionByUserId(userId);
  if (!connection) {
    logStepStatus(logger, "conversion.connection", "ko", { reason: "missing_garmin_connection" });
    throw new Error("Aucune connexion Garmin trouvée pour cet utilisateur.");
  }
  logStepStatus(logger, "conversion.connection", "ok", {
    garminConnectionId: connection.id ?? null,
    garminUserId: connection.garminUserId ?? null,
  });
  logger.info("garmin trainer job conversion connection resolved", {
    garminConnectionId: connection.id ?? null,
    garminUserId: connection.garminUserId ?? null,
  });

  const promptTemplate = await loadPromptTemplate();
  if (!promptTemplate) {
    logStepStatus(logger, "conversion.prompt", "ko", { reason: "prompt_missing" });
    throw new Error("Prompt Garmin introuvable. Ajoute la variable GARMIN_TRAINER_PROMPT ou le fichier docs/garmin_trainer_prompt.txt.");
  }
  logStepStatus(logger, "conversion.prompt", "ok");
  logger.info("garmin trainer job conversion prompt loaded");

  const ownerInstruction = `Utilise strictement "ownerId": "${connection.garminUserId}" (premier champ du JSON) et ne modifie jamais cette valeur.`;
  const basePrompt = [ownerInstruction, buildFinalPrompt(promptTemplate, normalizedPlan)].join("\n\n");
  const sportsForPrompt = inferExerciseSportsFromMarkdown(normalizedPlan);
  const primaryMarkdownSport = inferPrimarySportFromMarkdown(normalizedPlan);
  logStepStatus(logger, "conversion.sport_inference", "ok", {
    sports: sportsForPrompt,
    primarySport: primaryMarkdownSport ?? null,
  });
  const isFallbackSportList = isFallbackExerciseSportsList(sportsForPrompt);
  const isEndurancePrimary = primaryMarkdownSport
    ? ENDURANCE_SPORTS.has(primaryMarkdownSport.toUpperCase())
    : false;
  const hasToolSport = !isEndurancePrimary && !isFallbackSportList && sportsForPrompt.some((sport) => shouldUseExerciseTool(sport));
  const canUseExerciseTool = EXERCISE_TOOL_FEATURE_ENABLED && hasToolSport;
  const needsExerciseCatalog = hasToolSport && !canUseExerciseTool;

  const candidateModels = await getAiModelCandidates("garmin-trainer");
  logStepStatus(logger, "conversion.model_candidates", "ok", { candidates: candidateModels });
  logger.info("garmin trainer job conversion candidates resolved", { candidateModels });
  const systemPrompt = process.env.GARMIN_TRAINER_SYSTEM_PROMPT ??
    "Tu es un assistant spécialisé dans la préparation d’entraînements Garmin pour Adapt2Life. Analyse l’exemple fourni et applique fidèlement les instructions du prompt utilisateur.";

  const referer = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

  const { strict: strictClient, classic: classicClient } = getGarminAiClients();
  let aiResult: GarminAiResult | null = null;
  let usedExerciseTool = false;

  const runClassicClient = async () => {
    const catalogMaxChars = Number(process.env.GARMIN_EXERCISE_PROMPT_MAX_CHARS ?? "60000") || 60_000;
    const promptChunks = [basePrompt];
    if (needsExerciseCatalog && catalogMaxChars > 0) {
      const exerciseCatalogSnippet = buildGarminExerciseCatalogSnippet({
        sports: sportsForPrompt,
        maxChars: catalogMaxChars,
      });
      promptChunks.push(exerciseCatalogSnippet);
    }
    const userPrompt = promptChunks.join("\n\n");

    const classicStartedAt = Date.now();
    logger.info("garmin trainer job conversion invoking classic client", { candidateModels, promptLength: userPrompt.length });
    const result = await classicClient.generate({
      basePrompt: userPrompt,
      systemPrompt,
      modelIds: candidateModels,
      referer,
    });
    logger.info("garmin trainer job conversion classic client response received", {
      durationMs: Date.now() - classicStartedAt,
    });
    logStepStatus(logger, "conversion.ai.classic", "ok", {
      durationMs: Date.now() - classicStartedAt,
      promptLength: userPrompt.length,
      candidateCount: candidateModels.length,
    });
    return result;
  };

  const runStrictClient = async () => {
    const strictStartedAt = Date.now();
    logger.info("garmin trainer job conversion invoking strict client", { candidateModels });
    const result = await strictClient.generate({
      basePrompt,
      systemPrompt,
      modelIds: candidateModels,
      referer,
    });
    logger.info("garmin trainer job conversion strict client response received", {
      durationMs: Date.now() - strictStartedAt,
    });
    logStepStatus(logger, "conversion.ai.strict", "ok", {
      durationMs: Date.now() - strictStartedAt,
      candidateCount: candidateModels.length,
    });
    return result;
  };

  const persistAiResponse = async (result: GarminAiResult | null) => {
    if (!options?.jobId || !result) {
      return;
    }
    try {
      await updateJob(options.jobId, {
        aiRawResponse: result.rawText,
        aiModelId: result.modelId ?? null,
      });
    } catch (error) {
      logger.warn("garmin trainer job conversion raw persist failed", { error });
    }
  };

  try {
    if (canUseExerciseTool) {
      aiResult = await runStrictClient();
      usedExerciseTool = true;
    }

    if (!aiResult) {
      aiResult = await runClassicClient();
      usedExerciseTool = false;
    }
  } catch (error) {
    logStepStatus(logger, usedExerciseTool ? "conversion.ai.strict" : "conversion.ai.classic", "ko", {
      error: error instanceof Error ? error.message : String(error),
    });
    logger.error("garmin trainer job conversion request failed", { error, durationMs: Date.now() - startedAt });
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (!aiResult) {
    throw new Error("Réponse IA vide.");
  }

  await persistAiResponse(aiResult);

  logger.info("garmin trainer job conversion completed", {
    useExerciseTool: usedExerciseTool,
    durationMs: Date.now() - startedAt,
  });

  const parseStartedAt = Date.now();
  let parsedResult = parseJsonWithCodeFence(aiResult.rawText);
  if (!parsedResult && usedExerciseTool) {
    logger.warn("garmin trainer job conversion strict response invalid, falling back to classic client");
    logStepStatus(logger, "conversion.ai.strict", "ko", { reason: "invalid_json_strict_response" });
    aiResult = await runClassicClient();
    usedExerciseTool = false;
    await persistAiResponse(aiResult);
    parsedResult = parseJsonWithCodeFence(aiResult.rawText);
  }
  if (!parsedResult) {
    throw new GarminConversionError("JSON invalide renvoyé par l’IA : impossible de parser la réponse.", {
      rawResponse: aiResult.rawText,
    });
  }
  logStepStatus(logger, "conversion.parse", "ok", { durationMs: Date.now() - parseStartedAt });

  const parsedJson = parsedResult.parsed;
  const sourceJson = parsedResult.source;

  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
    throw new GarminConversionError("Le JSON renvoyé par l’IA ne correspond pas à un objet valide.", {
      rawResponse: sourceJson,
    });
  }

  if (usedExerciseTool && (!("segments" in parsedJson) || !Array.isArray((parsedJson as Record<string, unknown>).segments))) {
    const toolError = typeof (parsedJson as Record<string, unknown>).error === "string"
      ? (parsedJson as Record<string, unknown>).error
      : "Aucun exercice valide trouvé dans le catalogue Garmin.";
    throw new GarminConversionError(String(toolError), {
      rawResponse: sourceJson,
      debugPayload: parsedJson,
    });
  }

  const sanitized = sanitizeWorkoutValue(parsedJson) as Record<string, unknown>;
  const normalized = enforceWorkoutPostProcessing(sanitized);
  logStepStatus(logger, "conversion.normalize", "ok");

  const validationStartedAt = Date.now();
  const validation = workoutSchema.safeParse(normalized);
  if (!validation.success) {
    logger.error("garmin trainer job conversion validation failed", {
      issues: validation.error.issues,
      durationMs: Date.now() - validationStartedAt,
    });
    logStepStatus(logger, "conversion.validation", "ko", { issues: validation.error.issues });
    throw new GarminConversionError("L’entraînement généré ne respecte pas le schéma attendu.", {
      rawResponse: sourceJson,
      debugPayload: normalized,
      issues: validation.error.issues,
    });
  }
  logStepStatus(logger, "conversion.validation", "ok", { durationMs: Date.now() - validationStartedAt });

  await saveGarminWorkoutForUser(userId, validation.data as Record<string, unknown>);
  logStepStatus(logger, "conversion.persist_artifact", "ok");

  return {
    workout: validation.data as GarminTrainerWorkout,
    raw: JSON.stringify(validation.data, null, 2),
    aiModelId: aiResult.modelId,
  };
};

const pushWorkoutForUser = async (userId: number, workout: GarminTrainerWorkout, jobLogger?: Logger) => {
  const logger = jobLogger ?? baseLogger.child({ userId });
  const startedAt = Date.now();
  const garminConnection = await fetchGarminConnectionByUserId(userId);
  if (!garminConnection) {
    logStepStatus(logger, "push.connection", "ko", { reason: "missing_garmin_connection" });
    throw new Error("Aucune connexion Garmin trouvée pour cet utilisateur. Connecte ton compte Garmin puis réessaie.");
  }
  logStepStatus(logger, "push.connection", "ok", {
    garminConnectionId: garminConnection.id ?? null,
    garminUserId: garminConnection.garminUserId ?? null,
  });

  logger.info("garmin trainer job push started");
  const { accessToken, connection } = await ensureGarminAccessToken(garminConnection);
  const garminUserId = connection.garminUserId;
  logStepStatus(logger, "push.token", "ok", { garminUserId });
  logger.info("garmin trainer job push token resolved", { garminUserId });

  const normalizeSourceField = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim().slice(0, 20);
    }
    return fallback;
  };

  const workoutPayload = {
    ...workout,
    ownerId: ensureOwnerIdType(garminUserId),
    workoutProvider: normalizeSourceField(workout.workoutProvider, "Adapt2Life"),
    workoutSourceId: normalizeSourceField(workout.workoutSourceId, "Adapt2Life"),
  };

  logger.info("garmin trainer job push creating workout", { garminUserId });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const createStartedAt = Date.now();
  let createResponse: Response;
  try {
    createResponse = await fetch("https://apis.garmin.com/workoutportal/workout/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(workoutPayload),
      signal: controller.signal,
    });
  } catch (error) {
    logStepStatus(logger, "push.create_workout", "ko", { error: error instanceof Error ? error.message : String(error) });
    logger.error("garmin trainer job push create request failed", { error });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  logger.info("garmin trainer job push workout response", {
    status: createResponse.status,
    durationMs: Date.now() - createStartedAt,
  });

  const createText = await createResponse.text();
  let createJson: Record<string, unknown> | null = null;
  if (createText) {
    try {
      const parsed = JSON.parse(createText);
      createJson = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      createJson = null;
    }
  }

  if (!createResponse.ok) {
    const errorMessage =
      typeof createJson?.message === "string"
        ? createJson.message
        : typeof createJson?.error === "string"
          ? createJson.error
          : "Garmin a refusé la création de l’entraînement.";
    throw new Error(errorMessage);
  }
  logStepStatus(logger, "push.create_workout", "ok", { status: createResponse.status });

  const workoutIdRaw =
    createJson?.workoutId ??
    createJson?.id ??
    (typeof createJson?.workout === "object" ? (createJson.workout as Record<string, unknown>)?.workoutId : null);

  const workoutId =
    typeof workoutIdRaw === "number"
      ? workoutIdRaw
      : typeof workoutIdRaw === "string" && workoutIdRaw.trim().length > 0
        ? Number.parseInt(workoutIdRaw, 10)
        : null;

  if (workoutId == null || Number.isNaN(workoutId)) {
    throw new Error("Garmin n’a pas renvoyé d’identifiant d’entraînement, planification impossible.");
  }

  const scheduleDate = new Date().toISOString().slice(0, 10);

  logger.info("garmin trainer job push scheduling workout", { garminUserId, workoutId, scheduleDate });
  const scheduleController = new AbortController();
  const scheduleTimeoutId = setTimeout(() => scheduleController.abort(), FETCH_TIMEOUT_MS);
  const scheduleStartedAt = Date.now();
  let scheduleResponse: Response;
  try {
    scheduleResponse = await fetch("https://apis.garmin.com/training-api/schedule/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        workoutId,
        date: scheduleDate,
      }),
      signal: scheduleController.signal,
    });
  } catch (error) {
    logStepStatus(logger, "push.schedule", "ko", { error: error instanceof Error ? error.message : String(error) });
    logger.error("garmin trainer job push schedule request failed", { error });
    throw error;
  } finally {
    clearTimeout(scheduleTimeoutId);
  }
  logger.info("garmin trainer job push schedule response", {
    status: scheduleResponse.status,
    durationMs: Date.now() - scheduleStartedAt,
  });

  const scheduleText = await scheduleResponse.text();
  let scheduleJson: Record<string, unknown> | null = null;
  if (scheduleText) {
    try {
      const parsed = JSON.parse(scheduleText);
      scheduleJson = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      scheduleJson = null;
    }
  }

  if (!scheduleResponse.ok) {
    const errorMessage =
      typeof scheduleJson?.message === "string"
        ? scheduleJson.message
        : typeof scheduleJson?.error === "string"
          ? scheduleJson.error
          : "Garmin a refusé la planification de l’entraînement.";
    throw new Error(errorMessage);
  }
  logStepStatus(logger, "push.schedule", "ok", { status: scheduleResponse.status });

  const result = {
    workoutId,
    scheduledFor: scheduleDate,
    garminResponse: {
      workoutCreation: createJson ?? createText ?? null,
      schedule: scheduleJson ?? scheduleText ?? null,
    },
  };
  const durationMs = Date.now() - startedAt;
  logger.info("garmin trainer job push completed", { garminUserId, workoutId, durationMs });
  logStepStatus(logger, "push.completed", "ok", { garminUserId, workoutId, durationMs });
  return result;
};

export const createGarminTrainerJob = async (
  userId: number,
  planMarkdown: string,
  options?: { conversionCreditReserved?: boolean },
) => {
  const [job] = await db
    .insert(garminTrainerJobs)
    .values({
      userId,
      planMarkdown: planMarkdown.trim(),
      status: "pending",
      phase: "pending",
      conversionCreditReserved: Boolean(options?.conversionCreditReserved),
    })
    .returning({
      id: garminTrainerJobs.id,
      status: garminTrainerJobs.status,
      createdAt: garminTrainerJobs.createdAt,
      phase: garminTrainerJobs.phase,
      conversionCreditReserved: garminTrainerJobs.conversionCreditReserved,
    });
  return job;
};

export type GarminTrainerJobView = {
  id: number;
  status: string;
  phase: string | null;
  error: string | null;
  processedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  aiModelId: string | null;
};

export const getGarminTrainerJobForUser = async (
  jobId: number,
  userId: number,
): Promise<GarminTrainerJobView | null> => {
  const [job] = await db
    .select({
      id: garminTrainerJobs.id,
      status: garminTrainerJobs.status,
       phase: garminTrainerJobs.phase,
      error: garminTrainerJobs.error,
      processedAt: garminTrainerJobs.processedAt,
      createdAt: garminTrainerJobs.createdAt,
      updatedAt: garminTrainerJobs.updatedAt,
      aiModelId: garminTrainerJobs.aiModelId,
    })
    .from(garminTrainerJobs)
    .where(and(eq(garminTrainerJobs.id, jobId), eq(garminTrainerJobs.userId, userId)))
    .limit(1);

  return job ?? null;
};

export const markGarminTrainerJobFailed = async (jobId: number, errorMessage: string) => {
  await updateJob(jobId, {
    status: "failed",
    error: errorMessage,
    phase: "failed",
    processedAt: new Date(),
  });
};

export const hasGarminTrainerJobTimedOut = (
  job: GarminTrainerJobView,
  options?: { timeoutMs?: number },
): boolean => {
  const logger = baseLogger.child({ jobId: job.id });
  if (job.status === "success" || job.status === "failed") {
    return false;
  }
  const timeoutMs = Number.isFinite(options?.timeoutMs) ? Number(options?.timeoutMs) : DEFAULT_JOB_TIMEOUT_MS;
  const referenceDate = job.updatedAt ?? job.createdAt;
  if (!referenceDate) {
    return false;
  }
  const hasTimedOut = Date.now() - referenceDate.getTime() > timeoutMs;
  if (hasTimedOut) {
      logger.warn("garmin trainer job timeout reached", {
        jobId: job.id,
        status: job.status,
        phase: job.phase ?? null,
        referenceDate: referenceDate.toISOString(),
        timeoutMs,
      });
  }
  return hasTimedOut;
};

const processJob = async (job: {
  id: number;
  userId: number;
  planMarkdown: string;
  conversionCreditReserved: boolean;
}) => {
  const logger = baseLogger.child({ jobId: job.id, userId: job.userId });
  await updateJob(job.id, { status: "processing", phase: "conversion" });
  logger.info("garmin trainer job processing started");
  let heartbeatId: NodeJS.Timeout | null = null;
  const startHeartbeat = () => {
    if (!Number.isFinite(JOB_HEARTBEAT_INTERVAL_MS) || JOB_HEARTBEAT_INTERVAL_MS <= 0) {
      return;
    }
    heartbeatId = setInterval(() => {
      touchJob(job.id).catch((error) => {
        logger.warn("garmin trainer job heartbeat failed", { error });
      });
    }, JOB_HEARTBEAT_INTERVAL_MS);
  };
  const stopHeartbeat = () => {
    if (heartbeatId) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }
  };
  startHeartbeat();
  let conversionCreditLocked = job.conversionCreditReserved;
  try {
    const conversion = await runWithTimeout(
      () => convertPlanMarkdownForUser(job.userId, job.planMarkdown, logger, { jobId: job.id }),
      CONVERSION_TIMEOUT_MS,
      "Garmin conversion",
      logger,
    );
    await updateJob(job.id, { phase: "push", aiModelId: conversion.aiModelId ?? null });
    await touchJob(job.id);
    const pushResult = await runWithTimeout(
      () => pushWorkoutForUser(job.userId, conversion.workout, logger),
      PUSH_TIMEOUT_MS,
      "Garmin push",
      logger,
    );

    await updateJob(job.id, {
      status: "success",
      phase: "completed",
      resultJson: {
        workoutId: pushResult.workoutId,
        scheduledFor: pushResult.scheduledFor,
        garminResponse: pushResult.garminResponse,
      },
      processedAt: new Date(),
      error: null,
      aiRawResponse: conversion.raw,
      aiDebugPayload: null,
      conversionCreditReserved: false,
    });
    logger.info("garmin trainer job completed", { workoutId: pushResult.workoutId });
    conversionCreditLocked = false;
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.error("garmin trainer job stage timed out", {
        jobId: job.id,
        stage: error.label,
        timeoutMs: error.timeoutMs,
      });
    }
    if (error instanceof GarminConversionError) {
      logger.error("garmin trainer job failed", {
        jobId: job.id,
        error,
        rawResponse: error.rawResponse,
        debugPayload: error.debugPayload,
        issues: error.issues ?? null,
      });
    } else {
      logger.error("garmin trainer job failed", { jobId: job.id, error });
    }
    await updateJob(job.id, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      phase: "failed",
      processedAt: new Date(),
      aiRawResponse: error instanceof GarminConversionError ? error.rawResponse : null,
      aiDebugPayload: error instanceof GarminConversionError ? (error.debugPayload ?? null) : null,
      conversionCreditReserved: false,
    });
    if (conversionCreditLocked) {
      try {
        await refundGarminConversionCredit(job.userId);
      } catch (refundError) {
        logger.error("garmin trainer job conversion credit refund failed", { error: refundError });
      }
      conversionCreditLocked = false;
    }
  }
  stopHeartbeat();
};

export const processPendingGarminTrainerJobs = async (limit = 5) => {
  const jobs = await db
    .select({
      id: garminTrainerJobs.id,
      userId: garminTrainerJobs.userId,
      planMarkdown: garminTrainerJobs.planMarkdown,
      conversionCreditReserved: garminTrainerJobs.conversionCreditReserved,
    })
    .from(garminTrainerJobs)
    .where(eq(garminTrainerJobs.status, "pending"))
    .orderBy(garminTrainerJobs.createdAt)
    .limit(limit);

  for (const job of jobs) {
    await processJob(job);
  }

  return jobs.length;
};

export const processGarminTrainerJobById = async (jobId: number) => {
  const [job] = await db
    .select({
      id: garminTrainerJobs.id,
      userId: garminTrainerJobs.userId,
      planMarkdown: garminTrainerJobs.planMarkdown,
      conversionCreditReserved: garminTrainerJobs.conversionCreditReserved,
    })
    .from(garminTrainerJobs)
    .where(eq(garminTrainerJobs.id, jobId))
    .limit(1);

  if (!job) {
    return false;
  }

  await processJob(job);
  return true;
};

export const triggerGarminTrainerJobProcessing = (jobId: number) => {
  const logger = baseLogger.child({ jobId });
  processGarminTrainerJobById(jobId).catch((error) => {
    logger.error("garmin trainer job processing failed", { jobId, error });
  });
};

export const ensureLocalUser = async (
  stackUserId: string,
  stackUserEmail?: string | null,
  stackUserName?: string | null,
): Promise<{ id: number; stackId: string; planType: string | null }> => {
  const [existing] = await db
    .select({ id: users.id, stackId: users.stackId, planType: users.planType })
    .from(users)
    .where(eq(users.stackId, stackUserId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const fallbackEmail = stackUserEmail && stackUserEmail.trim().length > 0 ? stackUserEmail : `${stackUserId}@adapt2life.local`;

  const [inserted] = await db
    .insert(users)
    .values({
      stackId: stackUserId,
      email: fallbackEmail,
      name: stackUserName ?? null,
      planType: DEFAULT_USER_PLAN,
      trainingGenerationsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).trainingQuota ?? 0,
      garminConversionsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).conversionQuota ?? 0,
    })
    .returning({ id: users.id, stackId: users.stackId, planType: users.planType });

  if (!inserted) {
    throw new Error("Impossible de créer l’utilisateur local Adapt2Life.");
  }

  return inserted;
};

export const __garminTrainerJobsTesting = {
  convertPlanMarkdownForUser,
  sanitizeWorkoutValue,
  enforceWorkoutPostProcessing,
};
