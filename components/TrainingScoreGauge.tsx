"use client";

import { FC, useMemo } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { computeTrainingScore, type TrainingScoreData } from "@/lib/trainingScore";

export { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
export type { TrainingScoreData } from "@/lib/trainingScore";

type TrainingScoreGaugeProps = {
  data: TrainingScoreData;
};

const getInterpretationMessage = (score: number): string => {
  if (score > 80) return "Excellente journée pour s’entraîner 💪";
  if (score > 60) return "Bonne condition, adapte l’intensité ⚡";
  return "Fatigue détectée, mise sur la récupération 🧘";
};

const TrainingScoreGauge: FC<TrainingScoreGaugeProps> = ({ data }) => {
  const rawScore = useMemo(() => computeTrainingScore(data), [data]);
  const score = Math.min(100, Math.max(0, rawScore));
  const message = getInterpretationMessage(score);

  return (
    <section className="mx-auto mb-5 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold uppercase tracking-wide text-white/60">Capacité à s’entraîner aujourd’hui</h2>
          <p className="mt-1 text-sm text-white/70">Calculé localement à partir des données de récupération, stress et activités.</p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <div className="h-32 w-32">
            <CircularProgressbar
              value={score}
              maxValue={100}
              minValue={0}
              text={`${score}`}
              styles={buildStyles({
                textSize: "20px",
                textColor: "#ffffff",
                pathColor: score >= 80 ? "#34d399" : score >= 60 ? "#f59e0b" : "#f87171",
                trailColor: "#1f2937",
              })}
            />
          </div>
          <p className="max-w-xs text-center text-base font-medium text-white sm:text-left">{message}</p>
        </div>
      </div>
    </section>
  );
};

export default TrainingScoreGauge;
