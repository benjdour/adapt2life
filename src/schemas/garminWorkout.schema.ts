import { z } from "zod";

/** --- Enums Garmin --- */
export const Sport = z.enum([
  "RUNNING",
  "CYCLING",
  "LAP_SWIMMING",
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "YOGA",
  "PILATES",
  "MULTI_SPORT",
]);

export const Intensity = z.enum(["REST", "WARMUP", "COOLDOWN", "RECOVERY", "ACTIVE", "INTERVAL", "MAIN"]);

export const DurationType = z.enum(["TIME", "DISTANCE", "REPS"]);

export const RepeatType = z.enum([
  "REPEAT_COUNT", // attendu par Garmin
  "REPEAT_UNTIL_STEPS_CMPLT", // parfois présent dans tes exemples
]);

export const TargetType = z.enum([
  "OPEN",
  "SPEED",
  "HEART_RATE",
  "POWER",
  "CADENCE",
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

/** --- Contraintes génériques --- */
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

/** --- Step simple --- */
const WorkoutStepSchema = z
  .object({
    type: z.literal("WorkoutStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: nullable(RepeatType),
    repeatValue: nullable(z.number().int().nonnegative()),
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.null().optional(), // un WorkoutStep n'a pas d'enfants
    intensity: Intensity,
    description: z.string().min(1),
    durationType: DurationType,
    durationValue: z.number().int().positive(),
    durationValueType: nullable(z.string()),

    equipmentType: nullable(z.string()),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(z.string()),

    targetType: TargetType.optional(), // OPEN par défaut si non fourni
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(TargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(z.enum(["FREESTYLE", "BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "MIXED"])),
    drillType: nullable(z.enum(["PULL", "KICK", "DRILL", "UNKNOWN"])),
  })
  /** Durée cohérente selon le type */
  .superRefine((s, ctx) => {
    if (s.durationType === "TIME" && (!Number.isInteger(s.durationValue) || s.durationValue <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "durationValue doit être un entier positif (TIME)." });
    }
    if (s.durationType === "DISTANCE" && (!Number.isInteger(s.durationValue) || s.durationValue <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "durationValue doit être un entier positif (DISTANCE en mètres).",
      });
    }
    if (s.durationType === "REPS" && (!Number.isInteger(s.durationValue) || s.durationValue <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "durationValue doit être un entier positif (REPS)." });
    }

    const targetType = s.targetType ?? "OPEN";
    if (targetType === "OPEN") {
      if (s.targetValueLow != null || s.targetValueHigh != null || s.targetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetType OPEN => targetValueLow/High/Type doivent être null.",
        });
      }
    } else if (targetType === "HEART_RATE" || targetType === "POWER") {
      if (s.targetValueType !== "PERCENT") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HEART_RATE/POWER => targetValueType doit être 'PERCENT'.",
        });
      }
      if (s.targetValueLow == null || s.targetValueHigh == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HEART_RATE/POWER => targetValueLow et targetValueHigh requis.",
        });
      }
    } else if (targetType === "CADENCE" || targetType === "PACE" || targetType === "SPEED") {
      if (s.targetValueLow == null || s.targetValueHigh == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${targetType} => targetValueLow et targetValueHigh requis.`,
        });
      }
    }

    if (s.drillType === "PULL" && s.strokeType && !["FREESTYLE", "MIXED"].includes(s.strokeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "drillType PULL recommandé avec strokeType FREESTYLE ou MIXED.",
      });
    }
  });

/** --- Step répété (contient des WorkoutStep enfants) --- */
const WorkoutRepeatStepSchema = z
  .object({
    type: z.literal("WorkoutRepeatStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: RepeatType, // obligatoire
    repeatValue: z.number().int().positive(), // obligatoire
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.array(WorkoutStepSchema).min(1), // enfants = WorkoutStep uniquement
    intensity: Intensity,
    description: z.string().min(1),

    // Pas de durée propre sur le parent repeat (durées portées par les enfants)
    durationType: nullable(DurationType),
    durationValue: nullable(z.number()),
    durationValueType: nullable(z.string()),

    equipmentType: nullable(z.string()),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(z.string()),

    targetType: nullable(TargetType),
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(TargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(z.enum(["FREESTYLE", "BACKSTROKE", "BREASTSTROKE", "BUTTERFLY", "MIXED"])),
    drillType: nullable(z.enum(["PULL", "KICK", "DRILL", "UNKNOWN"])),
  })
  .superRefine((step, ctx) => {
    if (step.durationType != null || step.durationValue != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WorkoutRepeatStep ne doit pas avoir de duration propre (durées dans ses steps enfants).",
      });
    }

    if (step.targetType && step.targetType !== "OPEN") {
      if (step.targetType === "HEART_RATE" || step.targetType === "POWER") {
        if (step.targetValueType !== "PERCENT" || step.targetValueLow == null || step.targetValueHigh == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "RepeatStep avec HEART_RATE/POWER => PERCENT + low/high requis.",
          });
        }
      } else if (["CADENCE", "PACE", "SPEED"].includes(step.targetType)) {
        if (step.targetValueLow == null || step.targetValueHigh == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "RepeatStep targetType cadence/pace/speed => low/high requis.",
          });
        }
      }
    }
  });

/** --- Union de steps --- */
export const Step = z.union([WorkoutStepSchema, WorkoutRepeatStepSchema]);

/** --- Segment --- */
export const Segment = z
  .object({
    segmentOrder: z.number().int().positive(),
    sport: Sport,
    estimatedDurationInSecs: nullable(z.number().int().nonnegative()),
    estimatedDistanceInMeters: nullable(z.number().int().nonnegative()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(z.string()),
    steps: z.array(Step).min(1),
  })
  .superRefine((segment, ctx) => {
    let lastOrder = 0;
    for (const step of segment.steps) {
      if (step.stepOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "stepOrder doit être strictement croissant dans un segment.",
        });
        break;
      }
      lastOrder = step.stepOrder;
    }
  });

/** --- Workout racine --- */
export const GarminWorkoutSchema = z
  .object({
    ownerId: nullable(z.string()),
    workoutName: z.string().min(1),
    description: z.string().min(1),
    sport: Sport,
    estimatedDurationInSecs: z.number().int().nonnegative(),
    estimatedDistanceInMeters: nullable(z.number().int().nonnegative()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(z.string()),
    workoutProvider: z.string().min(1),
    workoutSourceId: z.string().min(1),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(Segment).min(1),
  })
  .superRefine((workout, ctx) => {
    let lastOrder = 0;
    for (const segment of workout.segments) {
      if (segment.segmentOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "segmentOrder doit être strictement croissant.",
        });
        break;
      }
      lastOrder = segment.segmentOrder;
    }
  });
