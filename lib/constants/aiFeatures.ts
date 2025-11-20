import { sanitizeModelId, type AiModelId } from "@/lib/constants/aiModels";

export type AiFeatureId = "training-plan" | "garmin-trainer";

type AiFeatureConfig = {
  id: AiFeatureId;
  label: string;
  defaultModel: AiModelId;
  fallbackModels: AiModelId[];
};

const TRAINING_PLAN_DEFAULT_MODEL = sanitizeModelId(process.env.TRAINING_PLAN_MODEL, "openai/gpt-5");
const GARMIN_TRAINER_DEFAULT_MODEL = sanitizeModelId(process.env.GARMIN_TRAINER_MODEL, "openai/gpt-5");

export const AI_FEATURES: Record<AiFeatureId, AiFeatureConfig> = {
  "training-plan": {
    id: "training-plan",
    label: "Générateur de plan",
    defaultModel: TRAINING_PLAN_DEFAULT_MODEL,
    fallbackModels: ["openai/gpt-5-mini", "anthropic/claude-3.5-haiku-20241022"],
  },
  "garmin-trainer": {
    id: "garmin-trainer",
    label: "Conversion Garmin JSON",
    defaultModel: GARMIN_TRAINER_DEFAULT_MODEL,
    fallbackModels: ["openai/gpt-5-mini"],
  },
};

export const AI_FEATURE_LIST = Object.values(AI_FEATURES);
