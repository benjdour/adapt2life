"use client";

import { useCallback, useState } from "react";

import { GarminTrainerGenerator } from "@/components/GarminTrainerGenerator";
import { TrainingPlanGeneratorForm, GeneratedPlanPayload } from "@/components/TrainingPlanGeneratorForm";

export function TrainingGeneratorsSection() {
  const [latestPlan, setLatestPlan] = useState<GeneratedPlanPayload | null>(null);

  const handlePlanGenerated = useCallback((payload: GeneratedPlanPayload | null) => {
    if (!payload) {
      setLatestPlan(null);
      return;
    }
    setLatestPlan({
      ...payload,
      rawPlan: payload.rawPlan ?? payload.plan,
    });
  }, []);

  return (
    <>
      <TrainingPlanGeneratorForm onPlanGenerated={handlePlanGenerated} />

      <section
        id="garmin"
        className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white shadow-lg backdrop-blur"
      >
        <header className="space-y-2 text-center md:text-left">
          <p className="text-xs uppercase tracking-wide text-white/60">Garmin Training API (bêta)</p>
          <h2 className="text-2xl font-semibold text-white">Générateur d’entraînements Garmin</h2>
          <p className="text-sm text-white/70">
            Prends le plan généré ci-dessus et transforme-le en JSON Garmin conforme à la documentation Training API V2, prêt à être
            validé puis envoyé automatiquement vers ton compte.
          </p>
        </header>

        <div className="space-y-6">
          <GarminTrainerGenerator sourcePlan={latestPlan} />

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/80 backdrop-blur">
            <p className="font-semibold text-white/70">Bon à savoir</p>
            <ul className="mt-2 space-y-1 list-disc pl-4 text-white/70">
              <li>Génère d’abord un plan d’entraînement ci-dessus pour alimenter la conversion Garmin.</li>
              <li>Tu peux ensuite pousser le JSON validé vers Garmin directement depuis cette section.</li>
              <li>Assure-toi d’être connecté à ton compte Garmin dans Adapt2Life pour l’envoi automatique.</li>
              <li>La longueur de piscine est définie par défaut à 25 m si le brief ne la précise pas.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
