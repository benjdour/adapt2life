import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

export type ParsedPlanMarkdown = {
  humanMarkdown: string;
  structuredPlanJson: string | null;
};

const STRUCTURED_SECTION_REGEX = /###\s*[🗂️📦]?\s*Plan structuré[^`]*```json\s*([\s\S]*?)```/i;

export const splitPlanMarkdown = (input: string): ParsedPlanMarkdown => {
  if (typeof input !== "string") {
    return {
      humanMarkdown: "",
      structuredPlanJson: null,
    };
  }

  const match = input.match(STRUCTURED_SECTION_REGEX);

  if (!match) {
    return {
      humanMarkdown: input.trim(),
      structuredPlanJson: null,
    };
  }

  const [matchedBlock, jsonContent] = match;
  const startIndex = match.index ?? 0;

  const before = input.slice(0, startIndex);
  const after = input.slice(startIndex + matchedBlock.length);

  const humanMarkdown = `${before}${after}`.trim();
  const structuredPlanJson = jsonContent.trim();

  return {
    humanMarkdown,
    structuredPlanJson: structuredPlanJson.length > 0 ? structuredPlanJson : null,
  };
};

export const parseStructuredPlanJson = <T = unknown>(json: string | null): T | null => {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export type StructuredPlanTarget = {
  type: string;
  unit?: string;
  min?: number;
  max?: number;
  value?: number;
};

export type StructuredDuration = {
  type: "TIME" | "FIXED_REST" | "DISTANCE";
  value: number;
};

export type StructuredRepeatStep = {
  type: "single";
  role: "effort" | "rest" | string;
  label?: string;
  intensity?: string;
  duration: StructuredDuration;
  targets?: StructuredPlanTarget[];
  notes?: string;
};

export type StructuredSingleBlock = {
  type: "single";
  label?: string;
  intensity?: string;
  duration: StructuredDuration;
  targets?: StructuredPlanTarget[];
  notes?: string;
};

export type StructuredRepeatBlock = {
  type: "repeat";
  label?: string;
  intensity?: string;
  repeatCount: number;
  steps: StructuredRepeatStep[];
  notes?: string;
};

export type StructuredPlanBlock = StructuredSingleBlock | StructuredRepeatBlock;

export type StructuredPlanSection = {
  sectionType: "WARMUP" | "MAIN" | "COOLDOWN" | string;
  blocks: StructuredPlanBlock[];
};

export type StructuredPlanV1 = {
  structuredPlanVersion: "1.0";
  workoutName?: string;
  sport?: string;
  totalDurationSeconds?: number;
  sections: StructuredPlanSection[];
};

type GarminTargetType =
  | "SPEED"
  | "OPEN"
  | "HEART_RATE"
  | "CADENCE"
  | "POWER"
  | "GRADE"
  | "RESISTANCE"
  | "POWER_3S"
  | "POWER_10S"
  | "POWER_30S"
  | "POWER_LAP"
  | "SPEED_LAP"
  | "HEART_RATE_LAP"
  | "PACE";

type TargetConversion = {
  targetType: GarminTargetType | null;
  targetValue: number | null;
  targetValueLow: number | null;
  targetValueHigh: number | null;
  targetValueType: "PERCENT" | null;
  secondaryTargetType: GarminTargetType | null;
  secondaryTargetValue: number | null;
  secondaryTargetValueLow: number | null;
  secondaryTargetValueHigh: number | null;
  secondaryTargetValueType: "PERCENT" | null;
};

const normalizeIntensity = (
  value: string | undefined,
  fallback: "WARMUP" | "ACTIVE" | "REST" | "RECOVERY" | "COOLDOWN" | "INTERVAL" | "MAIN",
): "WARMUP" | "ACTIVE" | "REST" | "RECOVERY" | "COOLDOWN" | "INTERVAL" | "MAIN" => {
  const normalized = value?.toUpperCase().trim();
  const allowed = new Set(["WARMUP", "ACTIVE", "REST", "RECOVERY", "COOLDOWN", "INTERVAL", "MAIN"]);
  if (normalized && allowed.has(normalized)) {
    return normalized as typeof fallback;
  }
  return fallback;
};

const toGarminTargetType = (value: string | null | undefined): GarminTargetType | null => {
  if (!value) {
    return null;
  }
  const upper = value.toUpperCase();
  const allowed: GarminTargetType[] = [
    "SPEED",
    "OPEN",
    "HEART_RATE",
    "CADENCE",
    "POWER",
    "GRADE",
    "RESISTANCE",
    "POWER_3S",
    "POWER_10S",
    "POWER_30S",
    "POWER_LAP",
    "SPEED_LAP",
    "HEART_RATE_LAP",
    "PACE",
  ];
  return allowed.includes(upper as GarminTargetType) ? (upper as GarminTargetType) : null;
};

const clampDescription = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 512) : null;
};

