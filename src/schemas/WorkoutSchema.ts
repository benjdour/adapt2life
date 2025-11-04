import { z } from "zod";

const SportEnum = z.enum([
  "LAP_SWIMMING",
  "OPEN_WATER_SWIMMING",
  "RUNNING",
  "TRAIL_RUNNING",
  "CYCLING",
  "MOUNTAIN_BIKING",
  "INDOOR_CYCLING",
  "CARDIO_TRAINING",
  "HIIT",
  "STRENGTH_TRAINING",
  "ROWING",
  "SKIING",
  "SNOWBOARDING",
  "YOGA",
  "PILATES",
  "TRANSITION",
  "MULTISPORT",
]);

type Step = {
  type: "WorkoutStep" | "WorkoutRepeatStep";
  stepId: string | null;
  stepOrder: number;
  repeatType: "REPEAT_COUNT" | "DISTANCE" | "TIME" | "TIMES" | null;
  repeatValue: number | null;
  skipLastRestStep: boolean;
  steps: Step[] | null;
  intensity: "WARMUP" | "MAIN" | "INTERVAL" | "COOLDOWN" | "RECOVERY" | null;
  description: string | null;
  durationType: "TIME" | "DISTANCE" | null;
  durationValue: number | null;
  targetType: "OPEN" | "PACE" | "POWER" | "HEART_RATE" | "CADENCE" | null;
  targetValue: number | null;
  targetValueLow: number | null;
  targetValueHigh: number | null;
  targetValueType: "PERCENT" | "ZONE" | null;
  secondaryTargetType: "CADENCE" | "POWER" | "HEART_RATE" | null;
  secondaryTargetValueLow: number | null;
  secondaryTargetValueHigh: number | null;
  strokeType: string | null;
  drillType: string | null;
};

const StepSchema: z.ZodType<Step> = z.lazy(() =>
  z.object({
    type: z.enum(["WorkoutStep", "WorkoutRepeatStep"]),
    stepId: z.string().nullable(),
    stepOrder: z.number(),
    repeatType: z.enum(["REPEAT_COUNT", "DISTANCE", "TIME", "TIMES"]).nullable(),
    repeatValue: z.number().nullable(),
    skipLastRestStep: z.boolean(),
    steps: z.array(StepSchema).nullable(),
    intensity: z.enum(["WARMUP", "MAIN", "INTERVAL", "COOLDOWN", "RECOVERY"]).nullable(),
    description: z.string().nullable(),
    durationType: z.enum(["TIME", "DISTANCE"]).nullable(),
    durationValue: z.number().nullable(),
    targetType: z.enum(["OPEN", "PACE", "POWER", "HEART_RATE", "CADENCE"]).nullable(),
    targetValue: z.number().nullable(),
    targetValueLow: z.number().nullable(),
    targetValueHigh: z.number().nullable(),
    targetValueType: z.enum(["PERCENT", "ZONE"]).nullable(),
    secondaryTargetType: z.enum(["CADENCE", "POWER", "HEART_RATE"]).nullable(),
    secondaryTargetValueLow: z.number().nullable(),
    secondaryTargetValueHigh: z.number().nullable(),
    strokeType: z.string().nullable(),
    drillType: z.string().nullable(),
  }),
);

const SegmentSchema = z.object({
  segmentOrder: z.number(),
  sport: SportEnum,
  estimatedDurationInSecs: z.number().nullable(),
  estimatedDistanceInMeters: z.number().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: z.enum(["METER", "YARD"]).nullable(),
  steps: z.array(StepSchema),
});

const WorkoutSchema = z.object({
  ownerId: z.string().nullable(),
  workoutName: z.string(),
  description: z.string().nullable(),
  sport: SportEnum,
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

export { WorkoutSchema };
