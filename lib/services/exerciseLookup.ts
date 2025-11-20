import { GARMIN_EXERCISE_DATA } from "@/constants/garminExerciseData";

export type ExerciseLookupResult = {
  sport: keyof typeof GARMIN_EXERCISE_DATA;
  exerciseCategory: string;
  exerciseName: string;
  label: string;
};

const normalize = (value: string | null | undefined): string =>
  (value ?? "").normalize("NFD").replace(/[^\p{Letter}\p{Number}]+/gu, " ").trim().toLowerCase();

export const searchGarminExercises = (query: string, opts?: { sport?: string | null; limit?: number }): ExerciseLookupResult[] => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const limit = Math.max(1, opts?.limit ?? 10);
  const results: ExerciseLookupResult[] = [];

  (Object.entries(GARMIN_EXERCISE_DATA) as [keyof typeof GARMIN_EXERCISE_DATA, { category: string; name: string }[]][]).forEach(
    ([sport, exercises]) => {
      if (opts?.sport && normalize(opts.sport) !== normalize(sport)) {
        return;
      }
      exercises.forEach(({ category, name }) => {
        const haystack = normalize(`${category} ${name}`);
        if (haystack.includes(normalizedQuery) && results.length < limit) {
          results.push({
            sport,
            exerciseCategory: category,
            exerciseName: name,
            label: `${sport} • ${category} • ${name}`,
          });
        }
      });
    },
  );

  return results;
};
