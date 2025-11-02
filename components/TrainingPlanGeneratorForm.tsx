"use client";

import { FormEvent, useState } from "react";

type TrainingPlanResponse = {
  plan: string;
};

export function TrainingPlanGeneratorForm() {
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");
  const [availability, setAvailability] = useState("");
  const [preferences, setPreferences] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPlan(null);

    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      setError("Merci d’indiquer un objectif clair avant de générer un plan.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/training-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: trimmedGoal,
          constraints: constraints.trim(),
          availability: availability.trim(),
          preferences: preferences.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible de générer le plan pour le moment.");
      }

      const data = (await response.json()) as TrainingPlanResponse;
      setPlan(data.plan);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-emerald-700/30 bg-emerald-900/20 p-6">
        <div className="space-y-2">
          <label htmlFor="goal" className="text-sm font-semibold text-emerald-100">
            Objectif principal *
          </label>
          <textarea
            id="goal"
            name="goal"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={3}
            placeholder="Préparer un semi-marathon, perdre du poids, reprendre la course après blessure..."
            className="min-h-[96px] rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="constraints" className="text-sm font-semibold text-emerald-100">
            Contraintes / blessures
          </label>
          <textarea
            id="constraints"
            name="constraints"
            value={constraints}
            onChange={(event) => setConstraints(event.target.value)}
            rows={3}
            placeholder="Ex. genou fragile, pas de sprint, matériel limité..."
            className="min-h-[80px] rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="availability" className="text-sm font-semibold text-emerald-100">
            Disponibilités hebdomadaires
          </label>
          <textarea
            id="availability"
            name="availability"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            rows={3}
            placeholder="Ex. 4 séances de 45 min du lundi au jeudi, weekend indisponible..."
            className="min-h-[80px] rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="preferences" className="text-sm font-semibold text-emerald-100">
            Préférences / disciplines
          </label>
          <textarea
            id="preferences"
            name="preferences"
            value={preferences}
            onChange={(event) => setPreferences(event.target.value)}
            rows={3}
            placeholder="Ex. course à pied, renforcement au poids du corps, pas de natation..."
            className="min-h-[80px] rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? "Génération en cours..." : "Générer le plan"}
        </button>
      </form>

      {plan ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white">
          <h2 className="text-lg font-semibold text-emerald-200">Plan d’entraînement personnalisé</h2>
          <pre className="whitespace-pre-wrap break-words text-white/90">{plan}</pre>
        </div>
      ) : null}
    </div>
  );
}
