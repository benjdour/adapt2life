import { describe, it, expect } from "vitest";

import { workoutSchema } from "@/schemas/garminTrainer.schema";
import { __garminTrainerJobsTesting } from "@/lib/services/garminTrainerJobs";

const normalizeWorkout = (raw: Record<string, unknown>) => {
  const sanitized = __garminTrainerJobsTesting.sanitizeWorkoutValue(raw) as Record<string, unknown>;
  return __garminTrainerJobsTesting.enforceWorkoutPostProcessing(sanitized);
};

const baseWorkout = {
  ownerId: "user-1",
  workoutName: "Test",
  description: null,
  estimatedDurationInSecs: null,
  estimatedDistanceInMeters: null,
  poolLength: null,
  poolLengthUnit: null,
  workoutProvider: "Adapt2Life",
  workoutSourceId: "Adapt2Life",
  isSessionTransitionEnabled: false,
};

describe("garmin trainer normalization", () => {
  it("normalizes running workouts (percent HR, no secondary target)", () => {
    const runningWorkout = {
      ...baseWorkout,
      sport: "RUNNING",
      segments: [
        {
          segmentOrder: 1,
          sport: "RUNNING" as const,
          estimatedDurationInSecs: 600,
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
              description: "Tempo",
              durationType: "TIME" as const,
              durationValue: 300,
              durationValueType: null,
              equipmentType: null,
              exerciseCategory: null,
              exerciseName: null,
              weightValue: null,
              weightDisplayUnit: null,
              targetType: "HEART_RATE" as const,
              targetValue: null,
              targetValueLow: 1,
              targetValueHigh: 2,
              targetValueType: null,
              secondaryTargetType: "CADENCE" as const,
              secondaryTargetValue: null,
              secondaryTargetValueLow: 80,
              secondaryTargetValueHigh: 90,
              secondaryTargetValueType: null,
              strokeType: null,
              drillType: null,
            },
          ],
        },
      ],
    };

    const normalized = normalizeWorkout(runningWorkout);
    const validation = workoutSchema.parse(normalized);
    const step = validation.segments[0]?.steps?.[0];
    expect(step?.targetValueType).toBe("PERCENT");
    expect(step?.secondaryTargetType).toBeNull();
  });

  it("keeps cadence targets for cycling workouts", () => {
    const cyclingWorkout = {
      ...baseWorkout,
      sport: "CYCLING",
      segments: [
        {
          segmentOrder: 1,
          sport: "CYCLING" as const,
          estimatedDurationInSecs: 600,
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
              description: "Spin",
              durationType: "TIME" as const,
              durationValue: 300,
              durationValueType: null,
              equipmentType: null,
              exerciseCategory: null,
              exerciseName: null,
              weightValue: null,
              weightDisplayUnit: null,
              targetType: "POWER" as const,
              targetValue: null,
              targetValueLow: 2,
              targetValueHigh: 3,
              targetValueType: null,
              secondaryTargetType: "CADENCE" as const,
              secondaryTargetValue: null,
              secondaryTargetValueLow: 90,
              secondaryTargetValueHigh: 95,
              secondaryTargetValueType: null,
              strokeType: null,
              drillType: null,
            },
          ],
        },
      ],
    };

    const normalized = normalizeWorkout(cyclingWorkout);
    const validation = workoutSchema.parse(normalized);
    const step = validation.segments[0]?.steps?.[0];
    expect(step?.targetValueType).toBe("PERCENT");
    expect(step?.secondaryTargetType).toBe("CADENCE");
    expect(step?.secondaryTargetValueLow).toBe(90);
    expect(step?.secondaryTargetValueHigh).toBe(95);
  });

  it("forces swim targets into allowed secondary types", () => {
    const swimWorkout = {
      ...baseWorkout,
      sport: "LAP_SWIMMING",
      poolLength: 25,
      poolLengthUnit: "METER",
      segments: [
        {
          segmentOrder: 1,
          sport: "LAP_SWIMMING" as const,
          estimatedDurationInSecs: 600,
          estimatedDistanceInMeters: 400,
          poolLength: 25,
          poolLengthUnit: "METER",
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
              description: "100m crawl",
              durationType: "DISTANCE" as const,
              durationValue: 100,
              durationValueType: null,
              equipmentType: null,
              exerciseCategory: null,
              exerciseName: null,
              weightValue: null,
              weightDisplayUnit: null,
              targetType: "PACE" as const,
              targetValue: null,
              targetValueLow: 1.2,
              targetValueHigh: 1.4,
              targetValueType: null,
              secondaryTargetType: null,
              secondaryTargetValue: null,
              secondaryTargetValueLow: null,
              secondaryTargetValueHigh: null,
              secondaryTargetValueType: null,
              strokeType: "FREESTYLE" as const,
              drillType: null,
            },
          ],
        },
      ],
    };

    const normalized = normalizeWorkout(swimWorkout);
    const validation = workoutSchema.parse(normalized);
    const step = validation.segments[0]?.steps?.[0];
    expect(step?.targetType).toBeNull();
    expect(["SWIM_INSTRUCTION", "PACE_ZONE", "SWIM_CSS_OFFSET"]).toContain(step?.secondaryTargetType);
  });

  it("drops secondary targets for strength workouts", () => {
    const strengthWorkout = {
      ...baseWorkout,
      sport: "STRENGTH_TRAINING",
      segments: [
        {
          segmentOrder: 1,
          sport: "STRENGTH_TRAINING" as const,
          estimatedDurationInSecs: 900,
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
              description: "Push-ups",
              durationType: "REPS" as const,
              durationValue: 12,
              durationValueType: null,
              equipmentType: null,
              exerciseCategory: "PUSH_UP",
              exerciseName: "PUSH_UP",
              weightValue: null,
              weightDisplayUnit: null,
              targetType: "POWER" as const,
              targetValue: 2,
              targetValueLow: null,
              targetValueHigh: null,
              targetValueType: null,
              secondaryTargetType: "CADENCE" as const,
              secondaryTargetValue: null,
              secondaryTargetValueLow: 40,
              secondaryTargetValueHigh: 50,
              secondaryTargetValueType: null,
              strokeType: null,
              drillType: null,
            },
          ],
        },
      ],
    };

    const normalized = normalizeWorkout(strengthWorkout);
    const validation = workoutSchema.parse(normalized);
    const step = validation.segments[0]?.steps?.[0];
    expect(step?.targetType).toBe("POWER");
    expect(step?.targetValueType).toBeNull();
    expect(step?.secondaryTargetType).toBeNull();
  });
});

