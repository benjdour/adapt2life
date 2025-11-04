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
  stepId: z.string().nullable().optional(),
  stepOrder: z.number(),
  repeatValue: z.number().nullable().optional(),
  skipLastRestStep: z.boolean().optional(),
  intensity: IntensityEnum.nullable().optional(),
  description: z.string().nullable().optional(),
  durationType: DurationTypeEnum.nullable().optional(),
  durationValue: z.number().nullable().optional(),
  durationValueType: z.enum(["PERCENT"]).nullable().optional(),
  equipmentType: z.string().nullable().optional(),
  exerciseCategory: z.string().nullable().optional(),
  exerciseName: z.string().nullable().optional(),
  weightValue: z.number().nullable().optional(),
  weightDisplayUnit: z.enum(["KILOGRAM", "POUND"]).nullable().optional(),
  targetType: TargetTypeEnum.nullable().optional(),
  targetValue: z.number().nullable().optional(),
  targetValueLow: z.number().nullable().optional(),
  targetValueHigh: z.number().nullable().optional(),
  targetValueType: z.enum(["PERCENT"]).nullable().optional(),
  secondaryTargetType: SecondaryTargetTypeEnum.nullable().optional(),
  secondaryTargetValue: z.number().nullable().optional(),
  secondaryTargetValueLow: z.number().nullable().optional(),
  secondaryTargetValueHigh: z.number().nullable().optional(),
  secondaryTargetValueType: z.enum(["PERCENT"]).nullable().optional(),
  strokeType: z.string().nullable().optional(),
  drillType: z.string().nullable().optional(),
};

export const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("WorkoutStep"),
        ...baseStepFields,
        repeatType: RepeatTypeEnum.nullable().optional(),
        steps: z.null().optional(),
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
    estimatedDurationInSecs: z.number().nullable(),
    estimatedDistanceInMeters: z.number().nullable(),
    poolLength: z.number().nullable(),
    poolLengthUnit: z.enum(["METER", "YARD"]).nullable(),
    steps: z.array(StepSchema),
  })
  .strict();

export const WorkoutSchema = z
  .object({
    ownerId: ownerIdSchema,
    workoutName: z.string(),
    description: z.string().nullable(),
    sport: SegmentSportEnum,
    estimatedDurationInSecs: z.number().nullable(),
    estimatedDistanceInMeters: z.number().nullable(),
    poolLength: z.number().nullable(),
    poolLengthUnit: z.enum(["METER", "YARD"]).nullable(),
    workoutProvider: z.string(),
    workoutSourceId: z.string(),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(SegmentSchema),
  })
  .strict();

export type Workout = z.infer<typeof WorkoutSchema>;
