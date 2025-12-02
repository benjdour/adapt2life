import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockConstructEvent = vi.fn();
const updateBuilder = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
};
const selectBuilder = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

vi.mock("stripe", () => {
  class Stripe {
    webhooks = {
      constructEvent: mockConstructEvent,
    };
  }
  return { default: Stripe };
});

vi.mock("@/db", () => ({
  db: {
    update: () => updateBuilder,
    select: () => selectBuilder,
  },
}));

vi.mock("@/db/schema", () => ({
  users: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: (...args: unknown[]) => ({ eq: args }),
}));

vi.mock("server-only", () => ({}));

const { POST } = await import("@/app/api/stripe/webhook/route");
const FIXED_NOW = new Date("2025-01-15T10:00:00.000Z");

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
    geo: undefined,
    ua: undefined,
    page: { name: url, params: {} },
    nextConfig: {},
  }) as unknown as NextRequest;
};

describe("POST /api/stripe/webhook", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    updateBuilder.set.mockClear();
    updateBuilder.where.mockClear();
    selectBuilder.limit?.mockReset?.();
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
  });

  const makeRequest = (body = "{}", headers: Record<string, string> = {}) =>
    createNextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": headers["stripe-signature"] ?? "sig",
        ...headers,
      },
      body,
    });

  it("returns 400 when the signature header is missing", async () => {
    const response = await POST(makeRequest("{}", { "stripe-signature": "" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Configuration Stripe incomplète." });
  });

  it("returns 400 when the signature is invalid", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("bad signature");
    });

    const response = await POST(makeRequest("{}"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Signature Stripe invalide." });
  });

  it("handles checkout.session.completed events", async () => {
    const session = {
      metadata: { userId: "42", planId: "paid_light" },
      customer: "cus_123",
      subscription: "sub_123",
      line_items: { data: [] },
    };
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: { object: session },
    });

    const response = await POST(makeRequest(JSON.stringify({})));

    expect(response.status).toBe(200);
    expect(updateBuilder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        planType: "paid_light",
        planDowngradeAt: null,
      }),
    );
  });

  it("handles customer.subscription.deleted events immediately", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123", cancel_at_period_end: false } },
    });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(updateBuilder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeSubscriptionId: null,
        stripePlanId: null,
        planType: "free",
        planDowngradeAt: null,
      }),
    );
  });

  it("schedules downgrade when deletion occurs at period end", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123", cancel_at_period_end: true } },
    });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(updateBuilder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        planDowngradeAt: new Date(Date.UTC(2025, 1, 1)),
      }),
    );
  });
});
