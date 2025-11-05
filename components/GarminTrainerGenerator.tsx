"use client";

import { FormEvent, useState } from "react";

import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";

type GenerateTrainingResponse = {
  trainingJson?: GarminTrainerWorkout;
  raw: string;
  parseError?: string;
  error?: string;
};

export function GarminTrainerGenerator() {
  const [exampleMarkdown, setExampleMarkdown] = useState("");
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [trainingJson, setTrainingJson] = useState<GarminTrainerWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [pushDetails, setPushDetails] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedExample = exampleMarkdown.trim();
    if (!trimmedExample) {
      setError("Merci de coller un exemple d’entraînement avant la génération.");
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
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-label="Générer un entraînement Garmin depuis un exemple"
      >
        <textarea
          placeholder="Colle ici un exemple d’entraînement..."
          rows={12}
          value={exampleMarkdown}
          onChange={(event) => setExampleMarkdown(event.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-emerald-400/60 bg-emerald-400/20 px-6 font-semibold text-white transition hover:bg-emerald-400/30 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-100 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? "Génération en cours..." : "Générer l’entraînement"}
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
      </form>

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
