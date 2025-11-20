"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AiModel = {
  id: string;
  label: string;
};

type FeatureState = {
  id: string;
  label: string;
  currentModel: string;
};

type AdminAiModelManagerProps = {
  availableModels: AiModel[];
  features: FeatureState[];
};

export function AdminAiModelManager({ availableModels, features }: AdminAiModelManagerProps) {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState(features);

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
        throw new Error(payload?.error ?? "Mise à jour impossible");
      }
      const data = (await response.json()) as { features: FeatureState[] };
      setState(data.features);
      toast.success("Modèle IA mis à jour");
    } catch (error) {
      toast.error("Modification refusée", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {state.map((feature) => (
        <Card key={feature.id}>
          <CardHeader>
            <CardTitle className="text-base">{feature.label}</CardTitle>
            <CardDescription>Choisis le modèle utilisé pour cette fonctionnalité.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={feature.currentModel}
              onValueChange={(value) => handleChange(feature.id, value)}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Le changement est appliqué dès la sélection.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
