"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiModelEntry } from "@/lib/constants/aiModels";
import { Locale } from "@/lib/i18n/locales";

type FeatureState = {
  id: string;
  label: string;
  currentModel: string;
};

type AdminAiModelManagerProps = {
  availableModels: ReadonlyArray<AiModelEntry>;
  features: ReadonlyArray<FeatureState>;
  locale: Locale;
};

const FEATURE_LABELS: Record<Locale, Record<string, string>> = {
  fr: {
    "training-plan": "Générateur de plan",
    "garmin-trainer": "Conversion Garmin JSON",
  },
  en: {
    "training-plan": "Plan generator",
    "garmin-trainer": "Garmin JSON conversion",
  },
};

const COPY = {
  fr: {
    description: "Choisis le modèle utilisé pour cette fonctionnalité.",
    placeholder: "Sélectionner un modèle",
    applied: "Le changement est appliqué dès la sélection.",
    success: "Modèle IA mis à jour",
    errorTitle: "Modification refusée",
    errorDefault: "Mise à jour impossible",
  },
  en: {
    description: "Choose which model powers this feature.",
    placeholder: "Select a model",
    applied: "Changes apply immediately after selection.",
    success: "AI model updated",
    errorTitle: "Update rejected",
    errorDefault: "Unable to update model",
  },
} satisfies Record<Locale, {
  description: string;
  placeholder: string;
  applied: string;
  success: string;
  errorTitle: string;
  errorDefault: string;
}>;

export function AdminAiModelManager({ availableModels, features, locale }: AdminAiModelManagerProps) {
  const copy = COPY[locale] ?? COPY.fr;
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<FeatureState[]>(() => features.map((feature) => ({ ...feature })));

  const handleChange = async (featureId: string, modelId: string) => {
    setPending(true);
    try {
      const response = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId, modelId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? copy.errorDefault);
      }
      const data = (await response.json()) as { features: FeatureState[] };
      setState(data.features);
      toast.success(copy.success);
    } catch (error) {
      toast.error(copy.errorTitle, {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {state.map((feature) => {
        const label = FEATURE_LABELS[locale]?.[feature.id] ?? feature.label;
        return (
        <Card key={feature.id}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={feature.currentModel}
              onValueChange={(value) => handleChange(feature.id, value)}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder={copy.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{copy.applied}</p>
          </CardContent>
        </Card>
      );
      })}
    </div>
  );
}
