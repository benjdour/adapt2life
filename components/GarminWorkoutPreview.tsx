import type { ReactNode } from "react";

import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";
import { describeExerciseForUser, getGarminExerciseLabel, type GarminExerciseLocale } from "@/lib/garminExercises";

type GarminWorkoutPreviewProps = {
  workout: GarminTrainerWorkout;
  locale?: GarminExerciseLocale;
};

type WorkoutStep = GarminTrainerWorkout["segments"][number]["steps"][number];

const formatSeconds = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "";
  }
  const integer = Math.max(0, Math.round(value));
  const minutes = Math.floor(integer / 60);
  const seconds = integer % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  if (seconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${seconds < 10 ? `0${seconds}` : seconds}s`;
};

const formatDuration = (step: WorkoutStep): string | null => {
  if (!step.durationType) {
    return null;
  }
  if (step.durationType === "TIME" || step.durationType === "FIXED_REST") {
    if (typeof step.durationValue === "number") {
      const label = formatSeconds(step.durationValue);
      return step.durationType === "FIXED_REST" ? `Repos ${label}` : label;
    }
    return null;
  }
  if (step.durationType === "REPS") {
    return `${step.durationValue ?? "?"} répétitions`;
  }
  if (step.durationType === "DISTANCE") {
    return `${step.durationValue ?? "?"} m`;
  }
  return null;
};

const INTENSITY_LABELS: Record<string, string> = {
  WARMUP: "Échauffement",
  ACTIVE: "Effort",
  REST: "Repos",
  COOLDOWN: "Retour au calme",
  RECOVERY: "Récupération",
};

const isRepeatStep = (step: WorkoutStep): step is WorkoutStep & { type: "WorkoutRepeatStep" } => {
  return step.type === "WorkoutRepeatStep";
};

const StepPreview = ({
  step,
  depth,
  segmentSport,
  locale,
}: {
  step: WorkoutStep;
  depth: number;
  segmentSport: GarminTrainerWorkout["segments"][number]["sport"];
  locale: GarminExerciseLocale;
}): ReactNode => {
  const details: string[] = [];
  const durationLabel = formatDuration(step);
  if (durationLabel) {
    details.push(durationLabel);
  }

  const intensityLabel = step.intensity ? INTENSITY_LABELS[step.intensity] ?? step.intensity : null;
  if (intensityLabel) {
    details.push(intensityLabel);
  }

  if (!isRepeatStep(step)) {
    const exerciseLabel = describeExerciseForUser(
      {
        sport: segmentSport,
        category: step.exerciseCategory,
        name: step.exerciseName,
      },
      locale,
    );
    if (exerciseLabel) {
      details.push(exerciseLabel);
    } else if (step.exerciseName) {
      const fallback = getGarminExerciseLabel(step.exerciseName, locale);
      if (fallback) {
        details.push(fallback);
      }
    }
  }

  return (
    <div className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-foreground/90" style={{ marginLeft: depth * 16 }}>
      <p className="font-medium leading-snug">
        Étape {step.stepOrder} · {step.description ?? (isRepeatStep(step) ? "Répétition" : "Action")}
      </p>
      {details.length > 0 ? <p className="text-xs text-muted-foreground">{details.join(" • ")}</p> : null}
      {isRepeatStep(step) ? (
        <div className="mt-2 space-y-2 border-l border-white/10 pl-3">
          <p className="text-xs font-medium text-muted-foreground">
            {step.repeatValue} répétitions — {step.intensity ? INTENSITY_LABELS[step.intensity] ?? step.intensity : "Intensité libre"}
          </p>
          {Array.isArray(step.steps)
            ? step.steps.map((child) => (
                <StepPreview
                  key={`repeat-${step.stepOrder}-${child.stepOrder}`}
                  step={child as WorkoutStep}
                  depth={depth + 1}
                  segmentSport={segmentSport}
                  locale={locale}
                />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

export function GarminWorkoutPreview({ workout, locale = "fr" }: GarminWorkoutPreviewProps) {
  if (!workout || !Array.isArray(workout.segments) || workout.segments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">
          {workout.workoutName ?? "Séance Garmin"} · {workout.sport}
        </p>
        {workout.description ? <p className="text-xs text-muted-foreground">{workout.description}</p> : null}
      </div>

      <div className="space-y-3">
        {workout.segments.map((segment) => (
          <div key={`segment-${segment.segmentOrder}`} className="space-y-2 rounded-xl border border-white/5 bg-white/5 p-3">
            <p className="text-sm font-semibold text-foreground">
              Segment {segment.segmentOrder} · {segment.sport}
            </p>
            {segment.steps.map((step) => (
              <StepPreview
                key={`segment-${segment.segmentOrder}-step-${step.stepOrder}`}
                step={step as WorkoutStep}
                depth={0}
                segmentSport={segment.sport}
                locale={locale}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
