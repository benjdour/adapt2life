const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_RETRIES = 2;
const MIN_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 5_000;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_ENDPOINT = process.env.OPENROUTER_CHAT_PATH ?? "/chat/completions";

const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiMetadata = {
  referer?: string | null;
  title?: string | null;
};

export type AiChatRequest = {
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  stop?: string[];
  metadata?: AiMetadata;
  timeoutMs?: number;
  maxRetries?: number;
};

export type AiChatResponse = {
  status: number;
  headers: Headers;
  rawText: string;
  data: Record<string, unknown> | null;
  parseError?: string | null;
};

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export class AiRequestError extends Error {
  public readonly status: number;
  public readonly body?: string | null;

  constructor(message: string, options?: { status?: number; body?: string | null; cause?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AiRequestError";
    this.status = options?.status ?? 0;
    this.body = options?.body ?? null;
  }
}

const fetchWithTimeout = async (input: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AiRequestError) {
    return RETRYABLE_STATUS.has(error.status) || error.status === 0;
  }
  if (error instanceof Error) {
    return error.name === "AbortError";
  }
  return false;
};

const buildHeaders = (apiKey: string, metadata?: AiMetadata): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (metadata?.referer) {
    headers["HTTP-Referer"] = metadata.referer;
  }
  if (metadata?.title) {
    headers["X-Title"] = metadata.title;
  }

  return headers;
};

const buildPayload = (request: AiChatRequest) => {
  const payload: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
  };

  if (typeof request.temperature === "number") {
    payload.temperature = request.temperature;
  }
  if (typeof request.maxOutputTokens === "number") {
    payload.max_tokens = request.maxOutputTokens;
    payload.max_output_tokens = request.maxOutputTokens;
  }
  if (request.stop && request.stop.length > 0) {
    payload.stop = request.stop;
  }

  return payload;
};

const parseJson = (rawText: string): { data: Record<string, unknown> | null; error: string | null } => {
  if (!rawText) {
    return { data: null, error: null };
  }
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return { data: parsed, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse error";
    return { data: null, error: message };
  }
};

const requestOnce = async (request: AiChatRequest): Promise<AiChatResponse> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiConfigurationError("OPENROUTER_API_KEY manquant côté serveur.");
  }

  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const baseUrl = sanitizeBaseUrl(OPENROUTER_BASE_URL);
  const endpoint = OPENROUTER_ENDPOINT.startsWith("/")
    ? OPENROUTER_ENDPOINT
    : `/${OPENROUTER_ENDPOINT}`;
  const url = `${baseUrl}${endpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: buildHeaders(apiKey, request.metadata),
      body: JSON.stringify(buildPayload(request)),
    },
    timeoutMs,
  );

  const rawText = await response.text();
  if (!response.ok) {
    throw new AiRequestError(`AI provider returned status ${response.status}`, {
      status: response.status,
      body: rawText,
    });
  }

  const { data, error } = parseJson(rawText);

  return {
    status: response.status,
    headers: response.headers,
    rawText,
    data,
    parseError: error,
  };
};

export const requestChatCompletion = async (request: AiChatRequest): Promise<AiChatResponse> => {
  const maxRetries = request.maxRetries ?? DEFAULT_MAX_RETRIES;
  let attempt = 0;
  let lastError: AiRequestError | null = null;

  while (attempt <= maxRetries) {
    try {
      return await requestOnce(request);
    } catch (error) {
      if (error instanceof AiConfigurationError) {
        throw error;
      }
      const aiError =
        error instanceof AiRequestError
          ? error
          : new AiRequestError("AI request failed", { cause: error });

      lastError = aiError;
      if (attempt >= maxRetries || !isRetryableError(aiError)) {
        throw aiError;
      }

      const backoff = Math.min(MIN_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
      console.warn("ai: retrying after failure", {
        model: request.model,
        attempt: attempt + 1,
        status: aiError.status,
      });
      await sleep(backoff);
    }
    attempt += 1;
  }

  throw lastError ?? new AiRequestError("AI request failed after retries");
};
