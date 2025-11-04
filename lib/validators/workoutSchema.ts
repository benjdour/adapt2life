import { z } from "zod";

const ownerIdSchema = z
  .string()
  .uuid()
  .or(z.string().regex(/^[a-f0-9]{32}$/i, "ownerId doit être un UUID ou un hash 32 caractères"));

export const IntensityEnum = z.enum(["REST", "WARMUP", "MAIN", "INTERVAL", "RECOVERY", "COOLDOWN", "ACTIVE"]);

export const RepeatTypeEnum = z.enum([
  "REPEAT_COUNT",
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

export const TargetTypeEnum = z.enum([
  "SPEED",
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
  "OPEN",
  "PACE",
]);

export const SecondaryTargetTypeEnum = z.enum([
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
  "PACE_ZONE",
  "SWIM_INSTRUCTION",
  "SWIM_CSS_OFFSET",
]);

export const SegmentSportEnum = z.enum(["CYCLING", "RUNNING", "SWIMMING", "STRENGTH", "YOGA", "OTHER"]);

const baseStepFields = {
  stepId: z.string().nullable(),
  stepOrder: z.number(),
  repeatValue: z.number().nullable(),
  skipLastRestStep: z.boolean().optional(),
  intensity: IntensityEnum.nullable(),
  description: z.string().nullable(),
  durationType: DurationTypeEnum.nullable(),
  durationValue: z.number().nullable(),
  durationValueType: z.enum(["PERCENT"]).nullable(),
  equipmentType: z.string().nullable(),
  exerciseCategory: z.string().nullable(),
  exerciseName: z.string().nullable(),
  weightValue: z.number().nullable(),
  weightDisplayUnit: z.enum(["KILOGRAM", "POUND"]).nullable(),
  targetType: TargetTypeEnum.nullable(),
  targetValue: z.number().nullable(),
  targetValueLow: z.number().nullable(),
  targetValueHigh: z.number().nullable(),
  targetValueType: z.enum(["PERCENT", "ZONE"]).nullable(),
  secondaryTargetType: SecondaryTargetTypeEnum.nullable(),
  secondaryTargetValue: z.number().nullable(),
  secondaryTargetValueLow: z.number().nullable(),
  secondaryTargetValueHigh: z.number().nullable(),
  secondaryTargetValueType: z.enum(["PERCENT", "ZONE"]).nullable(),
  strokeType: z.string().nullable(),
  drillType: z.string().nullable(),
};

export const StepSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("WorkoutStep"),
      ...baseStepFields,
      repeatType: RepeatTypeEnum.nullable(),
      steps: z.null(),
    }),
    z.object({
      type: z.literal("WorkoutRepeatStep"),
      ...baseStepFields,
      repeatType: RepeatTypeEnum,
      repeatValue: z.number(),
      steps: z.array(StepSchema),
    }),
  ]),
);

export type Step = z.infer<typeof StepSchema>;

export const SegmentSchema = z.object({
  segmentOrder: z.number(),
  sport: SegmentSportEnum,
  estimatedDurationInSecs: z.number().nullable(),
  estimatedDistanceInMeters: z.number().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: z.enum(["METER", "YARD"]).nullable(),
  steps: z.array(StepSchema),
});

export const WorkoutSchema = z.object({
  ownerId: ownerIdSchema.nullable(),
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
});

export type Workout = z.infer<typeof WorkoutSchema>;
