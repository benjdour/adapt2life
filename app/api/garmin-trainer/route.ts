import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const REQUEST_SCHEMA = z.object({
  exampleMarkdown: z
    .string()
    .trim()
    .min(1, "Merci de fournir un exemple d’entraînement en Markdown.")
    .max(20000, "L’exemple est trop volumineux (max 20 000 caractères)."),
});

const FALLBACK_SYSTEM_PROMPT =
  "Tu es un assistant spécialisé dans la préparation d’entraînements Garmin pour Adapt2Life. " +
  "Analyse l’exemple fourni et applique fidèlement les instructions du prompt utilisateur.";

type OpenRouterChoice = {
  message?: {
    content?: unknown;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

const flattenContent = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenContent(item));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const segments: string[] = [];
    if (typeof record.text === "string") {
      segments.push(record.text);
    }
    if (typeof record.content === "string") {
      segments.push(record.content);
    }
    if (Array.isArray(record.content)) {
      segments.push(...flattenContent(record.content));
    }
    if (Array.isArray(record.parts)) {
      segments.push(...flattenContent(record.parts));
    }
    if (Array.isArray(record.messages)) {
      segments.push(...flattenContent(record.messages));
    }
    if (typeof record.json === "object" && record.json !== null) {
      try {
        const serialized = JSON.stringify(record.json);
        if (serialized) {
          segments.push(serialized);
        }
      } catch {
        // ignore serialization issues
      }
    }
    return segments;
  }
  return [];
};

const extractMessageText = (choice: OpenRouterChoice | undefined): string | null => {
  if (!choice?.message) {
    return null;
  }

  const { content } = choice.message;
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(content)) {
    const segments = flattenContent(content)
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return segments.join("\n\n");
    }
  }

  return null;
};

const buildFinalPrompt = (template: string, example: string): string => {
  if (template.includes("{{EXAMPLE_MARKDOWN}}")) {
    return template.replaceAll("{{EXAMPLE_MARKDOWN}}", example);
  }
  return `${template.trim()}\n\n---\nExemple d’entraînement (Markdown) :\n${example}`;
};

const GARMIN_PROMPT_FILENAME = "docs/garmin_trainer_prompt.txt";

let cachedPromptTemplate: string | null | undefined;

const loadPromptTemplate = async (): Promise<string | null> => {
  if (cachedPromptTemplate !== undefined) {
    return cachedPromptTemplate;
  }

  const envPrompt = process.env.GARMIN_TRAINER_PROMPT;
  if (envPrompt && envPrompt.trim()) {
    cachedPromptTemplate = envPrompt;
    return cachedPromptTemplate;
  }

  try {
    const fileBuffer = await readFile(resolve(process.cwd(), GARMIN_PROMPT_FILENAME));
    cachedPromptTemplate = fileBuffer.toString("utf8").trim();
    return cachedPromptTemplate || null;
  } catch {
    cachedPromptTemplate = null;
    return null;
  }
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide : impossible de lire le JSON." }, { status: 400 });
  }

  const validation = REQUEST_SCHEMA.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { exampleMarkdown } = validation.data;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY manquant côté serveur. Ajoute la clé API OpenRouter dans l’environnement." },
      { status: 500 },
    );
  }

  const promptTemplate = await loadPromptTemplate();
  if (!promptTemplate) {
    return NextResponse.json(
      {
        error:
          "Prompt Garmin introuvable. Ajoute la variable d’environnement GARMIN_TRAINER_PROMPT ou place un fichier docs/garmin_trainer_prompt.txt sur le serveur.",
      },
      { status: 500 },
    );
  }

  const modelId = process.env.GARMIN_TRAINER_MODEL ?? "openai/gpt-5";
  const systemPrompt = process.env.GARMIN_TRAINER_SYSTEM_PROMPT ?? FALLBACK_SYSTEM_PROMPT;

  const inferredOrigin =
    request.headers.get("origin") ??
    request.headers.get("referer") ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("host") ?? "localhost"}`;
  const referer = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? inferredOrigin ?? "http://localhost:3000";

  const userPrompt = buildFinalPrompt(promptTemplate, exampleMarkdown);

  const completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterKey}`,
      "HTTP-Referer": referer,
      "X-Title": "Adapt2Life Garmin Trainer",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!completionResponse.ok) {
    const payload = await completionResponse
      .json()
      .catch(async () => ({ error: await completionResponse.text().catch(() => null) }));

    if (completionResponse.status === 429) {
      return NextResponse.json(
        {
          error:
            "Le service d’IA est momentanément saturé. Réessaie dans quelques instants ou ajuste la fréquence des requêtes.",
          details: payload,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "La génération de l’entraînement a échoué via OpenRouter.",
        details: payload,
      },
      { status: completionResponse.status },
    );
  }

  const completionJson = (await completionResponse.json()) as OpenRouterResponse;
  const messageText = extractMessageText(completionJson.choices?.[0]);
  if (!messageText) {
    return NextResponse.json(
      {
        error: "Réponse vide ou illisible renvoyée par le modèle.",
        details: completionJson,
      },
      { status: 502 },
    );
  }

  const trimmedMessage = messageText.trim();

  try {
    const parsedJson = JSON.parse(trimmedMessage) as unknown;
    return NextResponse.json({ trainingJson: parsedJson, raw: trimmedMessage });
  } catch {
    return NextResponse.json(
      {
        error:
          "Le modèle a renvoyé un contenu qui n’est pas un JSON valide. Vérifie le prompt ou réessaie avec un autre exemple.",
        raw: trimmedMessage,
      },
      { status: 502 },
    );
  }
}
