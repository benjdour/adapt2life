const TOOL_SUPPORTED_SPORTS = new Set([
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "YOGA",
  "PILATES",
]);

export const EXERCISE_TOOL_FEATURE_ENABLED = (process.env.GARMIN_EXERCISE_TOOL_ENABLED ?? "true").toLowerCase() !== "false";

export const shouldUseExerciseTool = (sport: string | null | undefined): boolean => {
  if (!sport) return false;
  return TOOL_SUPPORTED_SPORTS.has(sport.toUpperCase());
};

export type ExerciseToolSport = typeof TOOL_SUPPORTED_SPORTS extends Set<infer T> ? T : never;
