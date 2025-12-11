import { describe, expect, beforeEach, it, vi } from "vitest";

const mockGetUser = vi.fn();
const selectBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const mockDbSelect = vi.fn(() => selectBuilder);
const mockFetchGarminData = vi.fn();
const mockTrainingGauge = { mock: "gauge" };

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: mockDbSelect,
  },
}));

vi.mock("@/db/schema", () => ({
  users: {},
}));

vi.mock("@/lib/garminData", () => ({
  fetchGarminData: mockFetchGarminData,
}));

vi.mock("@/lib/trainingScore", () => ({
  mockGarminData: () => mockTrainingGauge,
}));

vi.mock("server-only", () => ({}));

const { GET } = await import("@/app/api/garmin-data/route");

describe("GET /api/garmin-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses unauthenticated requests", async () => {
    mockGetUser.mockResolvedValueOnce(null);

    const response = await GET(new Request("https://example.com/api/garmin-data"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("returns fallback dataset when the user profile does not exist locally", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-1" });
    selectBuilder.limit.mockResolvedValueOnce([]);

    const response = await GET(new Request("https://example.com/api/garmin-data"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      connection: null,
      sections: [],
      trainingGaugeData: mockTrainingGauge,
      usedRealtimeMetrics: false,
      hasSyncedOnce: false,
    });
    expect(mockFetchGarminData).not.toHaveBeenCalled();
  });

  it("returns synced Garmin data for authenticated users with a local profile", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-42" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 99, gender: "femme" }]);
    const garminData = {
      connection: { garminUserId: "abc" },
      sections: [],
      trainingGaugeData: {},
      usedRealtimeMetrics: true,
      hasSyncedOnce: true,
    };
    mockFetchGarminData.mockResolvedValueOnce(garminData);

    const response = await GET(
      new Request("https://example.com/api/garmin-data?locale=en", {
        headers: { "x-adapt2life-locale": "en" },
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetchGarminData).toHaveBeenCalledWith(99, { gender: "femme", locale: "en" });
    expect(payload).toEqual(garminData);
  });
});
