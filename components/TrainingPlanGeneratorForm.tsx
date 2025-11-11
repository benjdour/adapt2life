"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { MarkdownPlan } from "@/components/MarkdownPlan";
import { TRAINING_LOADING_MESSAGES } from "@/constants/loadingMessages";

export type GeneratedPlanPayload = {
  plan: string;
  rawPlan: string;
};

type TrainingPlanResponse = {
  plan: string;
  rawPlan?: string;
};

type TrainingPlanGeneratorFormProps = {
  onPlanGenerated?: (plan: GeneratedPlanPayload | null) => void;
};

export function TrainingPlanGeneratorForm({ onPlanGenerated }: TrainingPlanGeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
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
    setPlan(null);
    onPlanGenerated?.(null);

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      const validationMessage = "Merci de préciser ce que tu veux faire aujourd’hui et tes contraintes.";
      toast.error(validationMessage);
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
      const humanPlan = (data.plan ?? "").trim();
      const fallbackRaw = data.rawPlan ?? data.plan ?? "";

      setPlan(humanPlan);
      onPlanGenerated?.({
        plan: humanPlan,
        rawPlan: fallbackRaw,
      });
      toast.success("Plan généré avec succès", {
        description: "Tu peux le consulter et le convertir juste en dessous.",
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Erreur inconnue.";
      toast.error(message);
      onPlanGenerated?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white/60">
            Briefing d’entraînement
          </h2>
          <label htmlFor="prompt" className="block text-sm font-semibold text-white">
            Que veux-tu faire aujourd’hui et quelles sont tes contraintes ? *
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            placeholder="Ex. je veux faire une séance cardio de 45 min, genou fragile, pas d’équipement, dispo ce soir."
            className="min-h-[140px] w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? loadingMessage : "Générer le plan"}
        </button>
      </form>

      {plan ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white backdrop-blur">
          <h2 className="text-lg font-semibold text-white/70">Plan d’entraînement personnalisé</h2>
          <MarkdownPlan content={plan} className="text-sm leading-relaxed" />
        </div>
      ) : null}
    </div>
  );
}
