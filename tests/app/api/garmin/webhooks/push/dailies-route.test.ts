import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const webhookValuesMock = vi.fn();
const dailyValuesMock = vi.fn();
const onConflictMock = vi.fn();
const mockDbInsert = vi.fn();
const mockVerifySignature = vi.fn();
const mockFetchConnection = vi.fn();
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mockCreateLogger = vi.fn(() => mockLogger);

const mockGarminWebhookEvents = {};
const mockGarminDailySummaries = { summaryId: Symbol("summaryId") };

vi.mock("@/db", () => ({
  db: {
    insert: mockDbInsert,
  },
}));

vi.mock("@/db/schema", () => ({
  garminWebhookEvents: mockGarminWebhookEvents,
  garminDailySummaries: mockGarminDailySummaries,
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

const { POST } = await import("@/app/api/garmin/webhooks/push/dailies/route");

const buildRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/garmin/webhooks/push/dailies", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
    },
  });

describe("POST /api/garmin/webhooks/push/dailies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySignature.mockReturnValue({ valid: true });
    webhookValuesMock.mockResolvedValue(undefined);
    onConflictMock.mockResolvedValue(undefined);
    dailyValuesMock.mockImplementation(() => ({
      onConflictDoUpdate: onConflictMock,
    }));
    mockDbInsert.mockImplementation((table) => {
      if (table === mockGarminWebhookEvents) {
        return { values: webhookValuesMock };
      }
      if (table === mockGarminDailySummaries) {
        return { values: dailyValuesMock };
      }
      throw new Error("Unknown table");
    });
  });

  it("rejects invalid signatures", async () => {
    mockVerifySignature.mockReturnValueOnce({ valid: false, reason: "signature mismatch" });

    const response = await POST(buildRequest({ dailies: [] }));

    expect(response.status).toBe(401);
    expect(webhookValuesMock).not.toHaveBeenCalled();
  });

  it("persists webhook and summary entries when the payload is valid", async () => {
    mockFetchConnection.mockResolvedValue({ userId: 7 });

    const response = await POST(
      buildRequest({
        dailies: [
          {
            userId: "garmin-u1",
            summaryId: "sum-1",
            steps: 1234,
          },
        ],
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: 1, processed: 1 });
    expect(webhookValuesMock).toHaveBeenCalledWith({
      userId: 7,
      garminUserId: "garmin-u1",
      type: "dailies",
      entityId: "sum-1",
      payload: { userId: "garmin-u1", summaryId: "sum-1", steps: 1234 },
    });
    expect(dailyValuesMock).toHaveBeenCalled();
    expect(onConflictMock).toHaveBeenCalled();
  });
});
