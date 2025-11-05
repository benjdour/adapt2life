import { z } from "zod";

/** --- Enums Garmin --- */
export const Sport = z.enum([
  "RUNNING",
  "CYCLING",
  "LAP_SWIMMING",
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "GENERIC",
  "YOGA",
  "PILATES",
  "MULTI_SPORT",
]);

export const Intensity = z.enum(["REST", "WARMUP", "COOLDOWN", "RECOVERY", "ACTIVE", "INTERVAL", "MAIN"]);

export const DurationType = z.enum([
  "TIME",
  "DISTANCE",
  "HR_LESS_THAN",
  "HR_GREATER_THAN",
  "CALORIES",
  "OPEN",
  "POWER_LESS_THAN",
  "POWER_GREATER_THAN",
  "TIME_AT_VALID_CDA",
  "FIXED_REST",
  "REPS",
  "REPETITION_SWIM_CSS_OFFSET",
  "FIXED_REPETITION",
]);

export const RepeatType = z.enum([
  "REPEAT_UNTIL_STEPS_CMPLT",
  "REPEAT_UNTIL_TIME",
  "REPEAT_UNTIL_DISTANCE",
  "REPEAT_UNTIL_CALORIES",
  "REPEAT_UNTIL_HR_LESS_THAN",
  "REPEAT_UNTIL_HR_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LESS_THAN",
  "REPEAT_UNTIL_POWER_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LAST_LAP_LESS_THAN",
  "REPEAT_UNTIL_MAX_POWER_LAST_LAP_LESS_THAN",
]);

export const TargetType = z.enum([
  "SPEED",
  "HEART_RATE",
  "OPEN",
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
]);

export const SecondaryTargetType = z.enum([
  ...TargetType.options,
  "PACE_ZONE",
  "SWIM_INSTRUCTION",
  "SWIM_CSS_OFFSET",
]);

export const StrokeType = z.enum([
  "BACKSTROKE",
  "BREASTSTROKE",
  "BUTTERFLY",
  "FREESTYLE",
  "MIXED",
  "IM",
  "RIMO",
  "CHOICE",
]);

export const DrillType = z.enum(["KICK", "PULL", "DRILL", "BUTTERFLY"]);

export const EquipmentType = z.enum([
  "NONE",
  "SWIM_FINS",
  "SWIM_KICKBOARD",
  "SWIM_PADDLES",
  "SWIM_PULL_BUOY",
  "SWIM_SNORKEL",
]);

export const WeightDisplayUnit = z.enum(["KILOGRAM", "POUND"]);

export const PoolLengthUnit = z.enum(["YARD", "METER"]);

/** --- Contraintes génériques --- */
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

