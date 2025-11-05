"use client";

import { FormEvent, useEffect, useState } from "react";

import { MarkdownPlan } from "@/components/MarkdownPlan";
import { TRAINING_LOADING_MESSAGES } from "@/constants/loadingMessages";

type TrainingPlanResponse = {
  plan: string;
};

type TrainingPlanGeneratorFormProps = {
  onPlanGenerated?: (plan: string | null) => void;
};

export function TrainingPlanGeneratorForm({ onPlanGenerated }: TrainingPlanGeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(TRAINING_LOADING_MESSAGES[0]);

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

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPlan(null);
    onPlanGenerated?.(null);

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Merci de préciser ce que tu veux faire aujourd’hui et tes contraintes.");
      return;
    }

    try {
      setIsLoading(true);
      onPlanGenerated?.(null);
      const response = await fetch("/api/training-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: trimmedPrompt,
          constraints: "",
          availability: "",
          preferences: "",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible de générer le plan pour le moment.");
      }

      const data = (await response.json()) as TrainingPlanResponse;
      setPlan(data.plan);
      onPlanGenerated?.(data.plan);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Erreur inconnue.");
      onPlanGenerated?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-emerald-700/30 bg-emerald-900/20 p-6">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-semibold text-emerald-100">
            Que veux-tu faire aujourd’hui et quelles sont tes contraintes ? *
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            placeholder="Ex. je veux faire une séance cardio de 45 min, genou fragile, pas d’équipement, dispo ce soir."
            className="min-h-[140px] rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? loadingMessage : "Générer le plan"}
        </button>
      </form>

      {plan ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white">
          <h2 className="text-lg font-semibold text-emerald-200">Plan d’entraînement personnalisé</h2>
          <MarkdownPlan content={plan} className="text-sm leading-relaxed" />
        </div>
      ) : null}
    </div>
  );
}
