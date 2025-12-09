"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getTrainingLoadingMessages } from "@/constants/loadingMessages";
import { AppError, describeAppError, getErrorDescriptor } from "@/lib/errors";
import type { GarminTrainerWorkout } from "@/schemas/garminTrainer.schema";
import type { GeneratedPlanPayload } from "@/components/TrainingPlanGeneratorForm";
import { GarminWorkoutPreview } from "@/components/GarminWorkoutPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { downloadPlanPdf } from "@/lib/utils/pdf";
import { isGarminSportSupported } from "@/lib/utils/garminCompatibility";
import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/locales";

type GenerateTrainingResponse = {
  trainingJson?: GarminTrainerWorkout;
  raw: string;
  parseError?: string;
  error?: string;
};

type GarminTrainerGeneratorProps = {
  sourcePlan: GeneratedPlanPayload | null;
  locale?: Locale;
};

export function GarminTrainerGenerator({ sourcePlan, locale = DEFAULT_LOCALE }: GarminTrainerGeneratorProps) {
  const trainingMessages = useMemo(() => getTrainingLoadingMessages(locale), [locale]);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [trainingJson, setTrainingJson] = useState<GarminTrainerWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushDetails, setPushDetails] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(trainingMessages[0]);
  const [conversionInput, setConversionInput] = useState<string>("");
  const workoutSupported = useMemo(() => {
    if (!trainingJson) {
      return true;
    }
    return isGarminSportSupported(trainingJson.sport ?? null);
  }, [trainingJson]);

  useEffect(() => {
    setRawResult(null);
    setTrainingJson(null);
    setPushDetails(null);
  }, [sourcePlan]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage(trainingMessages[0]);
      return;
    }

    const selectRandomMessage = (previous?: string | null) => {
      if (trainingMessages.length <= 1) {
        return trainingMessages[0];
      }
      const candidates = trainingMessages.filter((message) => message !== previous);
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index] ?? trainingMessages[0];
    };

    setLoadingMessage((prev) => selectRandomMessage(prev));

    const intervalId = window.setInterval(() => {
      setLoadingMessage((prev) => selectRandomMessage(prev));
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoading, trainingMessages]);

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
      const descriptor = getErrorDescriptor("garmin-trainer/no-source-plan");
      toast.error(descriptor.title, { description: descriptor.description });
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
        const errorCode =
          response.status === 402
            ? "garmin-trainer/quota-exhausted"
            : response.status === 401
            ? "garmin-trainer/auth-required"
            : "garmin-trainer/request-failed";
        throw new AppError(errorCode, {
          details: `${message}${parseHint}`.trim(),
        });
      }

      if (!raw) {
        throw new AppError("garmin-trainer/raw-missing");
      }

      toast.success("Conversion terminée", {
        description: "La version technique du plan est prête à être vérifiée avant envoi à Garmin.",
      });
    } catch (generationError) {
      const descriptor = describeAppError(generationError, "garmin-trainer/request-failed");
      toast.error(descriptor.title, { description: descriptor.description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    const trimmed = conversionInput.trim();
    if (!trimmed) {
      toast.error("Plan introuvable", { description: "Ajoute ou génère un plan avant de l’exporter." });
      return;
    }
    try {
      await downloadPlanPdf(trimmed, "plan-garmin.pdf");
      toast.success("Plan exporté", { description: "Le PDF est prêt dans tes téléchargements." });
    } catch (error) {
      console.error("garmin generator pdf export failed", error);
      toast.error("Export impossible", { description: "La génération du PDF a échoué. Réessaie ou contacte le support." });
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
        const code = response.status === 409 ? "garmin-trainer/push-unavailable" : "garmin-trainer/push-failed";
        throw new AppError(code, { details: message });
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
      const descriptor = describeAppError(pushErrorInstance, "garmin-trainer/push-failed");
      toast.error(descriptor.title, { description: descriptor.description });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan utilisé pour la conversion</CardTitle>
          <CardDescription>
            Le plan généré est copié automatiquement ici. Tu peux l’ajuster avant de lancer la conversion Garmin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={conversionInput}
            onChange={(event) => setConversionInput(event.target.value)}
            placeholder="Colle ou édite ici le plan à convertir"
            className="max-h-60 min-h-[160px] resize-y font-mono text-xs leading-relaxed"
          />

          <Button
            type="button"
            onClick={handleGenerateWorkout}
            disabled={isLoading || conversionInput.trim().length === 0}
            variant="secondary"
            className="w-full"
            isLoading={isLoading}
          >
            {isLoading ? loadingMessage : "Préparer le format Garmin"}
          </Button>

          {rawResult ? (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Résultat brut</h3>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                {rawResult}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {trainingJson ? (
        <Card>
          <CardHeader>
            <CardTitle>Synchroniser avec Garmin</CardTitle>
            <CardDescription>
              Vérifie que l’entraînement correspond à la documentation puis envoie-le vers ton compte Garmin connecté.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trainingJson ? <GarminWorkoutPreview workout={trainingJson} /> : null}
            <Button
              type="button"
              onClick={workoutSupported ? handlePushToGarmin : handleDownloadPdf}
              disabled={workoutSupported ? isPushing : false}
              className="w-full"
              isLoading={workoutSupported ? isPushing : false}
            >
              {workoutSupported ? "Envoyer l’entraînement sur Garmin" : "Télécharger le plan PDF"}
            </Button>
            {trainingJson && !workoutSupported ? (
              <p className="text-xs text-muted-foreground">
                Ce type de sport n’est pas compatible avec l’API Garmin Training. Télécharge le plan pour l’utiliser hors ligne.
              </p>
            ) : null}

            {pushDetails ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Dernière réponse Garmin</p>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {pushDetails}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
