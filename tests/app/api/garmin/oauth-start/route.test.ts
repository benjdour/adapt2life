import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockDbSelect = vi.fn();
const selectBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const insertBuilder = {
  values: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockReturnThis(),
};
const deleteBuilder = {
  where: vi.fn().mockResolvedValue(undefined),
};
const mockBuildAuthorizationUrl = vi.fn();
const mockGeneratePkcePair = vi.fn();
const mockGenerateState = vi.fn();
const mockUsersTable = {};
const mockGarminOauthSessionsTable = {};

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      return selectBuilder;
    },
    insert: () => insertBuilder,
    delete: () => deleteBuilder,
  },
}));

vi.mock("@/db/schema", () => ({
  users: mockUsersTable,
  garminConnections: {},
  garminOauthSessions: mockGarminOauthSessionsTable,
}));

vi.mock("@/lib/adapters/garmin", () => ({
  buildAuthorizationUrl: mockBuildAuthorizationUrl,
  generatePkcePair: mockGeneratePkcePair,
  generateState: mockGenerateState,
}));

vi.mock("server-only", () => ({}));

const { GET } = await import("@/app/api/garmin/oauth/start/route");
const { DEFAULT_USER_PLAN, getUserPlanConfig } = await import("@/lib/constants/userPlans");

describe("GET /api/garmin/oauth/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectBuilder.limit.mockReset();
    insertBuilder.values = vi.fn().mockReturnThis();
    insertBuilder.onConflictDoNothing = vi.fn().mockReturnThis();
    deleteBuilder.where.mockReset().mockResolvedValue(undefined);
    mockGeneratePkcePair.mockReturnValue({ codeVerifier: "verifier", codeChallenge: "challenge" });
    mockGenerateState.mockReturnValue("state-123");
    mockBuildAuthorizationUrl.mockReturnValue(new URL("https://connect.garmin.com/oauth?state=state-123"));
  });

  it("returns 401 when the Stack session is missing", async () => {
    mockGetUser.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/garmin/oauth/start"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("redirects to Garmin when the user has no existing connection and stores an OAuth session", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-1", displayName: "Ben" });
    selectBuilder.limit
      .mockResolvedValueOnce([{ id: 42 }]) // local user lookup
      .mockResolvedValueOnce([]); // connections lookup

    const response = await GET(new Request("http://localhost/api/garmin/oauth/start"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("connect.garmin.com");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(insertBuilder.values).toHaveBeenLastCalledWith(
      expect.objectContaining({
        state: "state-123",
        codeVerifier: "verifier",
        userId: 42,
        stackUserId: "stack-user-1",
      }),
    );
    expect(deleteBuilder.where).toHaveBeenCalled();
  });

  it("redirects back to the integrations page when the account is already connected", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-42" });
    selectBuilder.limit
      .mockResolvedValueOnce([{ id: 77 }]) // local user
      .mockResolvedValueOnce([{ garminUserId: "existing" }]); // existing connection

    const response = await GET(new Request("http://example.com/api/garmin/oauth/start"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://example.com/integrations/garmin?status=success&reason=already_connected");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("creates a local profile when missing before redirecting to Garmin", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-77", displayName: "Ada", primaryEmail: "ada@example.com" });
    selectBuilder.limit
      .mockResolvedValueOnce([]) // first lookup
      .mockResolvedValueOnce([{ id: 55 }]) // lookup after insert
      .mockResolvedValueOnce([]); // garmin connections

    const response = await GET(new Request("http://localhost/api/garmin/oauth/start"));

    expect(response.status).toBe(307);
    const defaultPlan = getUserPlanConfig(DEFAULT_USER_PLAN);
    expect(insertBuilder.values).toHaveBeenCalledWith({
      stackId: "stack-user-77",
      name: "Ada",
      email: "ada@example.com",
      planType: DEFAULT_USER_PLAN,
      trainingGenerationsRemaining: defaultPlan.trainingQuota ?? 0,
      garminConversionsRemaining: defaultPlan.conversionQuota ?? 0,
    });
    expect(insertBuilder.onConflictDoNothing).toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns 500 when the user profile cannot be created", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user-77" });
    selectBuilder.limit.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const response = await GET(new Request("http://localhost/api/garmin/oauth/start"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Unable to create user profile" });
  });
});
