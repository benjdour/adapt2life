"use client";

import { FC, useMemo } from "react";

import { AIScoreGraph } from "@/components/ui/ai-score-graph";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeTrainingScore, type TrainingScoreData } from "@/lib/trainingScore";

export { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
export type { TrainingScoreData } from "@/lib/trainingScore";

type TrainingScoreGaugeProps = {
  data: TrainingScoreData;
};

const interpretScore = (score: number) => {
  if (score >= 80) {
    return { message: "Excellente journée pour s’entraîner 💪", trend: "up" as const };
  }
  if (score >= 60) {
    return { message: "Bonne condition, adapte l’intensité ⚡", trend: "stable" as const };
  }
  return { message: "Fatigue détectée, privilégie la récupération 🧘", trend: "down" as const };
};

const TrainingScoreGauge: FC<TrainingScoreGaugeProps> = ({ data }) => {
  const rawScore = useMemo(() => computeTrainingScore(data), [data]);
  const score = Math.min(100, Math.max(0, rawScore));
  const interpretation = interpretScore(score);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Capacité à s’entraîner aujourd’hui</CardTitle>
        <CardDescription>Calculée localement à partir des métriques de récupération, sommeil, stress et activités.</CardDescription>
      </CardHeader>
      <CardContent className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <AIScoreGraph
          score={score}
          label="AI Training Score"
          trend={interpretation.trend}
          gradient={{ from: "#0068B5", to: "#2FBF71" }}
          size={200}
          thickness={16}
        />
        <p className="max-w-sm text-center text-base text-muted-foreground sm:text-left">{interpretation.message}</p>
      </CardContent>
    </Card>
  );
};

export default TrainingScoreGauge;
