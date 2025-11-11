import { describe, expect, it } from "vitest";

import { GarminWorkoutSchema } from "@/schemas/garminWorkout.schema";
import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

const buildBaseWorkout = (sport: GarminTrainerWorkout["sport"]): GarminTrainerWorkout => ({
  ownerId: null,
  workoutName: `Test ${sport}`,
  description: null,
  sport,
  estimatedDurationInSecs: null,
  estimatedDistanceInMeters: null,
  poolLength: null,
  poolLengthUnit: null,
  workoutProvider: "Adapt2Life",
  workoutSourceId: "Adapt2Life",
  isSessionTransitionEnabled: false,
  segments: [
    {
      segmentOrder: 1,
      sport,
      estimatedDurationInSecs: null,
      estimatedDistanceInMeters: null,
      poolLength: null,
      poolLengthUnit: null,
      steps: [
        {
          type: "WorkoutStep" as const,
          stepId: null,
          stepOrder: 1,
          repeatType: null,
          repeatValue: null,
          skipLastRestStep: false,
          steps: null,
          intensity: "ACTIVE" as const,
          description: null,
          durationType: "TIME" as const,
          durationValue: 60,
          durationValueType: null,
          equipmentType: null,
          exerciseCategory: "BANDED_EXERCISES",
          exerciseName: "AB_TWIST",
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
        },
      ],
    },
  ],
} as GarminTrainerWorkout);

const clone = (value: GarminTrainerWorkout): GarminTrainerWorkout =>
  JSON.parse(JSON.stringify(value)) as GarminTrainerWorkout;

describe("GarminWorkoutSchema exercise metadata validation", () => {
  it("accepts a strength workout with a known exercise", () => {
    const result = GarminWorkoutSchema.safeParse(clone(buildBaseWorkout("STRENGTH_TRAINING")));
    expect(result.success).toBe(true);
  });

  it("accepts a strength workout with weight metadata", () => {
    const workout = clone(buildBaseWorkout("STRENGTH_TRAINING"));
    workout.segments[0].steps[0].weightValue = 20;
    workout.segments[0].steps[0].weightDisplayUnit = "KILOGRAM";

    const result = GarminWorkoutSchema.safeParse(workout);
    expect(result.success).toBe(true);
  });

  it("rejects a strength workout without exercise metadata", () => {
    const invalid = clone(buildBaseWorkout("STRENGTH_TRAINING"));
    invalid.segments[0].steps[0].exerciseCategory = null;
    invalid.segments[0].steps[0].exerciseName = null;

    const result = GarminWorkoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "segments.0.steps.0.exerciseCategory")).toBe(true);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "segments.0.steps.0.exerciseName")).toBe(true);
  });

  it("rejects a running workout that specifies an exercise category", () => {
    const runningWorkout = clone(buildBaseWorkout("STRENGTH_TRAINING"));
    runningWorkout.sport = "RUNNING";
    runningWorkout.segments[0].sport = "RUNNING";
    runningWorkout.segments[0].steps[0].exerciseCategory = "BANDED_EXERCISES";
    runningWorkout.segments[0].steps[0].exerciseName = "AB_TWIST";

    const result = GarminWorkoutSchema.safeParse(runningWorkout);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "segments.0.steps.0.exerciseCategory")).toBe(true);
  });

  it("accepts a cardio workout with a known exercise", () => {
    const cardio = clone(buildBaseWorkout("CARDIO_TRAINING"));
    cardio.segments[0].steps[0].exerciseCategory = "CARDIO";
    cardio.segments[0].steps[0].exerciseName = "JUMP_ROPE";

    const result = GarminWorkoutSchema.safeParse(cardio);
    expect(result.success).toBe(true);
  });

  it("rejects a cardio workout that specifies weight metadata", () => {
    const cardio = clone(buildBaseWorkout("CARDIO_TRAINING"));
    cardio.segments[0].steps[0].exerciseCategory = "CARDIO";
    cardio.segments[0].steps[0].exerciseName = "JUMP_ROPE";
    cardio.segments[0].steps[0].weightValue = 15;
    cardio.segments[0].steps[0].weightDisplayUnit = "KILOGRAM";

    const result = GarminWorkoutSchema.safeParse(cardio);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "segments.0.steps.0.weightValue")).toBe(true);
  });

  it("accepts a yoga workout with a known exercise", () => {
    const yoga = clone(buildBaseWorkout("YOGA"));
    yoga.segments[0].steps[0].exerciseCategory = "CORE";
    yoga.segments[0].steps[0].exerciseName = "ARM_AND_LEG_EXTENSION_ON_KNEES";

    const result = GarminWorkoutSchema.safeParse(yoga);
    expect(result.success).toBe(true);
  });

  it("rejects a yoga workout using REPS duration", () => {
    const yoga = clone(buildBaseWorkout("YOGA"));
    yoga.segments[0].steps[0].exerciseCategory = "CORE";
    yoga.segments[0].steps[0].exerciseName = "ARM_AND_LEG_EXTENSION_ON_KNEES";
    yoga.segments[0].steps[0].durationType = "REPS";
    yoga.segments[0].steps[0].durationValue = 10;

    const result = GarminWorkoutSchema.safeParse(yoga);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "segments.0.steps.0.durationType")).toBe(true);
  });
});
