import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookies = vi.fn();
const mockGetUser = vi.fn();
const selectBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const selectConnectionsBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const mockDbSelect = vi.fn();
const mockDbDelete = vi.fn().mockReturnThis();
const insertBuilder = {
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};
const mockExchangeCode = vi.fn();
const mockFetchGarminUserId = vi.fn();
const mockEncryptSecret = vi.fn((value: string) => `enc-${value}`);
class MockGarminOAuthError extends Error {}

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

let selectCall = 0;

vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      selectCall += 1;
      return selectCall === 1 ? selectBuilder : selectConnectionsBuilder;
    },
    insert: () => insertBuilder,
    delete: () => ({ where: mockDbDelete }),
  },
}));

vi.mock("@/db/schema", () => ({
  users: {},
  garminConnections: { userId: Symbol("userId") },
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

const buildCookieValue = (payload: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

describe("GET /api/garmin/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCall = 0;
    selectBuilder.limit.mockReset();
    selectConnectionsBuilder.limit.mockReset();
    insertBuilder.values = vi.fn().mockReturnThis();
    insertBuilder.onConflictDoUpdate = vi.fn().mockReturnThis();
    mockCookies.mockResolvedValue({ get: vi.fn().mockReturnValue(null) });
  });

  it("rejects callbacks without the oauth state cookie", async () => {
    mockCookies.mockResolvedValue({ get: vi.fn().mockReturnValue(null) });

    const response = await GET(new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("status=error");
    expect(response.headers.get("location")).toContain("invalid_session");
  });

  it("links the Garmin account and redirects to the integrations page on success", async () => {
    const cookiePayload = {
      state: "state-123",
      codeVerifier: "verifier",
      userId: 42,
      stackUserId: "stack-user",
    };

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: buildCookieValue(cookiePayload) }),
    });
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    selectConnectionsBuilder.limit.mockResolvedValueOnce([]);
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
  });

  it("rejects callbacks when the state does not match the stored cookie", async () => {
    const cookiePayload = {
      state: "expected",
      codeVerifier: "code",
      userId: 1,
      stackUserId: "stack-user",
    };
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: buildCookieValue(cookiePayload) }),
    });

    const response = await GET(new Request("https://app.example.com/api/garmin/callback?code=abc&state=other"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("invalid_state");
  });

  it("rejects callbacks when the Stack session does not match the stored user", async () => {
    const cookiePayload = {
      state: "state-123",
      codeVerifier: "code",
      userId: 1,
      stackUserId: "expected-stack",
    };
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: buildCookieValue(cookiePayload) }),
    });
    mockGetUser.mockResolvedValue({ id: "other-stack" });

    const response = await GET(new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("unauthorized");
    expect(selectBuilder.limit).not.toHaveBeenCalled();
  });

  it("reassigns Garmin accounts already linked to another user", async () => {
    const cookiePayload = {
      state: "state-123",
      codeVerifier: "verifier",
      userId: 42,
      stackUserId: "stack-user",
    };

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: buildCookieValue(cookiePayload) }),
    });
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    selectConnectionsBuilder.limit.mockResolvedValueOnce([{ userId: 99 }]);
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
    expect(mockDbDelete).toHaveBeenCalled();
  });

  it("surfaces Garmin OAuth failures with an error redirect", async () => {
    const cookiePayload = {
      state: "state-123",
      codeVerifier: "verifier",
      userId: 42,
      stackUserId: "stack-user",
    };

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: buildCookieValue(cookiePayload) }),
    });
    mockGetUser.mockResolvedValue({ id: "stack-user" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 42, stackId: "stack-user" }]);
    mockExchangeCode.mockRejectedValueOnce(new MockGarminOAuthError("bad oauth"));

    const response = await GET(
      new Request("https://app.example.com/api/garmin/callback?code=abc&state=state-123"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("oauth_failed");
  });
});
