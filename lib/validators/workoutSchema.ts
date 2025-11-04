import { z } from "zod";

const ownerIdSchema = z.union([
  z.string().uuid(),
  z.string().regex(/^[a-f0-9]{32}$/i, "ownerId doit être un UUID ou un hash 32 caractères"),
]);

export const IntensityEnum = z.enum(["ACTIVE", "REST", "WARMUP", "COOLDOWN", "INTERVAL", "RECOVERY", "MAIN"]);

export const RepeatTypeEnum = z.enum([
  "REPEAT_COUNT",
  "REPEAT_UNTIL_STEPS_CMPLT",
  "REPEAT_UNTIL_TIME",
  "REPEAT_UNTIL_DISTANCE",
]);

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

const optionalNullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

const baseStepFields: Record<string, z.ZodTypeAny> = {
  stepId: optionalNullable(z.string()),
  stepOrder: z.number(),
  repeatType: optionalNullable(RepeatTypeEnum),
  repeatValue: optionalNullable(z.number()),
  skipLastRestStep: optionalNullable(z.boolean()),
  intensity: optionalNullable(IntensityEnum),
  description: optionalNullable(z.string()),
  durationType: optionalNullable(DurationTypeEnum),
  durationValue: optionalNullable(z.number()),
  durationValueType: optionalNullable(z.enum(["PERCENT"])),
  equipmentType: optionalNullable(z.string()),
  exerciseCategory: optionalNullable(z.string()),
  exerciseName: optionalNullable(z.string()),
  weightValue: optionalNullable(z.number()),
  weightDisplayUnit: optionalNullable(z.enum(["KILOGRAM", "POUND"])),
  targetType: optionalNullable(TargetTypeEnum),
  targetValue: optionalNullable(z.number()),
  targetValueLow: optionalNullable(z.number()),
  targetValueHigh: optionalNullable(z.number()),
  targetValueType: optionalNullable(z.enum(["PERCENT"])),
  secondaryTargetType: optionalNullable(SecondaryTargetTypeEnum),
  secondaryTargetValue: optionalNullable(z.number()),
  secondaryTargetValueLow: optionalNullable(z.number()),
  secondaryTargetValueHigh: optionalNullable(z.number()),
  secondaryTargetValueType: optionalNullable(z.enum(["PERCENT"])),
  strokeType: optionalNullable(z.string()),
  drillType: optionalNullable(z.string()),
};

export const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    z
      .object({
        type: z.literal("WorkoutStep"),
        ...baseStepFields,
        steps: optionalNullable(z.array(StepSchema)),
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
    estimatedDurationInSecs: optionalNullable(z.number()),
    estimatedDistanceInMeters: optionalNullable(z.number()),
    poolLength: optionalNullable(z.number()),
    poolLengthUnit: optionalNullable(z.enum(["METER", "YARD"])),
    steps: z.array(StepSchema),
  })
  .strict();

export const WorkoutSchema = z
  .object({
    ownerId: optionalNullable(ownerIdSchema),
    workoutName: z.string(),
    description: optionalNullable(z.string()),
    sport: SegmentSportEnum,
    estimatedDurationInSecs: optionalNullable(z.number()),
    estimatedDistanceInMeters: optionalNullable(z.number()),
    poolLength: optionalNullable(z.number()),
    poolLengthUnit: optionalNullable(z.enum(["METER", "YARD"])),
    workoutProvider: z.string(),
    workoutSourceId: z.string(),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(SegmentSchema),
  })
  .strict();

export type Workout = z.infer<typeof WorkoutSchema>;
