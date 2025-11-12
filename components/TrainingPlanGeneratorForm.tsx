"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { MarkdownPlan } from "@/components/MarkdownPlan";
import { TRAINING_LOADING_MESSAGES } from "@/constants/loadingMessages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppError, describeAppError, getErrorDescriptor } from "@/lib/errors";

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
      const descriptor = getErrorDescriptor("training-plan/empty-brief");
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
        throw new AppError("training-plan/request-failed", {
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
      onPlanGenerated?.({
        plan: humanPlan,
        rawPlan: fallbackRaw,
      });
      toast.success("Plan généré avec succès", {
        description: "Tu peux le consulter et le convertir juste en dessous.",
      });
    } catch (submissionError) {
      const descriptor = describeAppError(submissionError, "training-plan/request-failed");
      toast.error(descriptor.title, { description: descriptor.description });
      onPlanGenerated?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur">
        <CardHeader>
          <CardTitle>Briefing d’entraînement</CardTitle>
          <CardDescription>
            Décris ton objectif, tes contraintes et ton ressenti du jour pour générer une séance adaptée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" requiredIndicator>
                Que veux-tu faire aujourd’hui et quelles sont tes contraintes ?
              </Label>
              <Textarea
                id="prompt"
                name="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                placeholder="Ex. je veux faire une séance cardio de 45 min, genou fragile, pas d’équipement, dispo ce soir."
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
              {isLoading ? loadingMessage : "Générer le plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {plan ? (
        <Card className="text-sm leading-relaxed text-white">
          <CardHeader>
            <CardTitle>Plan d’entraînement personnalisé</CardTitle>
            <CardDescription className="text-white/70">Garde ce rendu en référence ou convertis-le en JSON Garmin.</CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownPlan content={plan} className="text-sm leading-relaxed" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
