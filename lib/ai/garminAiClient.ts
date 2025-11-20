import { requestChatCompletion, AiConfigurationError, AiRequestError } from "@/lib/ai";
import { exerciseLookupTool } from "@/lib/ai/exerciseLookupTool";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { extractMessageText, type OpenRouterResponse } from "@/lib/ai/openRouterResponse";

type GenerateRequest = {
  basePrompt: string;
  systemPrompt: string;
  modelIds: string[];
  referer: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type GarminAiResult = {
  rawText: string;
  data: Record<string, unknown> | null;
  parseError: string | null;
};

export type GarminAiClient = {
  generate: (request: GenerateRequest) => Promise<GarminAiResult>;
};

export const createClassicGarminAiClient = (): GarminAiClient => ({
  async generate({ basePrompt, systemPrompt, modelIds, referer, temperature = 0.7, maxOutputTokens = 32_768 }) {
    let lastError: AiRequestError | null = null;

    for (const modelId of modelIds) {
      try {
        const response = await requestChatCompletion({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: basePrompt },
          ],
          temperature,
          maxOutputTokens,
          metadata: { referer, title: "Adapt2Life Garmin Trainer" },
        });

        const completionJson = (response.data ?? null) as OpenRouterResponse | null;
        let rawText: string;

        if (completionJson) {
          const messageText = extractMessageText(completionJson.choices?.[0]);
          rawText = messageText && messageText.trim() ? messageText.trim() : JSON.stringify(completionJson, null, 2);
        } else {
          rawText = response.rawText;
        }

        let data: Record<string, unknown> | null = null;
        let parseError: string | null = response.parseError ?? null;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
            parseError = null;
          } catch (error) {
            parseError = error instanceof Error ? error.message : "JSON parse error";
          }
        }

        return {
          rawText,
          data,
          parseError,
        };
      } catch (error) {
        if (error instanceof AiConfigurationError) {
          throw error;
        }
        lastError = error instanceof AiRequestError ? error : new AiRequestError("AI request failed", { cause: error });
      }
    }

    throw lastError ?? new AiRequestError("AI request failed", { status: 500 });
  },
});

export const createStrictGarminAiClient = (): GarminAiClient => ({
  async generate({ basePrompt, systemPrompt, modelIds, referer, temperature = 0.7, maxOutputTokens = 32_768 }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new AiConfigurationError("OPENROUTER_API_KEY manquant côté serveur.");
    }

    const openai = createOpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": referer,
        "X-Title": "Adapt2Life Garmin Trainer",
      },
    });

    let lastError: Error | null = null;

    for (const modelId of modelIds) {
      try {
        const result = await generateText({
          model: openai(modelId),
          system: systemPrompt,
          prompt: basePrompt,
          tools: { exercise_lookup: exerciseLookupTool },
          temperature,
          maxOutputTokens,
        });

        const text = (result.text ?? "").trim();
        let rawText = text;

        if (!rawText) {
          const responseMessages = result.response?.messages ?? [];
          if (responseMessages.length > 0) {
            rawText = JSON.stringify(responseMessages, null, 2);
          } else if (result.toolResults?.length) {
            rawText = JSON.stringify(result.toolResults, null, 2);
          } else {
            rawText = "";
          }
        }

        let data: Record<string, unknown> | null = null;
        let parseError: string | null = null;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
          } catch (error) {
            parseError = error instanceof Error ? error.message : "JSON parse error";
          }
        }

        return {
          rawText,
          data,
          parseError,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError ?? new Error("AI request failed (strict mode)");
  },
});

export type GarminAiClientBundle = {
  classic: GarminAiClient;
  strict: GarminAiClient;
};

export type GarminAiClientFactory = () => GarminAiClientBundle;

const defaultGarminAiClientFactory: GarminAiClientFactory = () => ({
  classic: createClassicGarminAiClient(),
  strict: createStrictGarminAiClient(),
});

let activeGarminAiClientFactory: GarminAiClientFactory = defaultGarminAiClientFactory;

export const setGarminAiClientFactory = (factory: GarminAiClientFactory | null | undefined) => {
  activeGarminAiClientFactory = factory ?? defaultGarminAiClientFactory;
};

export const getGarminAiClients = (): GarminAiClientBundle => activeGarminAiClientFactory();
