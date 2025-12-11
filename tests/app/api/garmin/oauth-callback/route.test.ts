import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockDbSelect = vi.fn();
const buildSelectBuilder = () => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
});
const sessionSelectBuilder = buildSelectBuilder();
const userSelectBuilder = buildSelectBuilder();
const connectionSelectBuilder = buildSelectBuilder();
const insertBuilder = {
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};
const mockDeleteGarminConnections = vi.fn();
const mockDeleteOauthSessions = vi.fn();
const mockExchangeCode = vi.fn();
const mockFetchGarminUserId = vi.fn();
const mockEncryptSecret = vi.fn((value: string) => `enc-${value}`);
class MockGarminOAuthError extends Error {}

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

let selectCall = 0;

const mockUsersTable = {};
const mockGarminConnectionsTable = {};
const mockGarminOauthSessionsTable = {};

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      selectCall += 1;
      if (selectCall === 1) {
        return sessionSelectBuilder;
      }
      if (selectCall === 2) {
        return userSelectBuilder;
      }
      return connectionSelectBuilder;
    },
    insert: () => insertBuilder,
    delete: (table: unknown) => {
      if (table === mockGarminConnectionsTable) {
        return { where: mockDeleteGarminConnections };
      }
      if (table === mockGarminOauthSessionsTable) {
        return { where: mockDeleteOauthSessions };
      }
      return { where: vi.fn() };
    },
  },
}));

vi.mock("@/db/schema", () => ({
  users: mockUsersTable,
  garminConnections: mockGarminConnectionsTable,
  garminOauthSessions: mockGarminOauthSessionsTable,
}));

vi.mock("@/lib/adapters/garmin", () => ({
  GarminOAuthError: MockGarminOAuthError,
  exchangeAuthorizationCode: mockExchangeCode,
  fetchGarminUserId: mockFetchGarminUserId,
}));

vi.mock("@/lib/crypto", () => ({
  encryptSecret: mockEncryptSecret,
}));

vi.mock("@/lib/env", () => ({
  env: {
    APP_URL: "https://app.example.com",
    GARMIN_REDIRECT_URI: "https://app.example.com/api/garmin/callback",
  },
}));

vi.mock("server-only", () => ({}));

const { GET } = await import("@/app/api/garmin/callback/route");

describe("GET /api/garmin/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCall = 0;
    sessionSelectBuilder.limit.mockReset();
    userSelectBuilder.limit.mockReset();
    connectionSelectBuilder.limit.mockReset();
    insertBuilder.values = vi.fn().mockReturnThis();
    insertBuilder.onConflictDoUpdate = vi.fn().mockReturnThis();
    mockDeleteGarminConnections.mockReset().mockResolvedValue(undefined);
    mockDeleteOauthSessions.mockReset().mockResolvedValue(undefined);
  });

  it("rejects callbacks without the oauth session", async () => {
    sessionSelectBuilder.limit.mockResolvedValueOnce([]);
    const response = await GET(new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("status=error");
    expect(response.headers.get("location")).toContain("invalid_session");
  });

  it("links the Garmin account and redirects to the integrations page on success", async () => {
    sessionSelectBuilder.limit.mockResolvedValueOnce([
      { id: 1, codeVerifier: "verifier", userId: 42, stackUserId: "stack-user", expiresAt: new Date(Date.now() + 1000) },
    ]);
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    userSelectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    connectionSelectBuilder.limit.mockResolvedValueOnce([]);
    mockExchangeCode.mockResolvedValue({
      accessToken: "token",
      refreshToken: "refresh",
      tokenType: "Bearer",
      scope: "scope",
      accessTokenExpiresAt: new Date("2025-01-01T00:00:00Z"),
    });
    mockFetchGarminUserId.mockResolvedValue("garmin-user-1");

    const response = await GET(
      new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/integrations/garmin?status=success");
    expect(insertBuilder.values).toHaveBeenCalled();
    const cookieHeader = response.headers.get("set-cookie") ?? "";
    expect(cookieHeader).toContain("garmin_oauth_state=");
    expect(cookieHeader).toContain("Max-Age=0");
    expect(mockDeleteOauthSessions).toHaveBeenCalled();
  });

  it("rejects callbacks when the Stack session does not match the stored user", async () => {
    sessionSelectBuilder.limit.mockResolvedValueOnce([
      { id: 1, codeVerifier: "code", userId: 1, stackUserId: "expected-stack", expiresAt: new Date(Date.now() + 1000) },
    ]);
    mockGetUser.mockResolvedValue({ id: "other-stack" });

    const response = await GET(new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("unauthorized");
    expect(userSelectBuilder.limit).not.toHaveBeenCalled();
  });

  it("reassigns Garmin accounts already linked to another user", async () => {
    sessionSelectBuilder.limit.mockResolvedValueOnce([
      { id: 1, codeVerifier: "verifier", userId: 42, stackUserId: "stack-user", expiresAt: new Date(Date.now() + 1000) },
    ]);
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    userSelectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    connectionSelectBuilder.limit.mockResolvedValueOnce([{ userId: 99 }]);
    mockExchangeCode.mockResolvedValue({
      accessToken: "token",
      refreshToken: "refresh",
      tokenType: "Bearer",
      scope: "scope",
      accessTokenExpiresAt: new Date("2024-01-01T00:00:00Z"),
    });
    mockFetchGarminUserId.mockResolvedValue("garmin-user-1");

    const response = await GET(
      new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("reason=reassigned");
    expect(mockDeleteGarminConnections).toHaveBeenCalled();
  });

  it("surfaces Garmin OAuth failures with an error redirect", async () => {
    sessionSelectBuilder.limit.mockResolvedValueOnce([
      { id: 1, codeVerifier: "verifier", userId: 42, stackUserId: "stack-user", expiresAt: new Date(Date.now() + 1000) },
    ]);
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    userSelectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    mockExchangeCode.mockRejectedValueOnce(new MockGarminOAuthError("bad oauth"));

    const response = await GET(
      new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("oauth_failed");
  });
});
