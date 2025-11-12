"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "stable";

export type AIScoreGraphProps = {
  score: number;
  label?: string;
  trend?: Trend;
  size?: number;
  thickness?: number;
  gradient?: {
    from: string;
    to: string;
  };
  className?: string;
  onClick?: () => void;
};

const clampScore = (value: number) => Math.min(100, Math.max(0, value));

const TrendBadge = ({ trend }: { trend?: Trend }) => {
  if (!trend) return null;
  const map: Record<Trend, { label: string; color: string; symbol: string }> = {
    up: { label: "En hausse", color: "text-success", symbol: "▲" },
    down: { label: "En baisse", color: "text-error", symbol: "▼" },
    stable: { label: "Stable", color: "text-info", symbol: "■" },
  };
  const data = map[trend];
  return (
    <span className={cn("flex items-center text-xs font-semibold uppercase tracking-wide", data.color)}>
      {data.symbol} {data.label}
    </span>
  );
};

export const AIScoreGraph = ({
  score,
  label = "AI Score",
  trend = "stable",
  size = 180,
  thickness = 14,
  gradient = { from: "#0068B5", to: "#2FBF71" },
  className,
  onClick,
}: AIScoreGraphProps) => {
  const clampedScore = clampScore(score);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => setProgress(clampedScore / 100), 50);
    return () => clearTimeout(timeout);
  }, [clampedScore]);

  const strokeDashoffset = circumference - progress * circumference;
  const gradientId = React.useMemo(() => {
    const base = label.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "ai-score";
    const normalizedSize = Math.round(size);
    const normalizedThickness = Math.round(thickness);
    const normalizedScore = Math.round(clampedScore * 10);
    return `gradient-${base}-${normalizedSize}-${normalizedThickness}-${normalizedScore}`;
  }, [label, size, thickness, clampedScore]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-card/80 p-6 text-center shadow-lg shadow-black/40",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="drop-shadow-lg">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.from} />
              <stop offset="100%" stopColor={gradient.to} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={thickness}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
            className="transition-[stroke-dashoffset] duration-[500ms] ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl font-bold text-foreground">{clampedScore}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-lg font-heading text-foreground">{label}</p>
        <TrendBadge trend={trend} />
      </div>
    </div>
  );
};
