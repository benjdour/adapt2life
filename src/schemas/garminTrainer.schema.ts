import { z } from "zod";

/**
 * 🧩 Step de base : WorkoutStep
 */
const workoutStepSchema = z.object({
  type: z.literal("WorkoutStep"),
  stepId: z.string().nullable(),
  stepOrder: z.number(),
  repeatType: z.string().nullable(),
  repeatValue: z.number().nullable(),
  skipLastRestStep: z.boolean(),
  steps: z.null(),
  intensity: z.enum(["WARMUP", "INTERVAL", "MAIN", "RECOVERY", "COOLDOWN"]),
  description: z.string(),
  durationType: z.literal("TIME").nullable(),
  durationValue: z.number().nullable(),
  durationValueType: z.string().nullable(),
  equipmentType: z.string().nullable(),
  exerciseCategory: z.string().nullable(),
  exerciseName: z.string().nullable(),
  weightValue: z.number().nullable(),
  weightDisplayUnit: z.string().nullable(),
  targetType: z.enum(["POWER", "HEART_RATE", "CADENCE", "OPEN"]).nullable(),
  targetValue: z.number().nullable(),
  targetValueLow: z.number().nullable(),
  targetValueHigh: z.number().nullable(),
  targetValueType: z.enum(["PERCENT"]).nullable(),
  secondaryTargetType: z.enum(["POWER", "HEART_RATE", "CADENCE"]).nullable(),
  secondaryTargetValue: z.number().nullable(),
  secondaryTargetValueLow: z.number().nullable(),
  secondaryTargetValueHigh: z.number().nullable(),
  secondaryTargetValueType: z.enum(["PERCENT"]).nullable(),
  strokeType: z.string().nullable(),
  drillType: z.string().nullable(),
});

/**
 * 🔁 Step de répétition : WorkoutRepeatStep
 */
const workoutRepeatStepSchema = z.object({
  type: z.literal("WorkoutRepeatStep"),
  stepId: z.string().nullable(),
  stepOrder: z.number(),
  repeatType: z.literal("REPEAT_COUNT"),
  repeatValue: z.number(),
  skipLastRestStep: z.boolean(),
  steps: z.array(workoutStepSchema),
  intensity: z.enum(["WARMUP", "MAIN", "INTERVAL", "RECOVERY"]),
  description: z.string(),
  durationType: z.string().nullable(),
  durationValue: z.number().nullable(),
  durationValueType: z.string().nullable(),
  equipmentType: z.string().nullable(),
  exerciseCategory: z.string().nullable(),
  exerciseName: z.string().nullable(),
  weightValue: z.number().nullable(),
  weightDisplayUnit: z.string().nullable(),
  targetType: z.string().nullable(),
  targetValue: z.number().nullable(),
  targetValueLow: z.number().nullable(),
  targetValueHigh: z.number().nullable(),
  targetValueType: z.string().nullable(),
  secondaryTargetType: z.string().nullable(),
  secondaryTargetValue: z.number().nullable(),
  secondaryTargetValueLow: z.number().nullable(),
  secondaryTargetValueHigh: z.number().nullable(),
  secondaryTargetValueType: z.string().nullable(),
  strokeType: z.string().nullable(),
  drillType: z.string().nullable(),
});

/**
 * 🧩 Segment : un ensemble de steps
 */
const segmentSchema = z.object({
  segmentOrder: z.number(),
  sport: z.literal("CYCLING"),
  estimatedDurationInSecs: z.number(),
  estimatedDistanceInMeters: z.number().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: z.string().nullable(),
  steps: z.array(z.union([workoutStepSchema, workoutRepeatStepSchema])),
});

/**
 * 🧠 Entraînement complet : Workout
 */
export const workoutSchema = z.object({
  ownerId: z.string().uuid().or(z.string().length(32)).nullable(), // UUID ou hash MD5-like
  workoutName: z.string(),
  description: z.string(),
  sport: z.literal("CYCLING"),
  estimatedDurationInSecs: z.number(),
  estimatedDistanceInMeters: z.number().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: z.string().nullable(),
  workoutProvider: z.literal("Adapt2Life"),
  workoutSourceId: z.literal("Adapt2Life"),
  isSessionTransitionEnabled: z.boolean(),
  segments: z.array(segmentSchema),
});

export type GarminTrainerWorkout = z.infer<typeof workoutSchema>;
