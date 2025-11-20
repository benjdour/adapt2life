import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";
import type { GarminAiClient } from "@/lib/ai/garminAiClient";

const mockFetchGarminConnectionByUserId = vi.fn();
const mockSaveGarminWorkoutForUser = vi.fn();
const mockGetAiModelCandidates = vi.fn();
const mockInferExerciseSportsFromMarkdown = vi.fn();
const mockShouldUseExerciseTool = vi.fn();
const mockBuildExerciseCatalogSnippet = vi.fn();

vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("@/db/schema", () => ({
  garminTrainerJobs: {},
  users: {},
}));

vi.mock("@/lib/services/garmin-connections", () => ({
  fetchGarminConnectionByUserId: mockFetchGarminConnectionByUserId,
  ensureGarminAccessToken: vi.fn(),
}));

vi.mock("@/lib/services/userGeneratedArtifacts", () => ({
  saveGarminWorkoutForUser: mockSaveGarminWorkoutForUser,
}));

vi.mock("@/lib/services/aiModelConfig", () => ({
  getAiModelCandidates: mockGetAiModelCandidates,
}));

vi.mock("@/lib/garmin/exerciseInference", () => ({
  inferExerciseSportsFromMarkdown: mockInferExerciseSportsFromMarkdown,
}));

vi.mock("@/lib/ai/exercisePolicy", () => ({
  shouldUseExerciseTool: mockShouldUseExerciseTool,
  EXERCISE_TOOL_FEATURE_ENABLED: true,
}));

vi.mock("@/lib/garminExercises", () => ({
  buildGarminExerciseCatalogSnippet: mockBuildExerciseCatalogSnippet,
}));

const mockToolFactory = vi.fn((config) => config);

vi.mock("ai", () => ({
  tool: mockToolFactory,
  generateText: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

const { setGarminAiClientFactory } = await import("@/lib/ai/garminAiClient");
const { __garminTrainerJobsTesting } = await import("@/lib/services/garminTrainerJobs");
const { convertPlanMarkdownForUser } = __garminTrainerJobsTesting;

const buildWorkout = (sport: GarminTrainerWorkout["sport"]): GarminTrainerWorkout => ({
  ownerId: "garmin-user-1",
  workoutName: `Workout ${sport}`,
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
          type: "WorkoutStep",
          stepId: null,
          stepOrder: 1,
          repeatType: null,
          repeatValue: null,
          skipLastRestStep: false,
          steps: null,
          intensity: "ACTIVE",
          description: null,
          durationType: "TIME",
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
});

type MockedGarminAiClient = GarminAiClient & {
  generate: ReturnType<typeof vi.fn<GarminAiClient["generate"]>>;
};

const createMockClient = (): MockedGarminAiClient =>
  ({
    generate: vi.fn<GarminAiClient["generate"]>(),
  }) as MockedGarminAiClient;

describe("convertPlanMarkdownForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GARMIN_TRAINER_PROMPT = "PROMPT {{EXAMPLE_MARKDOWN}}";
    mockFetchGarminConnectionByUserId.mockResolvedValue({ garminUserId: "garmin-user-1" });
    mockGetAiModelCandidates.mockResolvedValue(["test-model"]);
    mockBuildExerciseCatalogSnippet.mockReturnValue("[CATALOG]");
  });

  afterEach(() => {
    setGarminAiClientFactory(null);
  });

  it("utilise le client strict lorsqu’un sport compatible est détecté", async () => {
    mockInferExerciseSportsFromMarkdown.mockReturnValue(["STRENGTH_TRAINING"]);
    mockShouldUseExerciseTool.mockReturnValue(true);

    const strictClient = createMockClient();
    strictClient.generate.mockResolvedValue({
      rawText: JSON.stringify(buildWorkout("STRENGTH_TRAINING")),
      data: buildWorkout("STRENGTH_TRAINING"),
      parseError: null,
    });

    const classicClient = createMockClient();

    setGarminAiClientFactory(() => ({
      strict: strictClient,
      classic: classicClient,
    }));

    const result = await convertPlanMarkdownForUser(1, "Plan exemple");

    expect(strictClient.generate).toHaveBeenCalledTimes(1);
    expect(classicClient.generate).not.toHaveBeenCalled();
    const calledPrompt = strictClient.generate.mock.calls[0]?.[0]?.basePrompt ?? "";
    expect(calledPrompt).toContain("Plan exemple");
    expect(calledPrompt).not.toContain("[CATALOG]");
    expect(result.workout.workoutName).toBe("Workout STRENGTH_TRAINING");
    expect(mockSaveGarminWorkoutForUser).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it("appelle le client classique pour les sports non pris en charge et ajoute le snippet catalogue", async () => {
    mockInferExerciseSportsFromMarkdown.mockReturnValue(["RUNNING"]);
    mockShouldUseExerciseTool.mockReturnValue(false);

    const strictClient = createMockClient();
    const classicClient = createMockClient();
    classicClient.generate.mockResolvedValue({
      rawText: JSON.stringify(buildWorkout("CARDIO_TRAINING")),
      data: buildWorkout("CARDIO_TRAINING"),
      parseError: null,
    });

    setGarminAiClientFactory(() => ({
      strict: strictClient,
      classic: classicClient,
    }));

    const result = await convertPlanMarkdownForUser(2, "Plan cardio");

    expect(classicClient.generate).toHaveBeenCalledTimes(1);
    expect(strictClient.generate).not.toHaveBeenCalled();
    const calledPrompt = classicClient.generate.mock.calls[0]?.[0]?.basePrompt ?? "";
    expect(calledPrompt).toContain("Plan cardio");
    expect(calledPrompt).toContain("[CATALOG]");
    expect(result.workout.sport).toBe("CARDIO_TRAINING");
    expect(mockSaveGarminWorkoutForUser).toHaveBeenCalledWith(2, expect.any(Object));
  });
});
