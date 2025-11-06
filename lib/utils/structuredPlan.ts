import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

export type ParsedPlanMarkdown = {
  humanMarkdown: string;
  structuredPlanJson: string | null;
};

export const splitPlanMarkdown = (input: string): ParsedPlanMarkdown => {
  if (typeof input !== "string") {
    return {
      humanMarkdown: "",
      structuredPlanJson: null,
    };
  }

  const normalizedInput = normalizeMarkdown(input);
  const lowercased = normalizedInput.toLowerCase();
  const markerIndex = lowercased.indexOf("plan structuré");

  if (markerIndex === -1) {
    return {
      humanMarkdown: input.trim(),
      structuredPlanJson: null,
    };
  }

  const lineStart = normalizedInput.lastIndexOf("\n", markerIndex);
  const headingStart = lineStart === -1 ? 0 : lineStart + 1;
  const lineEnd = normalizedInput.indexOf("\n", markerIndex);
  const headingEnd = lineEnd === -1 ? input.length : lineEnd + 1;

  const afterHeading = input.slice(headingEnd);

  const { json: structuredPlanJson, consumedLength } = extractStructuredJson(afterHeading);
  const removalEnd = headingEnd + consumedLength;

  const humanMarkdown = `${input.slice(0, headingStart)}${input.slice(removalEnd)}`.trim();

  return {
    humanMarkdown,
    structuredPlanJson,
  };
};

const normalizeMarkdown = (value: string): string =>
  value.replace(/[\u00A0\u202F\u2007]/g, " ").replace(/\r\n?/g, "\n");

const extractStructuredJson = (
  text: string,
): {
  json: string | null;
  consumedLength: number;
} => {
  const whitespaceMatch = text.match(/^\s*/);
  const leadingWhitespace = whitespaceMatch ? whitespaceMatch[0].length : 0;
  const remaining = text.slice(leadingWhitespace);

  const fenceRegex = /^```(?:\s*[a-z]+)?\s*([\s\S]*?)```\s*/i;
  const fenceMatch = fenceRegex.exec(remaining);
  if (fenceMatch) {
    const jsonCandidate = fenceMatch[1].trim();
    return {
      json: jsonCandidate.length > 0 ? jsonCandidate : null,
      consumedLength: leadingWhitespace + fenceMatch[0].length,
    };
  }

  const inline = extractInlineJson(remaining);
  if (inline) {
    return {
      json: inline.json.length > 0 ? inline.json.trim() : null,
      consumedLength: leadingWhitespace + inline.consumed,
    };
  }

  return {
    json: null,
    consumedLength: leadingWhitespace,
  };
};

const extractInlineJson = (
  text: string,
): {
  json: string;
  consumed: number;
} | null => {
  const trimmed = text.trimStart();
  const leadingWhitespace = text.length - trimmed.length;

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  let depth = 0;
  let inString = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    const previous = index > 0 ? trimmed[index - 1] : null;

    if (inString) {
      if (char === '"' && previous !== "\\") {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
      continue;
    }

    if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) {
        const jsonText = trimmed.slice(0, index + 1);
        let consumed = index + 1;

        while (consumed < trimmed.length && /\s/.test(trimmed[consumed]) && !trimmed.slice(consumed).startsWith("###")) {
          consumed += 1;
        }

        return {
          json: jsonText,
          consumed: leadingWhitespace + consumed,
        };
      }
      continue;
    }
  }

  return null;
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
  low?: number;
  high?: number;
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
  const normalized = normalizeMarkdown(value).trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > 512 ? `${normalized.slice(0, 509)}...` : normalized;
};

const pickNumber = (...values: Array<number | null | undefined>): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const scaleByUnit = (value: number | null, unit?: string | null): number | null => {
  if (value == null) {
    return null;
  }
  if (!unit) {
    return Math.round(value);
  }
  if (unit === "percentFtp" || unit === "percentHr" || unit === "percentMaxHr") {
    return Math.round(value * 100);
  }
  return Math.round(value);
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
    type: GarminTargetType | null;
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

    const baseType = target.type?.toUpperCase().trim() ?? "";

    const baseLow = pickNumber(target.low, target.min);
    const baseHigh = pickNumber(target.high, target.max);
    const baseValue = pickNumber(target.value);

    if (baseType === "POWER") {
      const low = scaleByUnit(baseLow, target.unit);
      const high = scaleByUnit(baseHigh, target.unit);
      const value = scaleByUnit(baseValue, target.unit);
      const valueType = target.unit === "percentFtp" ? "PERCENT" : null;
      return {
        type: toGarminTargetType("POWER"),
        value,
        low,
        high,
        valueType,
      };
    }

    if (baseType === "CADENCE") {
      const low = scaleByUnit(baseLow ?? baseValue, null);
      const high = scaleByUnit(baseHigh ?? baseValue, null);
      return {
        type: toGarminTargetType("CADENCE"),
        value: null,
        low,
        high,
        valueType: null,
      };
    }

    if (baseType === "HEART_RATE") {
      const low = scaleByUnit(baseLow, target.unit);
      const high = scaleByUnit(baseHigh, target.unit);
      const value = scaleByUnit(baseValue, target.unit);
      const valueType = target.unit === "percentMaxHr" || target.unit === "percentHr" ? "PERCENT" : null;
      return {
        type: toGarminTargetType("HEART_RATE"),
        value,
        low,
        high,
        valueType,
      };
    }

    return {
      type: toGarminTargetType(target.type),
      value: baseValue,
      low: baseLow,
      high: baseHigh,
      valueType: null,
    };
  };

  const primaryConverted = convertSingle(primary);
  const secondaryConverted = convertSingle(secondary);

  return {
    targetType: primaryConverted.type,
    targetValue: primaryConverted.value,
    targetValueLow: primaryConverted.low,
    targetValueHigh: primaryConverted.high,
    targetValueType: primaryConverted.valueType,
    secondaryTargetType: secondaryConverted.type,
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
  const numericValue =
    typeof duration.value === "number"
      ? duration.value
      : typeof duration.value === "string"
        ? Number.parseFloat(duration.value)
        : 0;
  return {
    durationType: type,
    durationValue: Math.max(0, Math.round(Number.isFinite(numericValue) ? numericValue : 0)),
  };
};

