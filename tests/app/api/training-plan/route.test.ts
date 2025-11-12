import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockRequestChatCompletion = vi.fn();

class MockAiRequestError extends Error {
  status: number;
  body: string | null;

  constructor(message: string, options?: { status?: number; body?: string | null }) {
    super(message);
    this.status = options?.status ?? 0;
    this.body = options?.body ?? null;
  }
}

class MockAiConfigurationError extends Error {}

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/lib/ai", () => ({
  requestChatCompletion: mockRequestChatCompletion,
  AiRequestError: MockAiRequestError,
  AiConfigurationError: MockAiConfigurationError,
}));

vi.mock("@/lib/prompts/adapt2lifeSystemPrompt", () => ({
  ADAPT2LIFE_SYSTEM_PROMPT: "SYSTEM_PROMPT",
}));

vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("@/db/schema", () => ({
  users: {},
  garminWebhookEvents: {},
}));

vi.mock("server-only", () => ({}));

const { POST } = await import("@/app/api/training-plan/route");

const buildRequest = (body?: Record<string, unknown>) =>
  new NextRequest("http://localhost/api/training-plan", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });

describe("POST /api/training-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
  });

  it("returns 401 when the stack session is missing", async () => {
    mockGetUser.mockResolvedValueOnce(null);

    const response = await POST(buildRequest());

    expect(response.status).toBe(401);
    expect(mockRequestChatCompletion).not.toHaveBeenCalled();
  });

  it("validates the payload before invoking the AI backend", async () => {
    mockGetUser.mockResolvedValueOnce({ id: "stack-user", displayName: "Test" });

    const response = await POST(
      buildRequest({
        goal: "",
        constraints: "",
        availability: "",
        preferences: "",
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("L’objectif est obligatoire");
    expect(mockRequestChatCompletion).not.toHaveBeenCalled();
  });
});
