import { describe, expect, it } from "vitest";

import { computeWomenHealthPullPlan } from "@/lib/services/garmin-women-health-pull";

describe("computeWomenHealthPullPlan", () => {
  it("uses the default lookback window when no cursor exists", () => {
    const now = new Date("2024-01-02T00:00:00Z");
    const lookbackSeconds = 3600;
    const chunkSeconds = 900;

    const plan = computeWomenHealthPullPlan(null, now, {
      lookbackSeconds,
      bufferSeconds: 0,
      chunkSeconds,
    });

    const nowSeconds = Math.floor(now.getTime() / 1000);
    expect(plan.ranges.length).toBe(lookbackSeconds / chunkSeconds);
    expect(plan.ranges[0]).toEqual({ start: nowSeconds - lookbackSeconds, end: nowSeconds - lookbackSeconds + chunkSeconds });
    expect(plan.ranges.at(-1)?.end).toBe(nowSeconds);
  });

  it("applies the safety buffer when a cursor is stored", () => {
    const now = new Date("2024-01-02T00:00:00Z");
    const lastUpload = new Date("2024-01-01T22:00:00Z");
    const bufferSeconds = 1800; // 30 minutes

    const plan = computeWomenHealthPullPlan(lastUpload, now, {
      lookbackSeconds: 60 * 60 * 6,
      bufferSeconds,
      chunkSeconds: 60 * 30,
    });

    const expectedStart = Math.floor(lastUpload.getTime() / 1000) - bufferSeconds;
    expect(plan.ranges[0]?.start).toBe(expectedStart);
  });

  it("chunks long windows to stay under the configured maximum", () => {
    const now = new Date("2024-01-10T00:00:00Z");
    const lookbackSeconds = 60 * 60 * 24 * 3; // 3 jours
    const chunkSeconds = 60 * 60; // 1 heure

    const plan = computeWomenHealthPullPlan(null, now, {
      lookbackSeconds,
      bufferSeconds: 0,
      chunkSeconds,
    });

    expect(plan.ranges.length).toBe(lookbackSeconds / chunkSeconds);
    expect(plan.ranges.every((range) => range.end - range.start <= chunkSeconds)).toBe(true);
  });
});