const buildStepDescription = (label?: string, notes?: string): string | null => {
  const parts = [label, notes]
    .map((part) => (part ? normalizeMarkdown(part).trim() : null))
    .filter((part): part is string => !!part && part.length > 0);
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

const computeBlockDuration = (block: StructuredPlanBlock): number => {
  if (block.type === "single") {
    const rawValue = block.duration?.value;
    const value =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string"
          ? Number.parseFloat(rawValue)
          : 0;
    return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
  }

  const repeatCount = Number.isFinite(block.repeatCount) ? Math.max(1, Math.round(block.repeatCount)) : 1;
  const steps = Array.isArray(block.steps) ? block.steps : [];

  const loopDuration = steps.reduce((total, step) => {
    const rawValue = step.duration?.value;
    const value =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string"
          ? Number.parseFloat(rawValue)
          : 0;
    return total + Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
  }, 0);

  return loopDuration * repeatCount;
};

const computePlanDuration = (plan: StructuredPlanV1): number => {
  const sections = Array.isArray(plan.sections) ? plan.sections : [];
  return sections.reduce((total, section) => {
    const blocks = Array.isArray(section.blocks) ? section.blocks : [];
    const blockTotal = blocks.reduce((sum, block) => sum + computeBlockDuration(block), 0);
    return total + blockTotal;
  }, 0);
};

const normalizeSport = (sport: string | undefined):
  | "STRENGTH_TRAINING"
  | "CARDIO_TRAINING"
  | "YOGA"
  | "PILATES"
  | "RUNNING"
  | "CYCLING"
  | "LAP_SWIMMING"
  | "GENERIC"
  | "MULTI_SPORT" => {
  const normalized = sport?.toUpperCase().trim();
  const allowed = new Set([
    "STRENGTH_TRAINING",
    "CARDIO_TRAINING",
    "YOGA",
    "PILATES",
    "RUNNING",
    "CYCLING",
    "LAP_SWIMMING",
    "GENERIC",
    "MULTI_SPORT",
  ]);
  if (normalized && allowed.has(normalized)) {
    return normalized as
      | "STRENGTH_TRAINING"
      | "CARDIO_TRAINING"
      | "YOGA"
      | "PILATES"
      | "RUNNING"
      | "CYCLING"
      | "LAP_SWIMMING"
      | "GENERIC"
      | "MULTI_SPORT";
  }
  return "CYCLING";
};

const clampText = (value: string | null | undefined, maxLength: number): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized;
};

const deriveWorkoutName = (
  plan: StructuredPlanV1,
  humanDescription?: string | null,
): string => {
  const fromPlan = clampText(plan.workoutName, 100);
  if (fromPlan) {
    return fromPlan;
  }

  if (humanDescription) {
    const candidate = humanDescription
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    const name = clampText(candidate, 100);
    if (name) {
      return name;
    }
  }

  return "Séance Adapt2Life";
};

const normalizeDurationSeconds = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }
  return null;
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
  const sport = normalizeSport(plan.sport ?? options.sportFallback);
  const computedDuration = computePlanDuration(plan);
  const totalDurationSeconds =
    normalizeDurationSeconds(plan.totalDurationSeconds) ?? (computedDuration > 0 ? computedDuration : null);

  const workout: GarminTrainerWorkout = {
    ownerId: options.ownerId,
    workoutName: deriveWorkoutName(plan, options.humanDescription),
    description: clampText(options.humanDescription ?? null, 1024),
    sport,
    estimatedDurationInSecs: totalDurationSeconds,
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
    const sectionType = section.sectionType ?? (section as { phase?: string }).phase ?? "MAIN";
    const sectionIntensity = sectionTypeToIntensity(sectionType);

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

      const repeatDurationPerLoop = convertedChildren.reduce(
        (total, child) => total + Math.max(0, Math.round(child.durationValue ?? 0)),
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
