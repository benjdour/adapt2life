import { describe, expect, it } from "vitest";

import {
  convertStructuredPlanToGarmin,
  type StructuredPlanV1,
} from "@/lib/utils/structuredPlan";
import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

type WorkoutSegment = GarminTrainerWorkout["segments"][number];
type WorkoutStepUnion = NonNullable<WorkoutSegment["steps"]>[number];
type RepeatStep = Extract<WorkoutStepUnion, { type: "WorkoutRepeatStep" }>;
type SimpleStep = Extract<WorkoutStepUnion, { type: "WorkoutStep" }>;

describe("convertStructuredPlanToGarmin", () => {
  it("converts a structured cycling workout with repeats and cadence targets", () => {
    const plan: StructuredPlanV1 = {
      structuredPlanVersion: "1.0",
      sections: [
        {
          phase: "WARMUP",
          blocks: [
            {
              type: "single",
              label: "Échauffement progressif 10 min",
              intensity: "WARMUP",
              duration: { type: "TIME", value: 600 },
              targets: [
                {
                  type: "CADENCE",
                  low: 85,
                  high: 95,
                },
              ],
              notes: "Monter progressivement de Z1 à Z2 en restant fluide.",
            },
          ],
        },
        {
          phase: "MAIN",
          blocks: [
            {
              type: "repeat",
              label: "4 × 8 min tempo soutenu + 2 min récup",
              intensity: "ACTIVE",
              repeatCount: 4,
              steps: [
                {
                  type: "single",
                  role: "effort",
                  label: "8 min tempo soutenu",
                  intensity: "ACTIVE",
                  duration: { type: "TIME", value: 480 },
                  targets: [
                    {
                      type: "CADENCE",
                      low: 85,
                      high: 95,
                    },
                  ],
                  notes: "RPE 7-8/10; si FTP connu: ~88-92%; HR: Z3 élevé-Z4 bas; position aéro si sécuritaire.",
                },
                {
                  type: "single",
                  role: "rest",
                  label: "2 min récupération",
                  intensity: "REST",
                  duration: { type: "TIME", value: 120 },
                  targets: [
                    {
                      type: "CADENCE",
                      low: 75,
                      high: 85,
                    },
                  ],
                  notes: "Respiration qui revient; pédalage souple.",
                },
              ],
            },
          ],
        },
        {
          phase: "COOLDOWN",
          blocks: [
            {
              type: "single",
              label: "Retour au calme 10 min",
              intensity: "COOLDOWN",
              duration: { type: "TIME", value: 600 },
              targets: [
                {
                  type: "CADENCE",
                  low: 80,
                  high: 90,
                },
              ],
              notes: "Alléger le braquet; laisser la fréquence cardiaque redescendre.",
            },
          ],
        },
      ],
    };

    const humanDescription = [
      "🏋️‍♂️ Vélo – Endurance soutenue 60 min (Sweet Spot)",
      "Objectif principal : Construire l’endurance spécifique 70.3 et la tolérance au tempo",
      "Durée totale estimée : 60 min",
    ].join("\n");

    const workout = convertStructuredPlanToGarmin(plan, {
      ownerId: "owner",
      humanDescription,
      sportFallback: "CYCLING",
    });

    expect(workout.workoutName).toBe("🏋️‍♂️ Vélo – Endurance soutenue 60 min (Sweet Spot)");
    expect(workout.estimatedDurationInSecs).toBe(3600);
    expect(workout.sport).toBe("CYCLING");
    expect(workout.segments).toHaveLength(3);

    const warmupStep = workout.segments[0].steps?.[0];
    expect(warmupStep?.targetType).toBe("CADENCE");
    expect(warmupStep?.targetValueLow).toBe(85);
    expect(warmupStep?.targetValueHigh).toBe(95);

    const mainSegment = workout.segments[1];
    expect(mainSegment.estimatedDurationInSecs).toBe(2400);
    const repeatStep = mainSegment.steps?.[0] as RepeatStep;
    expect(repeatStep.type).toBe("WorkoutRepeatStep");
    expect(repeatStep.description).toBe("4 × 8 min tempo soutenu + 2 min récup");
    expect(repeatStep.repeatValue).toBe(4);

    const effortStep = repeatStep.steps?.[0] as SimpleStep;
    expect(effortStep.durationType).toBe("TIME");
    expect(effortStep.durationValue).toBe(480);
    expect(effortStep.targetType).toBe("CADENCE");
    expect(effortStep.targetValueLow).toBe(85);
    expect(effortStep.targetValueHigh).toBe(95);

    const restStep = repeatStep.steps?.[1] as SimpleStep;
    expect(restStep.durationType).toBe("FIXED_REST");
    expect(restStep.durationValue).toBe(120);
    expect(restStep.targetValueLow).toBe(75);
    expect(restStep.targetValueHigh).toBe(85);

    const cooldownStep = workout.segments[2].steps?.[0];
    expect(cooldownStep?.targetValueLow).toBe(80);
    expect(cooldownStep?.targetValueHigh).toBe(90);
  });
});
