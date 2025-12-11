"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MarkdownPlan } from "@/components/MarkdownPlan";
import { GARMIN_TRANSFER_LOADING_MESSAGES, TRAINING_LOADING_MESSAGES } from "@/constants/loadingMessages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppError, describeAppError, getErrorDescriptor } from "@/lib/errors";
import { downloadPlanPdf } from "@/lib/utils/pdf";
import { detectPlanSport, evaluatePlanCompatibility, isGarminSportSupported } from "@/lib/utils/garminCompatibility";
import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/locales";
import { LOCALE_HEADER_NAME } from "@/lib/i18n/constants";

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
  enableInlineSend?: boolean;
  locale?: Locale;
};

type TrainingPlanCopy = {
  briefingTitle: string;
  briefingDescription: string;
  promptLabel: string;
  promptPlaceholder: string;
  generateButton: string;
  planCardTitle: string;
  sendButtonLabel: string;
  sendButtonSentLabel: string;
  sendButtonFallbackLabel: string;
  downloadButtonLabel: string;
  compatibilityWarning: (context: string) => string;
  compatibilityFallbackContext: string;
  planGenerated: { title: string; description: string };
  noPlanToSend: { title: string; description: string };
  noPlanAvailable: { title: string; description: string };
  pdfExported: { title: string; description: string };
  pdfExportFailed: { title: string; description: string };
  pendingTransferMessage: string;
  garminJobSuccess: string;
  garminJobFailed: string;
  garminJobFailedDescription: string;
};

const trainingPlanCopyByLocale: Record<Locale, TrainingPlanCopy> = {
  fr: {
    briefingTitle: "Briefing d’entraînement",
    briefingDescription: "Décris ton objectif, tes contraintes et ton ressenti du jour pour générer une séance adaptée.",
    promptLabel: "Que veux-tu faire aujourd’hui et quelles sont tes contraintes ?",
    promptPlaceholder: "Ex. je veux faire une séance cardio de 45 min, genou fragile, pas d’équipement, dispo ce soir.",
    generateButton: "Générer le plan",
    planCardTitle: "Plan d’entraînement personnalisé",
    sendButtonLabel: "Envoyer à Garmin Connect",
    sendButtonSentLabel: "Entraînement envoyé",
    sendButtonFallbackLabel: "Télécharger le plan PDF",
    downloadButtonLabel: "Télécharger le plan PDF",
    compatibilityWarning: (context) =>
      `Cet entraînement (${context}) n’est pas compatible avec Garmin Training. Télécharge le PDF pour le suivre manuellement.`,
    compatibilityFallbackContext: "sport non pris en charge",
    planGenerated: {
      title: "Plan généré avec succès",
      description: "Tu peux le consulter et l’envoyer juste en dessous.",
    },
    noPlanToSend: {
      title: "Aucun plan à envoyer",
      description: "Génère d’abord une séance avant de l’envoyer vers Garmin.",
    },
    noPlanAvailable: {
      title: "Plan introuvable",
      description: "Génère d’abord un entraînement.",
    },
    pdfExported: {
      title: "Plan exporté",
      description: "Le PDF est prêt dans tes téléchargements.",
    },
    pdfExportFailed: {
      title: "Export impossible",
      description: "La génération du PDF a échoué. Réessaie ou contacte le support.",
    },
    pendingTransferMessage: "Ton entraînement sera disponible dans Garmin Connect d’ici 5 minutes.",
    garminJobSuccess: "Entraînement envoyé à Garmin",
    garminJobFailed: "L’envoi Garmin a échoué",
    garminJobFailedDescription: "Garmin n’a pas accepté cette séance.",
  },
  en: {
    briefingTitle: "Workout briefing",
    briefingDescription: "Describe your goal, constraints and how you feel today to generate a tailored session.",
    promptLabel: "What do you want to do today and what are your constraints?",
    promptPlaceholder: "e.g. 45-min cardio session, sensitive knee, no gear, available tonight.",
    generateButton: "Generate the plan",
    planCardTitle: "Personalized workout plan",
    sendButtonLabel: "Send to Garmin Connect",
    sendButtonSentLabel: "Workout sent",
    sendButtonFallbackLabel: "Download the workout PDF",
    downloadButtonLabel: "Download the workout PDF",
    compatibilityWarning: (context) =>
      `This workout (${context}) isn’t supported by Garmin Training. Download the PDF to follow it manually.`,
    compatibilityFallbackContext: "unsupported sport",
    planGenerated: {
      title: "Plan generated successfully",
      description: "Review it below and send it when you’re ready.",
    },
    noPlanToSend: {
      title: "No workout to send",
      description: "Generate a session before sending it to Garmin.",
    },
    noPlanAvailable: {
      title: "Workout not found",
      description: "Generate a session first.",
    },
    pdfExported: {
      title: "Workout exported",
      description: "The PDF is waiting in your downloads.",
    },
    pdfExportFailed: {
      title: "Export failed",
      description: "We couldn’t create the PDF. Try again or contact support.",
    },
    pendingTransferMessage: "Your workout should appear in Garmin Connect within five minutes.",
    garminJobSuccess: "Workout sent to Garmin",
    garminJobFailed: "Garmin delivery failed",
    garminJobFailedDescription: "Garmin couldn’t ingest this workout.",
  },
};

