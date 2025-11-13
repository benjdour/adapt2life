import { describe, it, expect, beforeEach, vi } from "vitest";

const selectResultsQueue: unknown[][] = [];

const createSelectBuilder = () => {
  const builder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(async () => selectResultsQueue.shift() ?? []),
  };
  return builder;
};

const mockDbSelect = vi.fn((..._args: unknown[]) => createSelectBuilder());
const queueSelectResults = (...batches: unknown[][]) => {
  selectResultsQueue.length = 0;
  selectResultsQueue.push(...batches);
};

const trainingGaugeFallback = { mock: "training-data" };
const mockTrainingGauge = vi.fn(() => trainingGaugeFallback);

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  garminConnections: {},
  garminDailySummaries: {},
  garminWebhookEvents: {},
}));

vi.mock("@/lib/trainingScore", () => ({
  mockGarminData: mockTrainingGauge,
}));

const { fetchGarminData } = await import("@/lib/garminData");

describe("fetchGarminData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResultsQueue.length = 0;
  });

  it("returns fallback data when the provided user id is invalid", async () => {
    const result = await fetchGarminData("not-a-number");

    expect(result).toEqual({
      connection: null,
      sections: [],
      trainingGaugeData: trainingGaugeFallback,
      usedRealtimeMetrics: false,
    });
    expect(mockTrainingGauge).toHaveBeenCalledTimes(1);
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it("builds sections and training gauges from stored Garmin summaries", async () => {
    queueSelectResults(
      [
        {
          garminUserId: "garmin-123",
          updatedAt: new Date("2024-03-10T12:00:00Z"),
          accessTokenExpiresAt: new Date("2024-03-11T12:00:00Z"),
          userId: 7,
        },
      ],
      [
        {
          id: 1,
          calendarDate: "2024-03-10",
          steps: 6543,
          distanceMeters: 5000,
          calories: 450,
          stressLevel: 22,
          sleepSeconds: 28800,
          createdAt: new Date("2024-03-10T13:00:00Z"),
          raw: {
            bodyBatteryStatus: { currentLevel: 55, chargedValue: 10, drainedValue: 5 },
            sleepSummary: {
              overallSleepScore: 80,
              sleepDurationInSeconds: 28800,
              deepSleepSeconds: 5400,
              remSleepSeconds: 3600,
              lightSleepSeconds: 7200,
              sleepStartTimestampLocal: "2024-03-09T22:00:00",
              sleepEndTimestampLocal: "2024-03-10T06:00:00",
            },
            summary: {
              totalKilocalories: 2100,
              activeTimeSeconds: 3600,
            },
          },
        },
      ],
      ...Array.from({ length: 13 }, () => []),
    );

    const result = await fetchGarminData(7, { gender: "femme" });

    expect(result.connection).toEqual({
      garminUserId: "garmin-123",
      updatedAt: "2024-03-10T12:00:00.000Z",
      accessTokenExpiresAt: "2024-03-11T12:00:00.000Z",
    });
    expect(result.usedRealtimeMetrics).toBe(true);
    expect(result.trainingGaugeData.bodyBattery?.current).toBe(55);
    expect(result.trainingGaugeData.steps).toBe(6543);
    const firstSection = result.sections[0];
    expect(firstSection.items[0].value).toBe("55/100 · +10 · -5");
    expect(firstSection.items[1].value).toBe("8.0 h");
    expect(mockTrainingGauge).not.toHaveBeenCalled();
  });
});
