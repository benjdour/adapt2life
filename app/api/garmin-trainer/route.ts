import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { workoutSchema } from "@/schemas/garminTrainer.schema";

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

type OpenRouterToolCall = {
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type OpenRouterChoice = {
  message?: {
    content?: unknown;
    function_call?: {
      arguments?: string;
    };
    tool_calls?: OpenRouterToolCall[];
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

  const segments: string[] = [];

  const pushContent = (value: unknown) => {
    const flattened = flattenContent(value)
      .map((segment) => segment.trim())
      .filter(Boolean);
    segments.push(...flattened);
  };

  pushContent(choice.message.content);

  const functionArgs = choice.message.function_call?.arguments;
  if (typeof functionArgs === "string" && functionArgs.trim()) {
    segments.push(functionArgs.trim());
  }

  if (Array.isArray(choice.message.tool_calls)) {
    for (const call of choice.message.tool_calls) {
      const args = call.function?.arguments;
      if (typeof args === "string" && args.trim()) {
        segments.push(args.trim());
      }
    }
  }

  return segments.length > 0 ? segments.join("\n\n") : null;
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

const ensureLocalUser = async (
  stackUserId: string,
  stackUserEmail?: string | null,
  stackUserName?: string | null,
): Promise<{ id: number; stackId: string }> => {
  const [existing] = await db
    .select({ id: users.id, stackId: users.stackId })
    .from(users)
    .where(eq(users.stackId, stackUserId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const fallbackEmail = stackUserEmail && stackUserEmail.trim().length > 0 ? stackUserEmail : `${stackUserId}@adapt2life.local`;

  const [inserted] = await db
    .insert(users)
    .values({
      stackId: stackUserId,
      email: fallbackEmail,
      name: stackUserName ?? null,
    })
    .returning({ id: users.id, stackId: users.stackId });

  if (!inserted) {
    throw new Error("Impossible de créer l’utilisateur local Adapt2Life.");
  }

  return inserted;
};

const resolveOwnerContext = async (
  request: NextRequest,
): Promise<{ ownerId: string | null; ownerInstruction: string; requireWarning: boolean }> => {
  try {
    const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
    if (!stackUser) {
      return {
        ownerId: null,
        ownerInstruction:
          "Aucun utilisateur identifié : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
        requireWarning: true,
      };
    }

    const localUser = await ensureLocalUser(stackUser.id, stackUser.primaryEmail, stackUser.displayName);

    const garminRecord = await db
      .select({ garminUserId: garminConnections.garminUserId })
      .from(garminConnections)
      .where(eq(garminConnections.userId, localUser.id))
      .limit(1);

    const garminUserId = garminRecord[0]?.garminUserId ?? null;

    if (garminUserId) {
      return {
        ownerId: garminUserId,
        ownerInstruction: `Utilise strictement \"ownerId\": \"${garminUserId}\" (premier champ du JSON) et ne modifie jamais cette valeur.`,
        requireWarning: false,
      };
    }

    return {
      ownerId: null,
      ownerInstruction:
        "Identifiant Garmin introuvable : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
      requireWarning: true,
    };
  } catch {
    return {
      ownerId: null,
      ownerInstruction:
        "Erreur d’identification : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
      requireWarning: true,
    };
  }
};

const normalizeWorkoutPayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeWorkoutPayload(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const sanitized: Record<string, unknown> = {};

    for (const [key, raw] of entries) {
      if (raw === null || raw === undefined) {
        continue;
      }

      const normalized = normalizeWorkoutPayload(raw);

      if (key === "intensity" && typeof normalized === "string") {
        if (normalized === "REST") {
          sanitized[key] = "COOLDOWN";
          continue;
        }
        if (normalized === "ACTIVE") {
          sanitized[key] = "INTERVAL";
          continue;
        }
      }

      if (key === "type" && normalized === "WorkoutRepeatStep") {
        sanitized[key] = "WorkoutStep";
        continue;
      }

      sanitized[key] = normalized;
    }

    if ("segmentOrder" in sanitized) {
      const maybeDistance = sanitized["estimatedDistanceInMeters"];
      if (typeof maybeDistance !== "number") {
        sanitized["estimatedDistanceInMeters"] = 0;
      }
    }

    return sanitized;
  }

  return value;
};

export async function POST(request: NextRequest) {
  const ownerContext = await resolveOwnerContext(request);

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

  const userPrompt = [ownerContext.ownerInstruction, buildFinalPrompt(promptTemplate, exampleMarkdown)].join("\n\n");

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
      max_tokens: 32768,
      max_output_tokens: 32768,
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

  const completionPayload = await completionResponse.text();
  let completionJson: OpenRouterResponse | null = null;
  let parseErrorMessage: string | null = null;

  if (completionPayload) {
    try {
      completionJson = JSON.parse(completionPayload) as OpenRouterResponse;
    } catch (parseError) {
      completionJson = null;
      parseErrorMessage =
        parseError instanceof Error ? parseError.message : "Erreur de parsing JSON inconnue.";
    }
  }

  if (!completionJson) {
    return NextResponse.json(
      {
        raw: completionPayload,
        parseError:
          parseErrorMessage ??
          "Impossible d’interpréter la réponse d’OpenRouter comme JSON. Consulte le champ 'raw' pour inspecter le contenu brut.",
      },
      { status: 200 },
    );
  }

  const messageText = extractMessageText(completionJson.choices?.[0]);

  let rawContent: string;
  if (messageText && messageText.trim()) {
    rawContent = messageText.trim();
  } else {
    rawContent = JSON.stringify(completionJson, null, 2);
  }

  let parsedJson: unknown | undefined;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    parsedJson = undefined;
  }

  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    const workout = parsedJson as Record<string, unknown>;
    workout.ownerId = ownerContext.ownerId;

    if (ownerContext.requireWarning) {
      const description = typeof workout.description === "string" ? workout.description : "";
      if (!description.includes("(ownerId non défini — utilisateur non identifié)")) {
        workout.description = description
          ? `${description.trim()} (ownerId non défini — utilisateur non identifié)`
          : "(ownerId non défini — utilisateur non identifié)";
      }
    }

    const normalizedWorkout = normalizeWorkoutPayload(workout) as Record<string, unknown>;

    const validation = workoutSchema.safeParse(normalizedWorkout);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "L’entraînement généré ne respecte pas le schéma attendu.",
          issues: validation.error.issues,
          raw: JSON.stringify(normalizedWorkout, null, 2),
        },
        { status: 422 },
      );
    }

    parsedJson = validation.data;
    rawContent = JSON.stringify(validation.data, null, 2);
  }

  return NextResponse.json(
    parsedJson === undefined ? { raw: rawContent } : { trainingJson: parsedJson, raw: rawContent },
  );
}
