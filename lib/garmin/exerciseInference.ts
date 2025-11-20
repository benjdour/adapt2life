import type { GarminExerciseSport } from "@/constants/garminExerciseData";

const FALLBACK_EXERCISE_SPORTS: GarminExerciseSport[] = [
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "YOGA",
  "PILATES",
];

const EXERCISE_SPORT_HINTS: Record<GarminExerciseSport, RegExp[]> = {
  STRENGTH_TRAINING: [
    /muscu/i,
    /musculation/i,
    /force/i,
    /full\s*body/i,
    /halt[eè]re/i,
    /renfo/i,
    /crossfit/i,
    /wod/i,
    /hiit/i,
    /💪/u,
    /🏋/u,
  ],
  CARDIO_TRAINING: [/hiit/i, /cardio/i, /metcon/i, /circuit/i, /interval/i, /tabata/i, /🔥/u],
  YOGA: [/yoga/i, /🧘/u, /flow/i],
  PILATES: [/pilates/i],
};

export const inferExerciseSportsFromMarkdown = (markdown: string): GarminExerciseSport[] => {
  const normalized = markdown?.toString()?.toLowerCase() ?? "";
  const matches = new Set<GarminExerciseSport>();

  (Object.entries(EXERCISE_SPORT_HINTS) as [GarminExerciseSport, RegExp[]][]).forEach(([sport, patterns]) => {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      matches.add(sport);
    }
  });

  return matches.size > 0 ? Array.from(matches) : [...FALLBACK_EXERCISE_SPORTS];
};

export const getFallbackExerciseSports = (): GarminExerciseSport[] => [...FALLBACK_EXERCISE_SPORTS];
