// Utility helpers to compute a local training readiness score from Garmin metrics.

export type TrainingScoreData = {
  sleepScore?: number | null;
  bodyBattery?: {
    charged?: number | null;
    spent?: number | null;
  } | null;
  stressAverage?: number | null;
  steps?: number | null;
  hrv?: number | null;
  avgHR?: number | null;
};

const clamp100 = (value: number) => Math.min(100, Math.max(0, value));

const toNumberOr = (value: number | null | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const computeTrainingScore = (data: TrainingScoreData): number => {
  const normalizeBodyBattery = (bodyBattery: TrainingScoreData["bodyBattery"]): number => {
    if (!bodyBattery) return 50;
    const charged = toNumberOr(bodyBattery.charged, 0);
    const spent = toNumberOr(bodyBattery.spent, 0);
    const net = charged - spent;
    return clamp100(net + 50);
  };

  const sleepScore = clamp100(toNumberOr(data.sleepScore, 70));
  const bodyBatteryScore = normalizeBodyBattery(data.bodyBattery ?? null);
  const recovery = 0.35 * ((sleepScore * 0.6 + bodyBatteryScore) / 2);

  const stressAverage = clamp100(toNumberOr(data.stressAverage, 40));
  const stress = 0.25 * (100 - stressAverage);

  const steps = toNumberOr(data.steps, 6000);
  const activity = 0.15 * (steps < 3000 ? 85 : 65);

  const hrv = toNumberOr(data.hrv, 45);
  const physio = 0.15 * (hrv > 50 ? 85 : 70);

  const avgHR = toNumberOr(data.avgHR, 75);
  const postActivity = 0.1 * (avgHR < 75 ? 85 : 70);

  const total = recovery + stress + activity + physio + postActivity;
  return Math.round(clamp100(total));
};

export const mockGarminData = (): TrainingScoreData => ({
  sleepScore: 80,
  bodyBattery: { charged: 50, spent: 20 },
  stressAverage: 30,
  steps: 4000,
  hrv: 55,
  avgHR: 70,
});
