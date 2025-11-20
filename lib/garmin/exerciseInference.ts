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

const PRIMARY_SPORT_HINTS: Array<{ sport: string; patterns: RegExp[] }> = [
  {
    sport: "LAP_SWIMMING",
    patterns: [/🏊/u, /natation/i, /swim/i, /piscine/i, /palme/i],
  },
  {
    sport: "CYCLING",
    patterns: [/🚴/u, /vélo/i, /velo/i, /bike/i, /cycling/i, /p[eé]dal/i, /gravel/i],
  },
  {
    sport: "RUNNING",
    patterns: [/🏃/u, /course/i, /running/i, /footing/i, /trail/i, /fractionn[eé]/i],
  },
  {
    sport: "STRENGTH_TRAINING",
    patterns: EXERCISE_SPORT_HINTS.STRENGTH_TRAINING,
  },
  {
    sport: "CARDIO_TRAINING",
    patterns: EXERCISE_SPORT_HINTS.CARDIO_TRAINING,
  },
  {
    sport: "YOGA",
    patterns: EXERCISE_SPORT_HINTS.YOGA,
  },
  {
    sport: "PILATES",
    patterns: EXERCISE_SPORT_HINTS.PILATES,
  },
];

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

export const isFallbackExerciseSportsList = (sports: GarminExerciseSport[] | null | undefined): boolean => {
  if (!sports || sports.length === 0) {
    return true;
  }
  const fallback = getFallbackExerciseSports();
  if (sports.length !== fallback.length) {
    return false;
  }
  const fallbackSet = new Set(fallback);
  return sports.every((sport) => fallbackSet.has(sport));
};

export const inferPrimarySportFromMarkdown = (markdown: string | null | undefined): string | null => {
  if (!markdown) {
    return null;
  }

  for (const { sport, patterns } of PRIMARY_SPORT_HINTS) {
    if (patterns.some((pattern) => pattern.test(markdown))) {
      return sport;
    }
  }

  return null;
};