/** --- Step simple --- */
const WorkoutStepSchema = z
  .object({
    type: z.literal("WorkoutStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: nullable(RepeatType),
    repeatValue: nullable(z.number()),
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.null().optional(), // un WorkoutStep n'a pas d'enfants
    intensity: Intensity,
    description: z.string().max(512).nullable(),
    durationType: DurationType,
    durationValue: z.number(),
    durationValueType: nullable(z.string()),

    equipmentType: nullable(EquipmentType),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(WeightDisplayUnit),

    targetType: nullable(TargetType),
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(SecondaryTargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(StrokeType),
    drillType: nullable(DrillType),
  })
  /** Durée cohérente selon le type */
  .superRefine((s, ctx) => {
    const value = s.durationValue;
    if (value == null || Number.isNaN(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "durationValue est requis lorsque durationType est défini.",
      });
      return;
    }

    const positiveIntegerTypes = ["TIME", "DISTANCE", "REPS", "FIXED_REPETITION", "FIXED_REST"];
    if (positiveIntegerTypes.includes(s.durationType) && (!Number.isInteger(value) || value <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${s.durationType} => durationValue doit être un entier positif.`,
      });
    }

    if (s.durationType === "REPETITION_SWIM_CSS_OFFSET" && (value < -60 || value > 60)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "REPETITION_SWIM_CSS_OFFSET => durationValue doit être compris entre -60 et 60.",
      });
    }

    if (s.repeatType != null || s.repeatValue != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "repeatType/repeatValue ne sont pas autorisés sur WorkoutStep (utiliser WorkoutRepeatStep).",
      });
    }

    if (s.targetType === "OPEN") {
      if (s.targetValue != null || s.targetValueLow != null || s.targetValueHigh != null || s.targetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetType OPEN => targetValue/Low/High/Type doivent être null.",
        });
      }
    }

    if (s.targetType && s.targetType !== "OPEN") {
      if (s.targetValue != null && (s.targetValueLow != null || s.targetValueHigh != null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetValue et targetValueLow/High ne peuvent pas être utilisés simultanément.",
        });
      }
      if (["HEART_RATE", "POWER"].includes(s.targetType) && (s.targetValueLow != null || s.targetValueHigh != null)) {
        if (s.targetValueType !== "PERCENT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "HEART_RATE/POWER => targetValueType doit être 'PERCENT' pour les plages personnalisées.",
          });
        }
      }
    }

    if (s.secondaryTargetType === "SWIM_INSTRUCTION") {
      if (
        s.secondaryTargetValueLow == null ||
        s.secondaryTargetValueHigh != null ||
        s.secondaryTargetValueType != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_INSTRUCTION => utilise secondaryTargetValueLow (1-10) uniquement.",
        });
      }
    }

    if (s.secondaryTargetType === "SWIM_CSS_OFFSET") {
      if (s.secondaryTargetValueLow == null || s.secondaryTargetValueLow < -60 || s.secondaryTargetValueLow > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_CSS_OFFSET => secondaryTargetValueLow doit être renseigné entre -60 et 60.",
        });
      }
      if (s.secondaryTargetValueHigh != null || s.secondaryTargetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_CSS_OFFSET n'utilise pas secondaryTargetValueHigh ni secondaryTargetValueType.",
        });
      }
    }

    if (s.drillType && !s.strokeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "strokeType requis lorsque drillType est défini.",
      });
    }
  });

/** --- Step répété (contient des WorkoutStep enfants) --- */
const WorkoutRepeatStepSchema = z
  .object({
    type: z.literal("WorkoutRepeatStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: RepeatType,
    repeatValue: z.number().positive(),
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.array(WorkoutStepSchema).min(1), // enfants = WorkoutStep uniquement
    intensity: Intensity,
    description: z.string().max(512).nullable(),

    durationType: nullable(DurationType),
    durationValue: nullable(z.number()),
    durationValueType: nullable(z.string()),

    equipmentType: nullable(EquipmentType),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(WeightDisplayUnit),

    targetType: nullable(TargetType),
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(SecondaryTargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(StrokeType),
    drillType: nullable(DrillType),
  })
  .superRefine((step, ctx) => {
    if (step.durationType != null || step.durationValue != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WorkoutRepeatStep ne doit pas avoir de duration propre (durées dans ses steps enfants).",
      });
    }

    let lastChildOrder = 0;
    step.steps.forEach((child, index) => {
      if (child.stepOrder <= lastChildOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "stepOrder doit être strictement croissant dans un WorkoutRepeatStep.",
          path: ["steps", index, "stepOrder"],
        });
      }
      lastChildOrder = child.stepOrder;
    });
  });

/** --- Union de steps --- */
export const Step = z.union([WorkoutStepSchema, WorkoutRepeatStepSchema]);

/** --- Segment --- */
export const Segment = z
  .object({
    segmentOrder: z.number().int().positive(),
    sport: Sport,
    estimatedDurationInSecs: nullable(z.number().nonnegative()),
    estimatedDistanceInMeters: nullable(z.number()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(PoolLengthUnit),
    steps: z.array(Step).min(1),
  })
  .superRefine((segment, ctx) => {
    let lastOrder = 0;
    segment.steps.forEach((step, index) => {
      if (step.stepOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "stepOrder doit être strictement croissant dans un segment.",
          path: ["steps", index, "stepOrder"],
        });
      }
      lastOrder = step.stepOrder;
    });

    if (segment.sport === "LAP_SWIMMING") {
      const ensureSwimCompliance = (step: z.infer<typeof Step>, path: (string | number)[]) => {
        if (step.type === "WorkoutStep") {
          if (step.targetType != null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Pour la natation, targetType doit être null (utiliser les secondaryTarget).",
              path: [...path, "targetType"],
            });
          }
        } else if (step.type === "WorkoutRepeatStep" && Array.isArray(step.steps)) {
          step.steps.forEach((child, childIndex) => {
            ensureSwimCompliance(child, [...path, "steps", childIndex]);
          });
        }
      };

      segment.steps.forEach((step, index) => ensureSwimCompliance(step, ["steps", index]));
    }
  });

/** --- Workout racine --- */
export const GarminWorkoutSchema = z
  .object({
    ownerId: nullable(z.union([z.string(), z.number()])),
    workoutName: z.string().min(1).max(255),
    description: nullable(z.string().max(1024)),
    sport: Sport,
    estimatedDurationInSecs: nullable(z.number().nonnegative()),
    estimatedDistanceInMeters: nullable(z.number()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(PoolLengthUnit),
    workoutProvider: z.string().min(1),
    workoutSourceId: z.string().min(1),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(Segment).min(1),
  })
  .superRefine((workout, ctx) => {
    let lastOrder = 0;
    workout.segments.forEach((segment, index) => {
      if (segment.segmentOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "segmentOrder doit être strictement croissant.",
          path: ["segments", index, "segmentOrder"],
        });
      }
      lastOrder = segment.segmentOrder;
    });

    if (workout.poolLength == null && workout.poolLengthUnit != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "poolLengthUnit ne peut être défini sans poolLength.",
        path: ["poolLengthUnit"],
      });
    }

    if (workout.sport === "MULTI_SPORT") {
      workout.segments.forEach((segment, index) => {
        if (segment.sport === "MULTI_SPORT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Les segments d'un multi-sport ne peuvent pas avoir le sport MULTI_SPORT.",
            path: ["segments", index, "sport"],
          });
        }
      });
    } else {
      if (workout.segments.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un entraînement mono-sport doit contenir un seul segment.",
          path: ["segments"],
        });
      } else if (workout.segments[0]?.sport && workout.segments[0].sport !== workout.sport) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le sport du segment unique doit correspondre au sport du workout.",
          path: ["segments", 0, "sport"],
        });
      }
      if (workout.sport !== "LAP_SWIMMING" && (workout.poolLength != null || workout.poolLengthUnit != null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "poolLength/poolLengthUnit ne sont valides que pour la natation en piscine.",
          path: ["poolLength"],
        });
      }
    }

    const swimSegments = workout.segments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => segment.sport === "LAP_SWIMMING");

    if (swimSegments.length > 0) {
      const referenceLength = workout.poolLength ?? swimSegments[0].segment.poolLength ?? null;
      const referenceUnit = workout.poolLengthUnit ?? swimSegments[0].segment.poolLengthUnit ?? null;

      swimSegments.forEach(({ segment, index }) => {
        if ((segment.poolLength == null) !== (segment.poolLengthUnit == null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLength et poolLengthUnit doivent être fournis ensemble pour la natation.",
            path: ["segments", index, "poolLength"],
          });
        }

        if (referenceLength != null && segment.poolLength != null && segment.poolLength !== referenceLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLength doit être identique entre le workout et les segments natation.",
            path: ["segments", index, "poolLength"],
          });
        }

        if (referenceUnit != null && segment.poolLengthUnit != null && segment.poolLengthUnit !== referenceUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLengthUnit doit être identique entre le workout et les segments natation.",
            path: ["segments", index, "poolLengthUnit"],
          });
        }
      });
    }
  });
