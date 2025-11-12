"use client";

import { useCallback, useState } from "react";

import { GarminTrainerGenerator } from "@/components/GarminTrainerGenerator";
import { TrainingPlanGeneratorForm, GeneratedPlanPayload } from "@/components/TrainingPlanGeneratorForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrainingGeneratorsDebugSection() {
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
      <TrainingPlanGeneratorForm onPlanGenerated={handlePlanGenerated} enableInlineSend={false} />

      <Card id="garmin">
        <CardHeader className="text-center md:text-left">
          <CardTitle>Générateur d’entraînements Garmin</CardTitle>
          <CardDescription>
            Transforme le plan généré ci-dessus en JSON conforme à la Training API V2, prêt à être validé puis envoyé automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <GarminTrainerGenerator sourcePlan={latestPlan} />

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Bon à savoir</p>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Génère d’abord un plan d’entraînement ci-dessus pour alimenter la conversion Garmin.</li>
              <li>Tu peux ensuite pousser le JSON validé vers Garmin directement depuis cette section.</li>
              <li>Assure-toi d’être connecté à ton compte Garmin dans Adapt2Life pour l’envoi automatique.</li>
              <li>La longueur de piscine est définie par défaut à 25 m si le brief ne la précise pas.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