export function TrainingPlanGeneratorForm({
  onPlanGenerated,
  enableInlineSend = false,
  locale = DEFAULT_LOCALE,
}: TrainingPlanGeneratorFormProps) {
  const copy = trainingPlanCopyByLocale[locale] ?? trainingPlanCopyByLocale[DEFAULT_LOCALE];
  const trainingMessages = useMemo(() => TRAINING_LOADING_MESSAGES[locale] ?? TRAINING_LOADING_MESSAGES[DEFAULT_LOCALE], [locale]);
  const transferMessages = useMemo(
    () => GARMIN_TRANSFER_LOADING_MESSAGES[locale] ?? GARMIN_TRANSFER_LOADING_MESSAGES[DEFAULT_LOCALE],
    [locale],
  );
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [conversionSource, setConversionSource] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [pendingToastId, setPendingToastId] = useState<string | number | null>(null);
  const [hasSentSuccessfully, setHasSentSuccessfully] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(trainingMessages[0]);
  const [isSending, setIsSending] = useState(false);
  const [sendLoadingMessage, setSendLoadingMessage] = useState<string>(transferMessages[0]);
  const [planCompatibility, setPlanCompatibility] = useState<{
    isGarminCompatible: boolean;
    blocker: string | null;
    sportLabel: string | null;
    sportId: string | null;
  }>({
    isGarminCompatible: true,
    blocker: null,
    sportLabel: null,
    sportId: null,
  });

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

    return () => window.clearInterval(intervalId);
  }, [isLoading, trainingMessages]);

  useEffect(() => {
    if (!isSending) {
      setSendLoadingMessage(transferMessages[0]);
      return;
    }

    const selectRandomMessage = (previous?: string | null) => {
      if (transferMessages.length <= 1) {
        return transferMessages[0];
      }
      const candidates = transferMessages.filter((message) => message !== previous);
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index] ?? transferMessages[0];
    };

    setSendLoadingMessage((prev) => selectRandomMessage(prev));

    const intervalId = window.setInterval(() => {
      setSendLoadingMessage((prev) => selectRandomMessage(prev));
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isSending, transferMessages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlan(null);
    setConversionSource(null);
    setHasSentSuccessfully(false);
    setActiveJobId(null);
    setPlanCompatibility({ isGarminCompatible: true, blocker: null, sportLabel: null, sportId: null });
    onPlanGenerated?.(null);

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      const descriptor = getErrorDescriptor("training-plan/empty-brief", undefined, locale);
      toast.error(descriptor.title, { description: descriptor.description });
      return;
    }

    try {
      setIsLoading(true);
      onPlanGenerated?.(null);
      const response = await fetch("/api/training-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [LOCALE_HEADER_NAME]: locale,
          "accept-language": locale,
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
        const errorCode = response.status === 402 ? "training-plan/quota-exhausted" : "training-plan/request-failed";
        throw new AppError(errorCode, {
          details: payload.error ?? null,
        });
      }

      const data = (await response.json()) as TrainingPlanResponse;
      const humanPlan = (data.plan ?? "").trim();
      const fallbackRaw = data.rawPlan ?? data.plan ?? "";

      if (!humanPlan) {
        throw new AppError("training-plan/invalid-response");
      }

      setPlan(humanPlan);
      setConversionSource(fallbackRaw.trim());
      setHasSentSuccessfully(false);
      setActiveJobId(null);
      const detectedSport = detectPlanSport(humanPlan);
      const compatibility = evaluatePlanCompatibility(`${humanPlan}\n${trimmedPrompt}`, detectedSport.garminSportId);
      const isGarminCompatible =
        compatibility.isCompatible && (detectedSport.garminSportId ? isGarminSportSupported(detectedSport.garminSportId) : true);
      setPlanCompatibility({
        isGarminCompatible,
        blocker: compatibility.blocker,
        sportLabel: detectedSport.label,
        sportId: detectedSport.garminSportId ?? null,
      });
      onPlanGenerated?.({
        plan: humanPlan,
        rawPlan: fallbackRaw,
      });
      toast.success(copy.planGenerated.title, {
        description: copy.planGenerated.description,
      });
    } catch (submissionError) {
      const descriptor = describeAppError(submissionError, "training-plan/request-failed", locale);
      toast.error(descriptor.title, { description: descriptor.description });
      onPlanGenerated?.(null);
      setPlanCompatibility({ isGarminCompatible: true, blocker: null, sportLabel: null, sportId: null });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToGarmin = async () => {
    if (!planCompatibility.isGarminCompatible) {
      handleDownloadPdf();
      return;
    }
    if (!conversionSource) {
      toast.error(copy.noPlanToSend.title, {
        description: copy.noPlanToSend.description,
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/garmin-trainer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planMarkdown: conversionSource }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { jobId?: number; error?: string; message?: string; etaMinutes?: number }
        | null;

      if (!response.ok) {
        const errorCode =
          response.status === 402
            ? "garmin-trainer/quota-exhausted"
            : response.status === 401
            ? "garmin-trainer/auth-required"
            : "garmin-trainer/request-failed";
        throw new AppError(errorCode, { details: payload?.error });
      }

      if (!payload?.jobId) {
        throw new AppError("garmin-trainer/request-failed", { details: payload?.error });
      }

      setActiveJobId(payload.jobId);
      const toastId = toast.success(payload.message ?? copy.pendingTransferMessage, {
        duration: 8000,
      });
      setPendingToastId(toastId);
    } catch (error) {
      const descriptor = describeAppError(error, "garmin-trainer/push-failed", locale);
      toast.error(descriptor.title, { description: descriptor.description });
      setIsSending(false);
    } finally {
      // reste à true jusqu’à résolution du job
    }
  };

  const handleDownloadPdf = async () => {
    if (!plan) {
      toast.error(copy.noPlanAvailable.title, { description: copy.noPlanAvailable.description });
      return;
    }
    try {
      await downloadPlanPdf(plan, "plan-adapt2life.pdf");
      toast.success(copy.pdfExported.title, { description: copy.pdfExported.description });
    } catch (error) {
      console.error("plan pdf export failed", error);
      toast.error(copy.pdfExportFailed.title, { description: copy.pdfExportFailed.description });
    }
  };

  useEffect(() => {
    if (!activeJobId) {
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/garmin-trainer/jobs/${activeJobId}`);
        if (!response.ok) {
          throw new Error("Statut de job indisponible");
        }
        const job = (await response.json()) as { status: string; error?: string };
        if (cancelled) return;

        if (job.status === "success") {
          setActiveJobId(null);
          if (pendingToastId) {
            toast.dismiss(pendingToastId);
            setPendingToastId(null);
          }
          setIsSending(false);
          setHasSentSuccessfully(true);
          toast.success(copy.garminJobSuccess);
        } else if (job.status === "failed") {
          setActiveJobId(null);
          if (pendingToastId) {
            toast.dismiss(pendingToastId);
            setPendingToastId(null);
          }
          setIsSending(false);
          setHasSentSuccessfully(false);
          toast.error(copy.garminJobFailed, { description: job.error ?? copy.garminJobFailedDescription });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("unable to poll garmin trainer job", error);
        }
      }
    };

    poll();
    const intervalId = window.setInterval(poll, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeJobId, pendingToastId, copy.garminJobFailed, copy.garminJobFailedDescription, copy.garminJobSuccess]);

  const isSwimmingPlan = (planCompatibility.sportId ?? "").toUpperCase() === "LAP_SWIMMING";
  const showSwimmingDualActions = planCompatibility.isGarminCompatible && isSwimmingPlan;
  const incompatibleContext =
    planCompatibility.sportLabel ?? planCompatibility.blocker ?? copy.compatibilityFallbackContext;

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur">
        <CardHeader>
          <CardTitle>{copy.briefingTitle}</CardTitle>
          <CardDescription>{copy.briefingDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" requiredIndicator>
                {copy.promptLabel}
              </Label>
              <Textarea
                id="prompt"
                name="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                placeholder={copy.promptPlaceholder}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading} data-gtm="generate-workout">
              {isLoading ? loadingMessage : copy.generateButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      {plan ? (
        <Card className="text-sm leading-relaxed text-white">
          <CardHeader>
            <CardTitle>{copy.planCardTitle}</CardTitle>
          </CardHeader>
          <CardContent className={enableInlineSend ? "space-y-6" : undefined}>
            <MarkdownPlan content={plan} className="text-sm leading-relaxed" />
            {enableInlineSend ? (
              <div className="border-t border-white/10 pt-4">
                <div className={showSwimmingDualActions ? "flex flex-col gap-2 sm:flex-row" : undefined}>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={planCompatibility.isGarminCompatible ? handleSendToGarmin : handleDownloadPdf}
                    disabled={planCompatibility.isGarminCompatible ? isSending || hasSentSuccessfully : false}
                    isLoading={planCompatibility.isGarminCompatible ? isSending : false}
                    data-gtm="send-garmin"
                  >
                    {planCompatibility.isGarminCompatible
                      ? hasSentSuccessfully
                        ? copy.sendButtonSentLabel
                        : isSending
                        ? sendLoadingMessage
                        : copy.sendButtonLabel
                      : copy.sendButtonFallbackLabel}
                  </Button>
                  {showSwimmingDualActions ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleDownloadPdf}
                      data-gtm="download-plan"
                    >
                      {copy.downloadButtonLabel}
                    </Button>
                  ) : null}
                </div>
                {!planCompatibility.isGarminCompatible ? (
                  <p className="mt-2 text-xs text-muted-foreground">{copy.compatibilityWarning(incompatibleContext)}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
