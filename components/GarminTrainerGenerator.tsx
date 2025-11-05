"use client";

import { useEffect, useMemo, useState } from "react";

import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

type GenerateTrainingResponse = {
  trainingJson?: GarminTrainerWorkout;
  raw: string;
  parseError?: string;
  error?: string;
};

type GarminTrainerGeneratorProps = {
  sourceMarkdown: string | null;
};

const LOADING_MESSAGES = [
  "🧠 Calcul des watts nécessaires pour vaincre ton canapé…",
  "🚴‍♂️ Je vérifie si ton vélo est prêt à souffrir…",
  "🥵 Synchronisation des gouttes de sueur prévues…",
  "🏋️‍♀️ Téléchargement de la motivation… (ça peut prendre un moment)",
  "⏳ Ajustement du karma sportif… patience, athlète !",
  "💪 Chargement des quadriceps à 82 %…",
  "🍌 Épluchage de la banane pré-entraînement…",
  "😎 Vérification de ton niveau de badassitude…",
  "🔥 Calibration de la douleur “qui fait du bien”…",
  "🤖 L’IA s’étire avant de te proposer une séance.",
  "🧘‍♂️ Respire… ton entraînement arrive, pas ton jugement dernier.",
  "🎧 Choix de la playlist “Je vais transpirer élégamment”.",
  "🩳 Vérification du short : prêt, propre, ou approximatif ?",
  "🧩 Assemblage du plan parfait pour te faire dire “jamais plus”.",
  "🧃 Mélange des électrolytes imaginaires…",
  "🕺 Petit échauffement du code source…",
  "🚀 Mise en orbite de ton mental de champion.",
  "🦵 Calcul du risque de courbatures demain matin…",
  "🧊 Refroidissement anticipé des mollets en prévision.",
  "🥇 Ajustement du mode “je ne lâche rien”.",
];

export function GarminTrainerGenerator({ sourceMarkdown }: GarminTrainerGeneratorProps) {
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [trainingJson, setTrainingJson] = useState<GarminTrainerWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [pushDetails, setPushDetails] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);

  useEffect(() => {
    setError(null);
    setRawResult(null);
    setTrainingJson(null);
    setPushError(null);
    setPushSuccess(null);
    setPushDetails(null);
  }, [sourceMarkdown]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage(LOADING_MESSAGES[0]);
      return;
    }

    const selectRandomMessage = (previous?: string | null) => {
      if (LOADING_MESSAGES.length === 1) {
        return LOADING_MESSAGES[0];
      }
      const candidates = LOADING_MESSAGES.filter((message) => message !== previous);
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index] ?? LOADING_MESSAGES[0];
    };

    setLoadingMessage((prev) => selectRandomMessage(prev));

    const intervalId = window.setInterval(() => {
      setLoadingMessage((prev) => selectRandomMessage(prev));
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoading]);

  const planPreview = useMemo(() => {
    if (!sourceMarkdown) {
      return null;
    }
    const trimmed = sourceMarkdown.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed.length > 1200 ? `${trimmed.slice(0, 1200)}…` : trimmed;
  }, [sourceMarkdown]);

  const handleGenerateWorkout = async () => {
    const trimmedExample = sourceMarkdown?.trim();
    if (!trimmedExample) {
      setError("Génère d’abord un plan d’entraînement ci-dessus pour alimenter la conversion Garmin.");
      return;
    }

    setError(null);
    setRawResult(null);
    setTrainingJson(null);
    setPushError(null);
    setPushSuccess(null);
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
        setError(`${message}${parseHint}`);
        return;
      }

      if (!raw) {
        throw new Error("Le serveur n’a pas renvoyé de JSON brut.");
      }

      setError(null);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGarmin = async () => {
    if (!trainingJson || isPushing) {
      return;
    }

    setIsPushing(true);
    setPushError(null);
    setPushSuccess(null);
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
        setPushError(message);
        if (payload?.garminResponse) {
          setPushDetails(JSON.stringify(payload.garminResponse, null, 2));
        }
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

      setPushSuccess(successMessage);

      if (payload?.garminResponse) {
        setPushDetails(JSON.stringify(payload.garminResponse, null, 2));
      }
    } catch (pushErrorInstance) {
      setPushError(
        pushErrorInstance instanceof Error
          ? pushErrorInstance.message
          : "Erreur inconnue lors de l’envoi à Garmin.",
      );
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-left text-sm text-white">
          <p className="text-sm font-semibold text-emerald-200">Plan utilisé pour la conversion</p>
          {planPreview ? (
            <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-100/80">
              {planPreview}
            </pre>
          ) : (
            <p className="mt-2 text-xs text-white/60">
              Génère un plan via le formulaire ci-dessus pour pouvoir le convertir en entraînement Garmin.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerateWorkout}
          disabled={isLoading || !sourceMarkdown?.trim()}
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-emerald-400/60 bg-emerald-400/20 px-6 font-semibold text-white transition hover:bg-emerald-400/30 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? loadingMessage : "Convertir le plan en JSON Garmin"}
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        {rawResult ? (
          <div className="space-y-3 rounded-xl border border-white/15 bg-black/40 p-4 text-left text-sm text-white">
            <h2 className="text-base font-semibold text-emerald-200">Résultat brut</h2>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-100/80">
              {rawResult}
            </pre>
          </div>
        ) : null}
      </div>

      {trainingJson ? (
        <div className="space-y-3 rounded-xl border border-emerald-600/40 bg-emerald-950/40 p-4 text-left text-sm text-white">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-emerald-200">Synchroniser avec Garmin</h2>
            <p className="text-xs text-white/70">
              Vérifie que l’entraînement correspond à la documentation puis envoie-le vers ton compte Garmin connecté.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePushToGarmin}
            disabled={isPushing}
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-emerald-400/60 bg-emerald-400/20 px-6 font-semibold text-white transition hover:bg-emerald-400/30 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-100 disabled:cursor-wait disabled:opacity-60"
          >
            {isPushing ? "Envoi vers Garmin..." : "Envoyer l’entraînement sur Garmin"}
          </button>

          {pushError ? <p className="text-xs text-red-300">{pushError}</p> : null}
          {pushSuccess ? <p className="text-xs text-emerald-200">{pushSuccess}</p> : null}

          {pushDetails ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-emerald-100/80">
              {pushDetails}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
