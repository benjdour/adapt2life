import { describe, expect, it } from "vitest";

import {
  describeExerciseForUser,
  getGarminExerciseCategoryLabel,
  getGarminExerciseLabel,
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
});
