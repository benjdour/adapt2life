"use client";

import { FormEvent, useState } from "react";

type GenerateTrainingResponse = {
  trainingJson: unknown;
  raw: string;
};

export function GarminTrainerGenerator() {
  const [exampleMarkdown, setExampleMarkdown] = useState("");
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedExample = exampleMarkdown.trim();
    if (!trimmedExample) {
      setError("Merci de coller un exemple d’entraînement avant la génération.");
      return;
    }

    setError(null);
    setRawResult(null);
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

      if (!response.ok || !data || typeof data.raw !== "string") {
        const message =
          data?.error ?? "Impossible de générer l’entraînement pour le moment. Merci de réessayer plus tard.";
        throw new Error(message);
      }

      setRawResult(data.raw);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
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
    </div>
  );
}
