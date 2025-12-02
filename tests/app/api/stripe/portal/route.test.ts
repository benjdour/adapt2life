import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const selectBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};
const mockBillingPortalCreate = vi.fn();

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: () => selectBuilder,
  },
}));

vi.mock("@/db/schema", () => ({
  users: {},
}));

vi.mock("stripe", () => {
  class Stripe {
    billingPortal = {
      sessions: {
        create: mockBillingPortalCreate,
      },
    };
  }
  return { default: Stripe };
});

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
}));

vi.mock("server-only", () => ({}));

const { POST } = await import("@/app/api/stripe/portal/route");

const createNextRequest = (url: string, init?: RequestInit): NextRequest => {
  const request = new Request(url, init);
  return Object.assign(request, {
    nextUrl: new URL(url),
    cookies: {
      get: () => undefined,
      getAll: () => [],
      set: vi.fn(),
      delete: vi.fn(),
      has: () => false,
    },
    ip: undefined,
    geo: {} as NextRequest["geo"],
    ua: undefined,
    page: { name: url, params: {} },
    nextConfig: {},
  }) as unknown as NextRequest;
};

describe("POST /api/stripe/portal", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    selectBuilder.limit.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 500 when Stripe is not configured", async () => {
    process.env.STRIPE_SECRET_KEY = "";

    const response = await POST(createNextRequest("http://localhost/api/stripe/portal", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Stripe est indisponible." });
  });

  it("returns 401 when no Stack user is found", async () => {
    mockGetUser.mockResolvedValueOnce(null);

    const response = await POST(createNextRequest("http://localhost/api/stripe/portal", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Authentification requise." });
  });

  it("returns 400 when no Stripe customer is linked", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 1, stripeCustomerId: null }]);

    const response = await POST(createNextRequest("http://localhost/api/stripe/portal", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Aucun abonnement actif." });
  });

  it("returns the portal URL when everything is configured", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user" });
    selectBuilder.limit.mockResolvedValueOnce([{ id: 1, stripeCustomerId: "cus_123" }]);
    mockBillingPortalCreate.mockResolvedValueOnce({ url: "https://billing.stripe.com/session" });

    const response = await POST(createNextRequest("http://localhost/api/stripe/portal", { method: "POST" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ url: "https://billing.stripe.com/session" });
    expect(mockBillingPortalCreate).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "http://localhost/secure/user-information",
    });
  });
});
