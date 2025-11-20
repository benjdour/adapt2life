export type AiModelEntry = {
  id: string;
  label: string;
};

export type AiModelId = string;

export const FALLBACK_AI_MODELS: ReadonlyArray<AiModelEntry> = [
  { id: "openai/gpt-5", label: "OpenAI GPT-5" },
  { id: "openai/gpt-5-mini", label: "OpenAI GPT-5 Mini" },
  { id: "openai/gpt-4.1", label: "OpenAI GPT-4.1" },
  { id: "openai/gpt-4o", label: "OpenAI GPT-4o" },
  { id: "openai/gpt-4o-mini", label: "OpenAI GPT-4o Mini" },
  { id: "anthropic/claude-3.5-sonnet", label: "Anthropic Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3.5-haiku-20241022", label: "Anthropic Claude 3.5 Haiku (2024-10-22)" },
  { id: "anthropic/claude-3-opus", label: "Anthropic Claude 3 Opus" },
  { id: "google/gemini-1.5-pro", label: "Google Gemini 1.5 Pro" },
  { id: "google/gemini-1.5-flash", label: "Google Gemini 1.5 Flash" },
  { id: "mistralai/mistral-large-2411", label: "Mistral Large 24.11" },
];

export const sanitizeModelId = (modelId: string | undefined | null, fallback: AiModelId): AiModelId => {
  const normalized = typeof modelId === "string" ? modelId.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
};
