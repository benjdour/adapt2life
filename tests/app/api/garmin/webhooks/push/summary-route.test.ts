import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockDbInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockFetchConnection = vi.fn();
const mockVerifySignature = vi.fn();
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mockCreateLogger = vi.fn(() => mockLogger);

vi.mock("@/db", () => ({
  db: {
    insert: mockDbInsert,
  },
}));

const mockGarminWebhookEvents = {};

vi.mock("@/db/schema", () => ({
  garminWebhookEvents: mockGarminWebhookEvents,
}));

vi.mock("@/lib/services/garmin-connections", () => ({
  fetchGarminConnectionByGarminUserId: mockFetchConnection,
}));

vi.mock("@/lib/security/garminSignature", () => ({
  verifyGarminSignature: mockVerifySignature,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: mockCreateLogger,
}));

const { POST } = await import("@/app/api/garmin/webhooks/push/[summaryType]/route");

const buildRequest = (summaryType: string, body: unknown) =>
  new NextRequest(`http://localhost/api/garmin/webhooks/push/${summaryType}`, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
    },
  });

describe("POST /api/garmin/webhooks/push/[summaryType]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbInsert.mockReturnValue({ values: mockInsertValues });
    mockVerifySignature.mockReturnValue({ valid: true });
    mockInsertValues.mockResolvedValue(undefined);
  });

  it("returns 404 for unsupported summary types", async () => {
    const response = await POST(buildRequest("unknown", {}), { params: Promise.resolve({ summaryType: "unknown" }) });
    expect(response.status).toBe(404);
    expect(mockVerifySignature).not.toHaveBeenCalled();
  });

  it("rejects invalid Garmin signatures", async () => {
    mockVerifySignature.mockReturnValueOnce({ valid: false, reason: "signature mismatch" });

    const response = await POST(buildRequest("activities", { activities: [] }), {
      params: Promise.resolve({ summaryType: "activities" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Invalid signature" });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("stores webhook entries when the signature and connection are valid", async () => {
    mockFetchConnection.mockResolvedValueOnce({ userId: 99 });

    const request = buildRequest("activities", {
      activities: [
        { userId: "garmin-user", summaryId: "activity-1", calories: 320 },
      ],
    });

    const response = await POST(request, { params: Promise.resolve({ summaryType: "activities" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: 1, processed: 1 });
    expect(mockInsertValues).toHaveBeenCalledTimes(1);
    expect(mockInsertValues).toHaveBeenCalledWith({
      userId: 99,
      garminUserId: "garmin-user",
      type: "activities",
      entityId: "activity-1",
      payload: { userId: "garmin-user", summaryId: "activity-1", calories: 320 },
    });
  });
});