const convertTarget = (targets?: StructuredPlanTarget[]): TargetConversion => {
  if (!targets || targets.length === 0) {
    return {
      targetType: null,
      targetValue: null,
      targetValueLow: null,
      targetValueHigh: null,
      targetValueType: null,
      secondaryTargetType: null,
      secondaryTargetValue: null,
      secondaryTargetValueLow: null,
      secondaryTargetValueHigh: null,
      secondaryTargetValueType: null,
    };
  }

  const [primary, secondary] = targets;

  const convertSingle = (
    target?: StructuredPlanTarget,
  ): {
    type: string | null;
    value: number | null;
    low: number | null;
    high: number | null;
    valueType: "PERCENT" | null;
  } => {
    if (!target) {
      return {
        type: null,
        value: null,
        low: null,
        high: null,
        valueType: null as "PERCENT" | null,
      };
    }

    const baseType = target.type?.toUpperCase() ?? "";

    const normalizeRange = (min?: number, max?: number, unit?: string) => {
      let low = min ?? max ?? null;
      let high = max ?? min ?? null;

      if (unit === "percentFtp" || unit === "percentHr") {
        if (low != null) {
          low = Math.round(low * 100);
        }
        if (high != null) {
          high = Math.round(high * 100);
        }
      }

      return { low, high };
    };

    if (baseType === "POWER") {
      const { low, high } = normalizeRange(target.min, target.max, target.unit);
      const valueType = target.unit === "percentFtp" ? "PERCENT" : null;
      return {
        type: toGarminTargetType("POWER"),
        value: target.value ?? null,
        low,
        high,
        valueType,
      };
    }

    if (baseType === "CADENCE") {
      const low = target.min ?? target.max ?? target.value ?? null;
      const high = target.max ?? target.min ?? target.value ?? null;
      return {
        type: toGarminTargetType("CADENCE"),
        value: null,
        low,
        high,
        valueType: null,
      };
    }

    if (baseType === "HEART_RATE") {
      const { low, high } = normalizeRange(target.min, target.max, target.unit);
      const valueType = target.unit === "percentMaxHr" || target.unit === "percentHr" ? "PERCENT" : null;
      return {
        type: toGarminTargetType("HEART_RATE"),
        value: target.value ?? null,
        low,
        high,
        valueType,
      };
    }

    return {
      type: toGarminTargetType(target.type),
      value: null,
      low: null,
      high: null,
      valueType: null,
    };
  };

  const primaryConverted = convertSingle(primary);
  const secondaryConverted = convertSingle(secondary);

  return {
    targetType: toGarminTargetType(primaryConverted.type),
    targetValue: primaryConverted.value,
    targetValueLow: primaryConverted.low,
    targetValueHigh: primaryConverted.high,
    targetValueType: primaryConverted.valueType,
    secondaryTargetType: toGarminTargetType(secondaryConverted.type),
    secondaryTargetValue: secondaryConverted.value,
    secondaryTargetValueLow: secondaryConverted.low,
    secondaryTargetValueHigh: secondaryConverted.high,
    secondaryTargetValueType: secondaryConverted.valueType,
  };
};

const convertDurationType = (
  duration: StructuredDuration,
  role?: string,
): { durationType: "TIME" | "DISTANCE" | "FIXED_REST"; durationValue: number } => {
  let type = duration.type;
  if (role === "rest" && duration.type === "TIME") {
    type = "FIXED_REST";
  }
  return {
    durationType: type,
    durationValue: Math.max(0, Math.round(duration.value ?? 0)),
  };
};

const buildStepDescription = (label?: string, notes?: string): string | null => {
  const parts = [label?.trim(), notes?.trim()].filter((part) => part && part.length > 0) as string[];
  if (parts.length === 0) {
    return null;
  }
  const joined = parts.join(". ").trim();
  return joined.length > 512 ? `${joined.slice(0, 509)}...` : joined;
};

const sectionTypeToIntensity = (sectionType: string): "WARMUP" | "ACTIVE" | "COOLDOWN" => {
  const normalized = sectionType.toUpperCase();
  if (normalized === "WARMUP") {
    return "WARMUP";
  }
  if (normalized === "COOLDOWN") {
    return "COOLDOWN";
  }
  return "ACTIVE";
};

