import { eq } from "drizzle-orm";

import { db } from "@/db";
import { aiModelConfigs } from "@/db/schema";
import { FALLBACK_AI_MODELS, sanitizeModelId, type AiModelId } from "@/lib/constants/aiModels";
import { AI_FEATURES, type AiFeatureId } from "@/lib/constants/aiFeatures";
import { getAvailableAiModels } from "@/lib/services/openRouterModels";

const featureIds = Object.keys(AI_FEATURES) as AiFeatureId[];

const DEFAULT_MODEL_MAP: Record<AiFeatureId, AiModelId> = featureIds.reduce(
  (acc, id) => {
    acc[id] = AI_FEATURES[id].defaultModel;
    return acc;
  },
  {} as Record<AiFeatureId, AiModelId>,
);

export const listAiModelConfigs = async (): Promise<Record<AiFeatureId, AiModelId>> => {
  let rows: { featureId: string; modelId: string }[] = [];

  try {
    rows = await db.select().from(aiModelConfigs);
  } catch (error) {
    console.warn("AI model config store unavailable, falling back to defaults", error);
    return { ...DEFAULT_MODEL_MAP };
  }

  const result: Record<AiFeatureId, AiModelId> = { ...DEFAULT_MODEL_MAP };

  rows.forEach((row) => {
    if (featureIds.includes(row.featureId as AiFeatureId)) {
      const feature = row.featureId as AiFeatureId;
      result[feature] = sanitizeModelId(row.modelId, DEFAULT_MODEL_MAP[feature]);
    }
  });

  return result;
};

export const getAiModelForFeature = async (featureId: AiFeatureId): Promise<AiModelId> => {
  const configs = await listAiModelConfigs();
  return configs[featureId] ?? DEFAULT_MODEL_MAP[featureId];
};

export const getAiModelCandidates = async (featureId: AiFeatureId): Promise<AiModelId[]> => {
  const selected = await getAiModelForFeature(featureId);
  const fallback = AI_FEATURES[featureId].fallbackModels;
  const ordered = [selected, ...fallback];
  const unique = ordered.filter((model, index) => ordered.indexOf(model) === index);
  return unique;
};

export const saveAiModelForFeature = async (featureId: AiFeatureId, modelId: AiModelId, updatedBy?: string | null) => {
  const normalizedModelId = sanitizeModelId(modelId, DEFAULT_MODEL_MAP[featureId]);
  const availableModels = await getAvailableAiModels();
  const allowedIds = new Set(availableModels.map((model) => model.id));

  if (!allowedIds.has(normalizedModelId)) {
    throw new Error("Modèle IA indisponible ou non supporté sur OpenRouter.");
  }

  try {
    const existing = await db
      .select({ featureId: aiModelConfigs.featureId })
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.featureId, featureId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(aiModelConfigs)
        .set({ modelId: normalizedModelId, updatedBy: updatedBy ?? null, updatedAt: new Date() })
        .where(eq(aiModelConfigs.featureId, featureId));
    } else {
      await db.insert(aiModelConfigs).values({
        featureId,
        modelId: normalizedModelId,
        updatedBy: updatedBy ?? null,
      });
    }
  } catch (error) {
    console.warn("Unable to persist AI model config, falling back to defaults", error);
    throw new Error("Impossible d’enregistrer ce réglage tant que la base n’est pas à jour (migration en attente).");
  }
};

export const buildAiModelAdminSnapshot = async () => {
  const configs = await listAiModelConfigs();
  const availableModels = await getAvailableAiModels();
  const features = featureIds.map((featureId) => ({
    id: featureId,
    label: AI_FEATURES[featureId].label,
    currentModel: configs[featureId] ?? DEFAULT_MODEL_MAP[featureId],
  }));
  return {
    features,
    availableModels: availableModels.length > 0 ? availableModels : [...FALLBACK_AI_MODELS],
  };
};
