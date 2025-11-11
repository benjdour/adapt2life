// Utility helpers to compute a local training readiness score from Garmin metrics.

export type TrainingScoreData = {
  bodyBattery?: {
    current?: number | null;
    charged?: number | null;
    drained?: number | null;
  } | null;
  sleep?: {
    score?: number | null;
    durationHours?: number | null;
    deepHours?: number | null;
    remHours?: number | null;
    lightHours?: number | null;
  } | null;
  rhr?: number | null;
  stress?: {
    average?: number | null;
    lowMin?: number | null;
    mediumMin?: number | null;
    highMin?: number | null;
  } | null;
  hrv?: number | null;
  steps?: number | null;
  activeMinutes?: number | null;
  totalCalories?: number | null;
  lastActivity?: {
    durationMin?: number | null;
    avgHr?: number | null;
    calories?: number | null;
    type?: string | null;
  } | null;
  recentActivities?: Array<{
    durationMin?: number | null;
    avgHr?: number | null;
    calories?: number | null;
    timestampMs?: number | null;
  }> | null;
  physio?: {
    spo2?: number | null;
    tempDelta?: number | null;
    respiration?: number | null;
    hydrationPercent?: number | null;
  } | null;
  female?: {
    currentPhaseType?: "MENSTRUAL" | "FOLLICULAR" | "OVULATION" | "LUTEAL" | null;
  } | null;
  baselines?: {
    hrv?: number | null;
    rhr?: number | null;
  } | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const valueOr = (value: number | null | undefined, fallback: number): number =>
  isFiniteNumber(value) ? value : fallback;

const norm = (x: number, a: number, b: number): number | null => {
  if (!Number.isFinite(x) || !Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const clamped = clamp(x, min, max);
  const ratio = (clamped - a) / (b - a);
  return clamp(ratio * 100, 0, 100);
};

const inv = (x: number, a: number, b: number): number | null => {
  const normalized = norm(x, a, b);
  return normalized === null ? null : 100 - normalized;
};

const distToRange = (x: number, lo: number, hi: number): number | null => {
  if (!Number.isFinite(x) || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  const min = Math.min(lo, hi);
  const max = Math.max(lo, hi);
  if (x < min) return min - x;
  if (x > max) return x - max;
  return 0;
};

const NEUTRAL_SCORE = 60;

const applyFemaleModifier = (score: number, phase: TrainingScoreData["female"]): number => {
  const phaseType = phase?.currentPhaseType ?? null;
  const factor =
    phaseType === "MENSTRUAL"
      ? 0.8
      : phaseType === "FOLLICULAR"
        ? 1.1
        : phaseType === "OVULATION"
          ? 1.05
          : phaseType === "LUTEAL"
            ? 0.9
            : 1;
  return clamp(score * factor, 0, 100);
};

export const computeTrainingScore = (snapshot: TrainingScoreData): number => {
  let energyScore = NEUTRAL_SCORE;
  if (snapshot.bodyBattery) {
    const current = clamp(valueOr(snapshot.bodyBattery.current, 60), 0, 100);
    const charged = valueOr(snapshot.bodyBattery.charged, 25);
    const drained = valueOr(snapshot.bodyBattery.drained, 25);
    const delta = clamp(charged - drained, -50, 50);
    const deltaScore = norm(delta, -50, 50) ?? NEUTRAL_SCORE;
    energyScore = 0.7 * current + 0.3 * deltaScore;
  }

  let recoveryScore = NEUTRAL_SCORE;
  if (snapshot.sleep) {
    const sleepScore = clamp(valueOr(snapshot.sleep.score, 75), 0, 100);
    const durationHours = valueOr(snapshot.sleep.durationHours, 7.5);
    const totalSleepHours = Math.max(durationHours, 0.1);
    const durationComponent =
      durationHours < 7.5
        ? norm(durationHours, 5.0, 7.5) ?? NEUTRAL_SCORE
        : durationHours <= 9.0
          ? 100
          : inv(durationHours, 9.0, 10.5) ?? NEUTRAL_SCORE;

    const deepHours = valueOr(snapshot.sleep.deepHours, durationHours * 0.2);
    const remHours = valueOr(snapshot.sleep.remHours, durationHours * 0.22);
    const deepRatio = clamp(deepHours / totalSleepHours, 0, 1);
    const remRatio = clamp(remHours / totalSleepHours, 0, 1);
    const deepComponent = inv(Math.abs(deepRatio - 0.2), 0, 0.2) ?? NEUTRAL_SCORE;
    const remComponent = inv(Math.abs(remRatio - 0.22), 0, 0.22) ?? NEUTRAL_SCORE;

    recoveryScore =
      0.6 * sleepScore + 0.25 * durationComponent + 0.1 * deepComponent + 0.05 * remComponent;
  }

  const baselineHrv = Math.max(valueOr(snapshot.baselines?.hrv, 60), 30);
  const hrvValue = clamp(valueOr(snapshot.hrv, baselineHrv), baselineHrv * 0.4, baselineHrv * 1.6);
  const hrvRatio = hrvValue / baselineHrv;
  const hrvComponent = norm(hrvRatio, 0.8, 1.2) ?? NEUTRAL_SCORE;

  const baselineRhr = Math.max(valueOr(snapshot.baselines?.rhr, 55), 35);
  const restingHr = clamp(valueOr(snapshot.rhr, baselineRhr), 30, 120);
  const rhrDelta = clamp(restingHr - baselineRhr, 0, 15);
  const rhrComponent = inv(rhrDelta, 0, 10) ?? NEUTRAL_SCORE;

  const stressAverage = clamp(valueOr(snapshot.stress?.average, 40), 0, 100);
  const stressComponent = 100 - stressAverage;
  const stressHighMinutes = clamp(valueOr(snapshot.stress?.highMin, 20), 0, 120);
  const stressHighComponent = inv(stressHighMinutes, 0, 60) ?? NEUTRAL_SCORE;

  const ansScore =
    0.4 * hrvComponent + 0.25 * rhrComponent + 0.25 * stressComponent + 0.1 * stressHighComponent;

  const hasLastActivity =
    isFiniteNumber(snapshot.lastActivity?.durationMin) ||
    isFiniteNumber(snapshot.lastActivity?.avgHr) ||
    isFiniteNumber(snapshot.lastActivity?.calories);
  const fallbackDuration = hasLastActivity ? valueOr(snapshot.lastActivity?.durationMin, 45) : 45;
  const fallbackHr = hasLastActivity ? valueOr(snapshot.lastActivity?.avgHr, 135) : 135;
  const fallbackCalories = hasLastActivity ? valueOr(snapshot.lastActivity?.calories, 500) : 500;

  const restHrForLoad = clamp(valueOr(snapshot.rhr ?? snapshot.baselines?.rhr, baselineRhr), 35, 90);
  const sessionsFromRecent =
    snapshot.recentActivities && Array.isArray(snapshot.recentActivities)
      ? snapshot.recentActivities.filter(Boolean)
      : [];
  const fallbackSessions =
    sessionsFromRecent.length === 0 && hasLastActivity
      ? [
          {
            durationMin: snapshot.lastActivity?.durationMin ?? null,
            avgHr: snapshot.lastActivity?.avgHr ?? null,
            calories: snapshot.lastActivity?.calories ?? null,
            timestampMs: null,
          },
        ]
      : [];
  const sessionsForLoad =
    sessionsFromRecent.length > 0 ? sessionsFromRecent : fallbackSessions;

  const computeSessionLoad = (
    session: NonNullable<TrainingScoreData["recentActivities"]>[number],
  ): number | null => {
    const duration = session?.durationMin;
    if (!isFiniteNumber(duration) || duration <= 0) {
      return null;
    }
    const maxHrEstimate = 190;
    const avgHrValue = session?.avgHr;
    let hrReserve: number | null = isFiniteNumber(avgHrValue)
      ? clamp(((avgHrValue as number) - restHrForLoad) / (maxHrEstimate - restHrForLoad), 0, 1.1)
      : null;

    if (hrReserve === null) {
      const calories = session?.calories;
      if (isFiniteNumber(calories) && duration > 0) {
        const caloriesPerMinute = calories / duration;
        hrReserve = clamp((caloriesPerMinute - 4) / 8, 0.05, 0.95);
      }
    }

    if (hrReserve === null) {
      hrReserve = clamp(duration / 120, 0.1, 0.7);
    }

    const intensityFactor = 0.64 * hrReserve * Math.exp(1.92 * hrReserve);
    return duration * intensityFactor;
  };

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const now = Date.now();
  const acuteLoad = sessionsForLoad.reduce((sum, session, index) => {
    const sessionLoad = computeSessionLoad(session);
    if (sessionLoad === null) {
      return sum;
    }
    const timestamp = session?.timestampMs;
    const daysAgo =
      typeof timestamp === "number" && Number.isFinite(timestamp)
        ? Math.max((now - timestamp) / MS_PER_DAY, 0)
        : index;
    const decay = Math.exp(-Math.max(daysAgo, 0) / 7); // ~1-week time constant
    return sum + sessionLoad * decay;
  }, 0);

  let loadScore: number;
  if (sessionsForLoad.length > 0) {
    loadScore = inv(acuteLoad, 80, 450) ?? NEUTRAL_SCORE;
  } else {
    const intensityDuration = norm(fallbackDuration, 0, 90) ?? NEUTRAL_SCORE;
    const intensityHeartRate = norm(fallbackHr, 80, 170) ?? NEUTRAL_SCORE;
    const intensityCalories = norm(fallbackCalories, 0, 900) ?? NEUTRAL_SCORE;
    const intensityScore =
      0.5 * intensityDuration + 0.3 * intensityHeartRate + 0.2 * intensityCalories;
    loadScore = 100 - intensityScore;
  }

  const hasSpo2 = snapshot.physio ? isFiniteNumber(snapshot.physio.spo2 ?? null) : false;
  const spo2 = hasSpo2 ? clamp(snapshot.physio?.spo2 ?? 0, 90, 100) : 97;
  const spo2Component = hasSpo2 ? norm(spo2, 95, 100) ?? NEUTRAL_SCORE : NEUTRAL_SCORE;

  const hasTemperature = snapshot.physio ? isFiniteNumber(snapshot.physio.tempDelta ?? null) : false;
  const temperatureDelta = hasTemperature ? clamp(Math.abs(snapshot.physio?.tempDelta ?? 0), 0, 1) : 0.2;
  const temperatureComponent =
    hasTemperature ? inv(temperatureDelta, 0, 0.5) ?? NEUTRAL_SCORE : NEUTRAL_SCORE;

  const hasRespiration = snapshot.physio ? isFiniteNumber(snapshot.physio.respiration ?? null) : false;
  const respirationValue = hasRespiration ? snapshot.physio?.respiration ?? 0 : null;
  const respirationDistance =
    respirationValue !== null ? distToRange(respirationValue, 12, 18) : null;
  const respirationComponent =
    respirationDistance === null ? NEUTRAL_SCORE : inv(respirationDistance, 0, 6) ?? NEUTRAL_SCORE;

  const physioScore = 0.5 * spo2Component + 0.3 * temperatureComponent + 0.2 * respirationComponent;

  const hasHydration = snapshot.physio ? isFiniteNumber(snapshot.physio.hydrationPercent ?? null) : false;
  const hydrationPercent = hasHydration ? snapshot.physio?.hydrationPercent ?? 0 : 58;
  const hydrationScore = hasHydration
    ? hydrationPercent < 55
      ? norm(hydrationPercent, 45, 55) ?? NEUTRAL_SCORE
      : hydrationPercent <= 60
        ? 100
        : inv(hydrationPercent, 60, 65) ?? NEUTRAL_SCORE
    : NEUTRAL_SCORE;

  const hasSteps = isFiniteNumber(snapshot.steps);
  const hasActiveMinutes = isFiniteNumber(snapshot.activeMinutes);
  const stepsScore = hasSteps ? norm(snapshot.steps ?? 0, 0, 10000) ?? NEUTRAL_SCORE : NEUTRAL_SCORE;
  const minutesScore = hasActiveMinutes
    ? norm(snapshot.activeMinutes ?? 0, 0, 60) ?? NEUTRAL_SCORE
    : NEUTRAL_SCORE;
  const movementScore = 0.6 * stepsScore + 0.4 * minutesScore;

  const baseScore =
    0.25 * energyScore +
    0.2 * recoveryScore +
    0.25 * ansScore +
    0.1 * loadScore +
    0.1 * physioScore +
    0.05 * hydrationScore +
    0.05 * movementScore;

  const readiness = applyFemaleModifier(baseScore, snapshot.female);
  return Math.round(clamp(readiness, 0, 100));
};

export const mockGarminData = (): TrainingScoreData => ({
  bodyBattery: { current: 68, charged: 45, drained: 25 },
  sleep: {
    score: 82,
    durationHours: 7.6,
    deepHours: 1.5,
    remHours: 1.6,
    lightHours: 4.3,
  },
  rhr: 56,
  stress: { average: 32, lowMin: 320, mediumMin: 180, highMin: 45 },
  hrv: 65,
  steps: 8500,
  activeMinutes: 52,
  totalCalories: 2550,
  lastActivity: { durationMin: 48, avgHr: 138, calories: 620, type: "RUN" },
  recentActivities: [
    {
      durationMin: 48,
      avgHr: 138,
      calories: 620,
      timestampMs: Date.now() - 1000 * 60 * 60 * 18,
    },
    {
      durationMin: 35,
      avgHr: 132,
      calories: 450,
      timestampMs: Date.now() - 1000 * 60 * 60 * 42,
    },
    {
      durationMin: 60,
      avgHr: 150,
      calories: 780,
      timestampMs: Date.now() - 1000 * 60 * 60 * 70,
    },
  ],
  physio: { spo2: 97.8, tempDelta: 0.15, respiration: 15.5, hydrationPercent: 58 },
  female: { currentPhaseType: "FOLLICULAR" },
  baselines: { hrv: 62, rhr: 55 },
});
