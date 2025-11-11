"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TRAINING_LOADING_MESSAGES } from "@/constants/loadingMessages";
import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";
import type { GeneratedPlanPayload } from "@/components/TrainingPlanGeneratorForm";

type GenerateTrainingResponse = {
  trainingJson?: GarminTrainerWorkout;
  raw: string;
  parseError?: string;
  error?: string;
};

type GarminTrainerGeneratorProps = {
  sourcePlan: GeneratedPlanPayload | null;
};

export function GarminTrainerGenerator({ sourcePlan }: GarminTrainerGeneratorProps) {
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [trainingJson, setTrainingJson] = useState<GarminTrainerWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushDetails, setPushDetails] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(TRAINING_LOADING_MESSAGES[0]);
  const [conversionInput, setConversionInput] = useState<string>("");

  useEffect(() => {
    setRawResult(null);
    setTrainingJson(null);
    setPushDetails(null);
  }, [sourcePlan]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage(TRAINING_LOADING_MESSAGES[0]);
      return;
    }

    const selectRandomMessage = (previous?: string | null) => {
      if (TRAINING_LOADING_MESSAGES.length === 1) {
        return TRAINING_LOADING_MESSAGES[0];
      }
      const candidates = TRAINING_LOADING_MESSAGES.filter((message) => message !== previous);
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index] ?? TRAINING_LOADING_MESSAGES[0];
    };

    setLoadingMessage((prev) => selectRandomMessage(prev));

    const intervalId = window.setInterval(() => {
      setLoadingMessage((prev) => selectRandomMessage(prev));
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoading]);

  const combinedMarkdown = useMemo(() => {
    if (!sourcePlan) {
      return null;
    }
    return sourcePlan.rawPlan ?? sourcePlan.plan;
  }, [sourcePlan]);

  useEffect(() => {
    if (!combinedMarkdown) {
      setConversionInput("");
      return;
    }
    setConversionInput(combinedMarkdown.trim());
  }, [combinedMarkdown]);

  const handleGenerateWorkout = async () => {
    const trimmedExample = conversionInput.trim();
    if (!trimmedExample) {
      const validationMessage =
        "Génère d’abord un plan d’entraînement ci-dessus pour alimenter la conversion Garmin.";
      toast.error(validationMessage);
      return;
    }

    setRawResult(null);
    setTrainingJson(null);
    setPushDetails(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/garmin-trainer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exampleMarkdown: trimmedExample }),
      });

      const data = (await response.json().catch(() => null)) as GenerateTrainingResponse & { error?: string } | null;
      const raw = data && typeof data.raw === "string" ? data.raw : null;

      if (raw) {
        setRawResult(raw);
      }
      if (data?.trainingJson) {
        setTrainingJson(data.trainingJson);
      } else {
        setTrainingJson(null);
      }

      if (!response.ok) {
        const message =
          data?.error ?? "Impossible de générer l’entraînement pour le moment. Merci de réessayer plus tard.";
        const parseHint =
          data?.parseError && data.parseError.trim().length > 0 ? `\nDétail: ${data.parseError.trim()}` : "";
        toast.error(`${message}${parseHint}`);
        return;
      }

      if (!raw) {
        throw new Error("Le serveur n’a pas renvoyé de JSON brut.");
      }

      toast.success("Conversion terminée", {
        description: "Le JSON brut est prêt à être revu avant envoi à Garmin.",
      });
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : "Erreur inconnue.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGarmin = async () => {
    if (!trainingJson || isPushing) {
      return;
    }

    setIsPushing(true);
    setPushDetails(null);

    try {
      const response = await fetch("/api/garmin-trainer/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ workout: trainingJson }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            success?: boolean;
            workoutId?: string | number | null;
            scheduledFor?: string | null;
            garminResponse?: unknown;
          }
        | null;

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible d’envoyer l’entraînement à Garmin.";
        if (payload?.garminResponse) {
          setPushDetails(JSON.stringify(payload.garminResponse, null, 2));
        }
        toast.error(message);
        return;
      }

      const successMessageParts: string[] = [];
      if (payload?.workoutId !== undefined && payload.workoutId !== null) {
        successMessageParts.push(`Entraînement envoyé à Garmin (ID ${payload.workoutId}).`);
      } else {
        successMessageParts.push("Entraînement envoyé à Garmin.");
      }
      if (payload?.scheduledFor) {
        successMessageParts.push(`Planifié pour le ${payload.scheduledFor}.`);
      }

      const successMessage = successMessageParts.join(" ");
      toast.success("Entraînement envoyé à Garmin", {
        description: successMessage,
      });

      if (payload?.garminResponse) {
        setPushDetails(JSON.stringify(payload.garminResponse, null, 2));
      }
    } catch (pushErrorInstance) {
      const message =
        pushErrorInstance instanceof Error
          ? pushErrorInstance.message
          : "Erreur inconnue lors de l’envoi à Garmin.";
      toast.error(message);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white backdrop-blur">
          <p className="text-sm font-semibold text-white/70">Plan utilisé pour la conversion</p>
          <p className="mt-2 text-xs text-white/60">
            Le plan généré est copié automatiquement ici. Tu peux l’ajuster avant de lancer la conversion Garmin.
          </p>
          <textarea
            value={conversionInput}
            onChange={(event) => setConversionInput(event.target.value)}
            placeholder="Colle ou édite ici le plan à convertir"
            className="mt-3 w-full max-h-60 min-h-[160px] resize-y rounded-md border border-white/15 bg-black/30 p-3 font-mono text-xs leading-relaxed text-white/80 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerateWorkout}
          disabled={isLoading || conversionInput.trim().length === 0}
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/10 px-6 font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? loadingMessage : "Convertir le plan en JSON Garmin"}
        </button>

        {rawResult ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white backdrop-blur">
            <h2 className="text-base font-semibold text-white/70">Résultat brut</h2>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-white/80">
              {rawResult}
            </pre>
          </div>
        ) : null}
      </div>

      {trainingJson ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white backdrop-blur">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white/70">Synchroniser avec Garmin</h2>
            <p className="text-xs text-white/70">
              Vérifie que l’entraînement correspond à la documentation puis envoie-le vers ton compte Garmin connecté.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePushToGarmin}
            disabled={isPushing}
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/10 px-6 font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-wait disabled:opacity-60"
          >
            {isPushing ? "Envoi vers Garmin..." : "Envoyer l’entraînement sur Garmin"}
          </button>

          {pushDetails ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-white/50">Dernière réponse Garmin</p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/80">
                {pushDetails}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
