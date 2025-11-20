import { describe, expect, it } from "vitest";

import {
  describeExerciseForUser,
  getGarminExerciseCategoryLabel,
  getGarminExerciseLabel,
  buildGarminExerciseCatalogSnippet,
} from "@/lib/garminExercises";

describe("garminExercises localization helpers", () => {
  it("localizes known exercise names into French", () => {
    expect(getGarminExerciseLabel("PUSH_UPS")).toBe("Pompes");
  });

  it("falls back to english-style title case when locale is unsupported", () => {
    expect(getGarminExerciseLabel("SINGLE_ARM_ROW", "es" as never)).toBe("Single Arm Row");
  });

  it("formats categories using dedicated translations when available", () => {
    expect(getGarminExerciseCategoryLabel("BANDED_EXERCISES")).toBe("Exercices avec élastique");
  });

  it("builds a combined description when both category and name are provided", () => {
    expect(
      describeExerciseForUser(
        {
          sport: "STRENGTH_TRAINING",
          category: "BENCH_PRESS",
          name: "BARBELL_BENCH_PRESS",
        },
        "fr",
      ),
    ).toBe("Développé couché barre — développé couché");
  });

  it("builds a catalog snippet limited to the requested sports", () => {
    const snippet = buildGarminExerciseCatalogSnippet({ sports: ["YOGA"], maxChars: 1_000 });
    expect(snippet).toContain("SPORT YOGA");
    expect(snippet).not.toContain("SPORT STRENGTH_TRAINING");
  });

  it("truncates the catalog when exceeding the max char limit", () => {
    const snippet = buildGarminExerciseCatalogSnippet({ sports: ["STRENGTH_TRAINING"], maxChars: 200 });
    expect(snippet).toContain("SPORT STRENGTH_TRAINING");
    expect(snippet).toContain("…catalogue tronqué");
  });
});