export const convertStructuredPlanToGarmin = (
  plan: StructuredPlanV1,
  options: {
    ownerId: string | null;
    humanDescription?: string | null;
    sportFallback?: string;
  } = {
    ownerId: null,
  },
): GarminTrainerWorkout => {
  const sport = plan.sport?.toUpperCase() ?? options.sportFallback?.toUpperCase() ?? "CYCLING";

  const workout: GarminTrainerWorkout = {
    ownerId: options.ownerId,
    workoutName: plan.workoutName ?? "Séance Adapt2Life",
    description: options.humanDescription ? options.humanDescription.slice(0, 1024) : null,
    sport,
    estimatedDurationInSecs: plan.totalDurationSeconds ? Math.max(0, Math.round(plan.totalDurationSeconds)) : null,
    estimatedDistanceInMeters: null,
    poolLength: null,
    poolLengthUnit: null,
    workoutProvider: "Adapt2Life",
    workoutSourceId: "Adapt2Life",
    isSessionTransitionEnabled: sport === "MULTI_SPORT",
    segments: [],
  } as GarminTrainerWorkout;

  let stepOrderCounter = 1;

  plan.sections?.forEach((section) => {
    const blocks = Array.isArray(section.blocks) ? section.blocks : [];
    if (blocks.length === 0) {
      return;
    }

    const segmentSteps: GarminTrainerWorkout["segments"][number]["steps"] = [];
    let segmentDuration = 0;
    const sectionIntensity = sectionTypeToIntensity(section.sectionType ?? "MAIN");

    blocks.forEach((block) => {
      if (block.type === "single") {
        const { durationType, durationValue } = convertDurationType(block.duration);
        const targets = convertTarget(block.targets);

        segmentSteps.push({
          type: "WorkoutStep",
          stepId: null,
          stepOrder: stepOrderCounter++,
          repeatType: null,
          repeatValue: null,
          skipLastRestStep: false,
          steps: null,
          intensity: normalizeIntensity(block.intensity, sectionIntensity),
          description: buildStepDescription(block.label, block.notes),
          durationType,
          durationValue,
          durationValueType: null,
          equipmentType: null,
          exerciseCategory: null,
          exerciseName: null,
          weightValue: null,
          weightDisplayUnit: null,
          targetType: targets.targetType,
          targetValue: targets.targetValue,
          targetValueLow: targets.targetValueLow,
          targetValueHigh: targets.targetValueHigh,
          targetValueType: targets.targetValueType,
          secondaryTargetType: targets.secondaryTargetType,
          secondaryTargetValue: targets.secondaryTargetValue,
          secondaryTargetValueLow: targets.secondaryTargetValueLow,
          secondaryTargetValueHigh: targets.secondaryTargetValueHigh,
          secondaryTargetValueType: targets.secondaryTargetValueType,
          strokeType: null,
          drillType: null,
        });

        segmentDuration += durationValue;
        return;
      }

      const repeatSteps = Array.isArray(block.steps) ? block.steps : [];
      if (repeatSteps.length === 0 || !Number.isFinite(block.repeatCount)) {
        return;
      }

      let childOrder = 1;
      const convertedChildren = repeatSteps.map((child) => {
        const intensity = normalizeIntensity(child.intensity, child.role === "rest" ? "REST" : sectionIntensity);
        const { durationType, durationValue } = convertDurationType(child.duration, child.role);
        const targets = convertTarget(child.targets);

        return {
          type: "WorkoutStep" as const,
          stepId: null,
          stepOrder: childOrder++,
          repeatType: null,
          repeatValue: null,
          skipLastRestStep: false,
          steps: null,
          intensity,
          description: buildStepDescription(child.label, child.notes),
          durationType,
          durationValue,
          durationValueType: null,
          equipmentType: null,
          exerciseCategory: null,
          exerciseName: null,
          weightValue: null,
          weightDisplayUnit: null,
          targetType: targets.targetType,
          targetValue: targets.targetValue,
          targetValueLow: targets.targetValueLow,
          targetValueHigh: targets.targetValueHigh,
          targetValueType: targets.targetValueType,
          secondaryTargetType: targets.secondaryTargetType,
          secondaryTargetValue: targets.secondaryTargetValue,
          secondaryTargetValueLow: targets.secondaryTargetValueLow,
          secondaryTargetValueHigh: targets.secondaryTargetValueHigh,
          secondaryTargetValueType: targets.secondaryTargetValueType,
          strokeType: null,
          drillType: null,
        };
      });

      const repeatDurationPerLoop = repeatSteps.reduce(
        (total, child) => total + Math.max(0, Math.round(child.duration?.value ?? 0)),
        0,
      );

      segmentSteps.push({
        type: "WorkoutRepeatStep",
        stepId: null,
        stepOrder: stepOrderCounter++,
        repeatType: "REPEAT_UNTIL_STEPS_CMPLT",
        repeatValue: Math.max(1, Math.round(block.repeatCount)),
        skipLastRestStep: sport === "LAP_SWIMMING",
        steps: convertedChildren,
        intensity: normalizeIntensity(block.intensity, sectionIntensity),
        description: clampDescription(block.label ?? block.notes),
        durationType: null,
        durationValue: null,
        durationValueType: null,
        equipmentType: null,
        exerciseCategory: null,
        exerciseName: null,
        weightValue: null,
        weightDisplayUnit: null,
        targetType: null,
        targetValue: null,
        targetValueLow: null,
        targetValueHigh: null,
        targetValueType: null,
        secondaryTargetType: null,
        secondaryTargetValue: null,
        secondaryTargetValueLow: null,
        secondaryTargetValueHigh: null,
        secondaryTargetValueType: null,
        strokeType: null,
        drillType: null,
      });

      segmentDuration += repeatDurationPerLoop * Math.max(1, Math.round(block.repeatCount));
    });

    workout.segments.push({
      segmentOrder: workout.segments.length + 1,
      sport,
      estimatedDurationInSecs: segmentDuration > 0 ? segmentDuration : null,
      estimatedDistanceInMeters: null,
      poolLength: null,
      poolLengthUnit: null,
      steps: segmentSteps,
    });
  });

  return workout;
};
