import { FALLBACK_AI_MODELS, type AiModelEntry } from "@/lib/constants/aiModels";

type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
};

type OpenRouterResponse = {
  data?: OpenRouterModel[];
};

const OPENROUTER_MODELS_ENDPOINT = process.env.OPENROUTER_MODELS_ENDPOINT ?? "https://openrouter.ai/api/v1/models";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

let cachedModels: { expiresAt: number; value: AiModelEntry[] } | null = null;

const mapModels = (models: OpenRouterModel[]): AiModelEntry[] => {
  const seen = new Set<string>();
  const entries: AiModelEntry[] = [];

  models.forEach((item) => {
    const id = item.id?.trim();
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    entries.push({
      id,
      label: item.name?.trim() || id,
    });
  });

  return entries.length > 0 ? entries : [...FALLBACK_AI_MODELS];
};

export const getAvailableAiModels = async (): Promise<AiModelEntry[]> => {
  const now = Date.now();
  if (cachedModels && cachedModels.expiresAt > now) {
    return cachedModels.value;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    cachedModels = { expiresAt: now + CACHE_TTL_MS, value: [...FALLBACK_AI_MODELS] };
    return cachedModels.value;
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter models request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OpenRouterResponse;
    const mapped = mapModels(payload.data ?? []);
    cachedModels = { expiresAt: now + CACHE_TTL_MS, value: mapped };
    return mapped;
  } catch (error) {
    console.warn("Unable to fetch OpenRouter models, falling back to static list", error);
    cachedModels = { expiresAt: now + CACHE_TTL_MS, value: [...FALLBACK_AI_MODELS] };
    return cachedModels.value;
  }
};
