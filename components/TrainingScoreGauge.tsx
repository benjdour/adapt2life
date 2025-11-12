"use client";

import Link from "next/link";
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
    return {
      status: "Niveau optimal, prêt à performer ⚡",
      trend: "up" as const,
    };
  }
  if (score >= 60) {
    return {
      status: "Énergie stable, adapte l’intensité 🔁",
      trend: "stable" as const,
    };
  }
  return {
    status: "Fatigue détectée, privilégie la récupération 🧘",
    trend: "down" as const,
  };
};

const TREND_DETAILS: Record<"up" | "stable" | "down", { label: string; tip: string }> = {
  up: { label: "En hausse", tip: "Profite de ta récupération optimale pour monter en charge." },
  stable: { label: "Stable", tip: "Maintiens l’équilibre en surveillant ton sommeil et ton stress." },
  down: { label: "En baisse", tip: "Allège l’intensité et concentre-toi sur la mobilité ou la récupération active." },
};

const SCORE_SUMMARY = [
  "Sommeil profond",
  "Variabilité cardiaque",
  "Charge d’entraînement",
  "Niveau de stress",
] as const;

const TrainingScoreGauge: FC<TrainingScoreGaugeProps> = ({ data }) => {
  const rawScore = useMemo(() => computeTrainingScore(data), [data]);
  const score = Math.min(100, Math.max(0, rawScore));
  const interpretation = interpretScore(score);
  const trendDetails = TREND_DETAILS[interpretation.trend];

  return (
    <Card className="w-full border-white/10 bg-card/80">
      <CardHeader className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Vue globale</p>
        <CardTitle>Capacité à s’entraîner aujourd’hui</CardTitle>
        <CardDescription>Calculée à partir des métriques de récupération, sommeil, stress et activités.</CardDescription>
      </CardHeader>
      <CardContent className="flex w-full flex-col gap-6 md:flex-row md:items-center">
        <div className="flex justify-center md:flex-none">
          <AIScoreGraph
            score={score}
            label="AI Training Score"
            trend={interpretation.trend}
            gradient={{ from: "#0068B5", to: "#2FBF71" }}
            size={220}
            thickness={18}
            className="border-none bg-transparent p-0 shadow-none"
          />
        </div>
        <div className="flex-1 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Statut</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{interpretation.status}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Tendance</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{trendDetails.label}</p>
              <p className="text-xs text-muted-foreground">{trendDetails.tip}</p>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              Basé sur&nbsp;: {SCORE_SUMMARY.join(", ")}.
            </div>
          </div>
          <Link
            href="/generateur-entrainement"
            className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Générer ma prochaine séance →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingScoreGauge;
