// Utility helpers to compute a local training readiness score from Garmin metrics.

export type TrainingScoreData = {
  bodyBatteryLevel?: number | null;
  sleepScore?: number | null;
  sleepDurationSeconds?: number | null;
  stressAverage?: number | null;
  hrvAverage?: number | null;
  restingHeartRate?: number | null;
  steps?: number | null;
  activeMinutes?: number | null;
  totalKilocalories?: number | null;
  spo2Average?: number | null;
  skinTempDeviation?: number | null;
  bodyHydrationPercent?: number | null;
  lastActivityStart?: number | null;
  lastActivityDuration?: number | null;
  lastActivityCalories?: number | null;
  nowSeconds?: number | null;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const normalizeRange = (value: number | null | undefined, min: number, max: number) => {
  if (value === null || value === undefined) return null;
  if (max === min) return null;
  return clamp((value - min) / (max - min));
};

const inverseNormalizeRange = (value: number | null | undefined, min: number, max: number) => {
  const normalized = normalizeRange(value, min, max);
  return normalized === null ? null : 1 - normalized;
};

const average = (values: Array<number | null>) => {
  const filtered = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (filtered.length === 0) return null;
  return filtered.reduce((total, current) => total + current, 0) / filtered.length;
};

export const computeTrainingScore = (data: TrainingScoreData): number => {
  // Récupération & énergie — pondération 35 %
  const recoveryBodyBattery = normalizeRange(data.bodyBatteryLevel ?? null, 30, 100);
  const recoverySleepScore = normalizeRange(data.sleepScore ?? null, 50, 100);
  const sleepDurationHours =
    data.sleepDurationSeconds !== null && data.sleepDurationSeconds !== undefined
      ? data.sleepDurationSeconds / 3600
      : null;
  const recoverySleepDuration = sleepDurationHours !== null ? clamp((sleepDurationHours - 5.5) / 2.5) : null;
  const recoveryScore = average([recoveryBodyBattery, recoverySleepScore, recoverySleepDuration]) ?? 0.6;

  // Stress & système nerveux — pondération 25 %
  const stressScore = inverseNormalizeRange(data.stressAverage ?? null, 20, 85);
  const hrvScore = normalizeRange(data.hrvAverage ?? null, 25, 90);
  const restingHrScore = inverseNormalizeRange(data.restingHeartRate ?? null, 50, 85);
  const stressComposite = average([stressScore, hrvScore, restingHrScore]) ?? 0.5;

  // Activité actuelle — pondération 15 %
  const stepsScore = inverseNormalizeRange(data.steps ?? null, 4000, 12000);
  const activeMinutesScore = inverseNormalizeRange(data.activeMinutes ?? null, 60, 180);
  const activityCaloriesScore = inverseNormalizeRange(data.totalKilocalories ?? null, 2000, 3200);
  const activityComposite = average([stepsScore, activeMinutesScore, activityCaloriesScore]) ?? 0.5;

  // Physiologie — pondération 15 %
  const spo2Score = normalizeRange(data.spo2Average ?? null, 93, 99);
  const skinTempScore =
    data.skinTempDeviation !== null && data.skinTempDeviation !== undefined
      ? clamp(1 - Math.abs(data.skinTempDeviation) / 1.5)
      : null;
  const hydrationScore = normalizeRange(data.bodyHydrationPercent ?? null, 48, 60);
  const physiologyComposite = average([spo2Score, skinTempScore, hydrationScore]) ?? 0.5;

  // Dernière activité — pondération 10 %
  const nowSeconds = data.nowSeconds ?? Math.floor(Date.now() / 1000);
  const lastActivityStart = data.lastActivityStart ?? null;
  const lastActivityDuration = data.lastActivityDuration ?? null;
  const lastActivityCalories = data.lastActivityCalories ?? null;
  let lastActivityScore: number | null = null;

  if (lastActivityStart !== null) {
    const hoursSinceActivity = (nowSeconds - lastActivityStart) / 3600;
    const durationMinutes = lastActivityDuration !== null ? lastActivityDuration / 60 : null;
    const caloriesPerMinute =
      lastActivityCalories !== null && durationMinutes !== null && durationMinutes > 0
        ? lastActivityCalories / durationMinutes
        : null;

    const recencyScore =
      hoursSinceActivity <= 4
        ? 0.4
        : hoursSinceActivity <= 12
          ? 0.6
          : hoursSinceActivity <= 36
            ? 0.85
            : 0.65;
    const durationScore = durationMinutes !== null ? inverseNormalizeRange(durationMinutes, 45, 120) : null;
    const intensityScore = inverseNormalizeRange(caloriesPerMinute, 8, 15);

    lastActivityScore = average([recencyScore, durationScore, intensityScore]) ?? recencyScore;
  }

  if (lastActivityScore === null) {
    lastActivityScore = 0.7;
  }

  const score =
    recoveryScore * 0.35 +
    stressComposite * 0.25 +
    activityComposite * 0.15 +
    physiologyComposite * 0.15 +
    lastActivityScore * 0.1;

  return Math.round(clamp(score) * 100);
};

export const mockGarminData = (): TrainingScoreData => ({
  bodyBatteryLevel: 78,
  sleepScore: 82,
  sleepDurationSeconds: 7.5 * 3600,
  stressAverage: 32,
  hrvAverage: 55,
  restingHeartRate: 58,
  steps: 5200,
  activeMinutes: 74,
  totalKilocalories: 2450,
  spo2Average: 96,
  skinTempDeviation: 0.2,
  bodyHydrationPercent: 54,
  lastActivityStart: Math.floor(Date.now() / 1000) - 18 * 3600,
  lastActivityDuration: 3600,
  lastActivityCalories: 650,
  nowSeconds: Math.floor(Date.now() / 1000),
});

