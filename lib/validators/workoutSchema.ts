import { z } from "zod";

const ownerIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^[a-f0-9]{32}$/i, "ownerId doit être un UUID ou un hash 32 caractères"),
]);

export const IntensityEnum = z.enum(["WARMUP", "MAIN", "INTERVAL", "RECOVERY", "COOLDOWN"]);

export const RepeatTypeEnum = z.enum(["REPEAT_COUNT", "REPEAT_UNTIL_STOP"]);

export const DurationTypeEnum = z.enum([
  "TIME",
  "DISTANCE",
  "CALORIES",
  "HR_LESS_THAN",
  "HR_GREATER_THAN",
  "OPEN",
  "POWER_LESS_THAN",
  "POWER_GREATER_THAN",
  "TIME_AT_VALID_CDA",
  "FIXED_REST",
  "REPS",
]);

export const TargetTypeEnum = z.enum(["POWER", "HEART_RATE", "CADENCE", "OPEN"]);

export const SecondaryTargetTypeEnum = z.enum(["POWER", "HEART_RATE", "CADENCE", "OPEN"]);

export const SegmentSportEnum = z.enum(["CYCLING", "RUNNING", "SWIMMING", "STRENGTH", "YOGA", "OTHER"]);

const baseStepFields = {
  stepId: z.string().optional(),
  stepOrder: z.number(),
  repeatValue: z.number().optional(),
  skipLastRestStep: z.boolean().optional(),
  intensity: IntensityEnum.optional(),
  description: z.string().optional(),
  durationType: DurationTypeEnum.optional(),
  durationValue: z.number().optional(),
  durationValueType: z.enum(["PERCENT"]).optional(),
  equipmentType: z.string().optional(),
  exerciseCategory: z.string().optional(),
  exerciseName: z.string().optional(),
  weightValue: z.number().optional(),
  weightDisplayUnit: z.enum(["KILOGRAM", "POUND"]).optional(),
  targetType: TargetTypeEnum.optional(),
  targetValue: z.number().optional(),
  targetValueLow: z.number().optional(),
  targetValueHigh: z.number().optional(),
  targetValueType: z.enum(["PERCENT"]).optional(),
  secondaryTargetType: SecondaryTargetTypeEnum.optional(),
  secondaryTargetValue: z.number().optional(),
  secondaryTargetValueLow: z.number().optional(),
  secondaryTargetValueHigh: z.number().optional(),
  secondaryTargetValueType: z.enum(["PERCENT"]).optional(),
  strokeType: z.string().optional(),
  drillType: z.string().optional(),
};

export const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("WorkoutStep"),
        ...baseStepFields,
        repeatType: RepeatTypeEnum.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("WorkoutRepeatStep"),
        ...baseStepFields,
        repeatType: RepeatTypeEnum,
        repeatValue: z.number(),
        steps: z.array(StepSchema),
      })
      .strict(),
  ]),
);

export type Step = z.infer<typeof StepSchema>;

export const SegmentSchema = z
  .object({
    segmentOrder: z.number(),
    sport: SegmentSportEnum,
    estimatedDurationInSecs: z.number().optional(),
    estimatedDistanceInMeters: z.number().optional(),
    poolLength: z.number().optional(),
    poolLengthUnit: z.enum(["METER", "YARD"]).optional(),
    steps: z.array(StepSchema),
  })
  .strict();

export const WorkoutSchema = z
  .object({
    ownerId: ownerIdSchema.optional(),
    workoutName: z.string(),
    description: z.string().optional(),
    sport: SegmentSportEnum,
    estimatedDurationInSecs: z.number().optional(),
    estimatedDistanceInMeters: z.number().optional(),
    poolLength: z.number().optional(),
    poolLengthUnit: z.enum(["METER", "YARD"]).optional(),
    workoutProvider: z.string(),
    workoutSourceId: z.string(),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(SegmentSchema),
  })
  .strict();

export type Workout = z.infer<typeof WorkoutSchema>;
