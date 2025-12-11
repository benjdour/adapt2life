"use client";

import { FC, useMemo } from "react";

import { AIScoreGraph } from "@/components/ui/ai-score-graph";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeTrainingScore, type TrainingScoreData } from "@/lib/trainingScore";

export { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
export type { TrainingScoreData } from "@/lib/trainingScore";

export type TrainingScoreGaugeCopy = {
  tag: string;
  title: string;
  description: string;
  graphLabel: string;
  statusLabel: string;
  trendLabel: string;
  summaryIntro: string;
  summaryItems: string[];
  insights: {
    high: string;
    medium: string;
    low: string;
  };
  trends: Record<"up" | "stable" | "down", { label: string; tip: string }>;
};

type TrainingScoreGaugeProps = {
  data: TrainingScoreData;
  copy: TrainingScoreGaugeCopy;
};

const pickStatusKey = (score: number): "high" | "medium" | "low" => {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
};

const pickTrendKey = (statusKey: "high" | "medium" | "low"): "up" | "stable" | "down" => {
  if (statusKey === "high") return "up";
  if (statusKey === "medium") return "stable";
  return "down";
};

const TrainingScoreGauge: FC<TrainingScoreGaugeProps> = ({ data, copy }) => {
  const rawScore = useMemo(() => computeTrainingScore(data), [data]);
  const score = Math.min(100, Math.max(0, rawScore));
  const statusKey = pickStatusKey(score);
  const trendKey = pickTrendKey(statusKey);
  const trendDetails = copy.trends[trendKey];

  return (
    <Card className="w-full border-white/10 bg-card/80">
      <CardHeader className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">{copy.tag}</p>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex w-full flex-col gap-6 md:flex-row md:items-center">
        <div className="flex justify-center md:flex-none">
          <AIScoreGraph
            score={score}
            label={copy.graphLabel}
            trend={trendKey}
            gradient={{ from: "#0068B5", to: "#2FBF71" }}
            size={220}
            thickness={18}
            className="border-none bg-transparent p-0 shadow-none"
          />
        </div>
        <div className="flex-1 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.statusLabel}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{copy.insights[statusKey]}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.trendLabel}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{trendDetails.label}</p>
              <p className="text-xs text-muted-foreground">{trendDetails.tip}</p>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              {copy.summaryIntro}&nbsp;{copy.summaryItems.join(", ")}.
            </div>
          </div>
          <div />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingScoreGauge;
