import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { workoutSchema } from "@/schemas/garminTrainer.schema";
import { saveGarminWorkoutForUser } from "@/lib/services/userGeneratedArtifacts";

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
): Promise<{ ownerId: string | null; ownerInstruction: string; requireWarning: boolean; localUserId: number | null }> => {
  try {
    const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
    if (!stackUser) {
      return {
        ownerId: null,
        ownerInstruction:
          "Aucun utilisateur identifié : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
        requireWarning: true,
        localUserId: null,
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
        localUserId: localUser.id,
      };
    }

    return {
      ownerId: null,
      ownerInstruction:
        "Identifiant Garmin introuvable : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
      requireWarning: true,
      localUserId: localUser.id,
    };
  } catch {
    return {
      ownerId: null,
      ownerInstruction:
        "Erreur d’identification : renseigne \"ownerId\": null et ajoute dans la description la mention \"(ownerId non défini — utilisateur non identifié)\".",
      requireWarning: true,
      localUserId: null,
    };
  }
};

const sanitizeWorkoutValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWorkoutValue(item));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(source)) {
      const cleaned = sanitizeWorkoutValue(raw);
      if (typeof cleaned === "string" && cleaned.trim().length === 0) {
        sanitized[key] = null;
        continue;
      }

      const numericKeys = new Set([
        "segmentOrder",
        "stepOrder",
        "repeatValue",
        "durationValue",
        "targetValue",
        "targetValueLow",
        "targetValueHigh",
        "secondaryTargetValue",
        "secondaryTargetValueLow",
        "secondaryTargetValueHigh",
        "estimatedDurationInSecs",
        "estimatedDistanceInMeters",
        "poolLength",
      ]);

      if (numericKeys.has(key) && typeof cleaned === "string") {
        const parsed = Number(cleaned);
        sanitized[key] = Number.isFinite(parsed) ? parsed : cleaned;
        continue;
      }

      sanitized[key] = cleaned;
    }

    if (sanitized.durationType === "OPEN") {
      sanitized.durationValue = null;
      sanitized.durationValueType = null;
    }

    const booleanKeys = new Set(["skipLastRestStep", "isSessionTransitionEnabled"]);
    for (const key of booleanKeys) {
      if (typeof sanitized[key] === "string") {
        if ((sanitized[key] as string).toLowerCase() === "true") {
          sanitized[key] = true;
        } else if ((sanitized[key] as string).toLowerCase() === "false") {
          sanitized[key] = false;
        }
      }
    }

    if (sanitized.type === "WorkoutRepeatStep") {
      sanitized.durationType = null;
      sanitized.durationValue = null;
      sanitized.durationValueType = null;
    }

    return sanitized;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  return value;
};

const enforceWorkoutPostProcessing = (workout: Record<string, unknown>): Record<string, unknown> => {
  const clone: Record<string, unknown> = { ...workout };

  const swimSegmentPoolValues: Array<{ length: number | null; unit: string | null }> = [];

  const inferRepeatIntensity = (repeatStep: Record<string, unknown>): string => {
    const childSteps = Array.isArray(repeatStep.steps) ? repeatStep.steps : [];
    const firstChild = childSteps.find((child) => child && typeof child === "object" && (child as Record<string, unknown>).intensity);
    if (firstChild && typeof (firstChild as Record<string, unknown>).intensity === "string") {
      const childIntensity = ((firstChild as Record<string, unknown>).intensity as string).trim();
      if (childIntensity) {
        return childIntensity;
      }
    }

    const effortChild = childSteps.find((child) => child && typeof child === "object" && (child as Record<string, unknown>).intensity !== "REST");
    if (effortChild && typeof (effortChild as Record<string, unknown>).intensity === "string") {
      const childIntensity = ((effortChild as Record<string, unknown>).intensity as string).trim();
      if (childIntensity) {
        return childIntensity;
      }
    }

    return "ACTIVE";
  };

  const normalizeSteps = (
    steps: unknown,
    isSwim: boolean,
    segmentIntensity: string | null,
  ): unknown => {
    if (!Array.isArray(steps)) {
      return steps;
    }

    const repeatPrefixPattern = /^\s*\d+\s*[x×]\s*/i;
    const distancePrefixPattern = /^\s*\d+\s*(m|km)\s*/i;
    const restSuffixPatterns = [
      /,\s*\d+\s*s\s*récup(?:ération)?/gi,
      /\+\s*\d+\s*s\s*récup(?:ération)?/gi,
      /\s*\d+\s*s\s*récup(?:ération)?$/gi,
    ];
    const stripLeadingPunctuation = (value: string) => value.replace(/^[,;:-]+\s*/, "");
    const trimTrailingPunctuation = (value: string) => value.replace(/\s*[,;:-]+\s*$/, "");

    const ensureCadenceTargets = (step: Record<string, unknown>) => {
      const description = typeof step.description === "string" ? step.description : "";
      if (!description || !/cadence/i.test(description)) {
        return;
      }

      const cadenceMatch = description.match(/cadence[^0-9]*(\d{2,3})(?:\D+(\d{2,3}))?/i);
      if (!cadenceMatch) {
        return;
      }

      const rawLow = cadenceMatch[1] ? Number.parseInt(cadenceMatch[1], 10) : NaN;
      const rawHigh = cadenceMatch[2] ? Number.parseInt(cadenceMatch[2], 10) : NaN;

      const low = Number.isFinite(rawLow) ? rawLow : null;
      const high = Number.isFinite(rawHigh) ? rawHigh : null;

      if (low == null && high == null) {
        return;
      }

      const hasPrimary =
        typeof step.targetType === "string" && step.targetType !== "" && step.targetType !== "OPEN";
      const cadenceRange = {
        low: low != null ? low : high,
        high: high != null ? high : low,
      };

      if (!hasPrimary || step.targetType === "CADENCE") {
        step.targetType = "CADENCE";
        step.targetValue = null;
        step.targetValueType = null;
        step.targetValueLow = cadenceRange.low ?? null;
        step.targetValueHigh = cadenceRange.high ?? cadenceRange.low ?? null;
        step.secondaryTargetType = null;
        step.secondaryTargetValue = null;
        step.secondaryTargetValueLow = null;
        step.secondaryTargetValueHigh = null;
        step.secondaryTargetValueType = null;
        return;
      }

      if (step.secondaryTargetType == null || step.secondaryTargetType === "CADENCE") {
        step.secondaryTargetType = "CADENCE";
        step.secondaryTargetValue = null;
        step.secondaryTargetValueType = null;
        step.secondaryTargetValueLow = cadenceRange.low ?? null;
        step.secondaryTargetValueHigh = cadenceRange.high ?? cadenceRange.low ?? null;
      }
    };

    const ensureRestDescriptions = (step: Record<string, unknown>) => {
      const durationType = typeof step.durationType === "string" ? step.durationType : null;
      const durationValue =
        typeof step.durationValue === "number" && Number.isFinite(step.durationValue) ? step.durationValue : null;
      const intensity = typeof step.intensity === "string" ? step.intensity : null;

      if (!durationValue) {
        return;
      }

      const baseDescription = typeof step.description === "string" ? step.description.trim() : "";

      if (durationType === "FIXED_REST") {
        if (!baseDescription || !/\d/.test(baseDescription)) {
          step.description = `Récupération ${durationValue} s`;
        }
        return;
      }

      if (durationType === "TIME" && intensity === "REST") {
        if (!baseDescription || !/\d/.test(baseDescription)) {
          step.description = `Repos ${durationValue} s`;
        }
      }
    };

    const normalizedSteps = steps
      .map((rawStep) => {
      if (!rawStep || typeof rawStep !== "object") {
        return rawStep;
      }

      const step = { ...(rawStep as Record<string, unknown>) };
      const type = step.type;

      if (!step.intensity && typeof segmentIntensity === "string" && segmentIntensity.trim().length > 0) {
        step.intensity = segmentIntensity;
      }

      if (type === "WorkoutRepeatStep" && Array.isArray(step.steps)) {
        const repeatIntensity =
          typeof step.intensity === "string" && step.intensity.trim().length > 0 ? step.intensity : segmentIntensity;
        step.steps = normalizeSteps(step.steps, isSwim, repeatIntensity ?? null) as unknown[];

        if (isSwim) {
          step.skipLastRestStep = true;
        }

        const targetKeys: Array<keyof typeof step> = [
          "targetType",
          "targetValue",
          "targetValueLow",
          "targetValueHigh",
          "targetValueType",
          "secondaryTargetType",
          "secondaryTargetValue",
          "secondaryTargetValueLow",
          "secondaryTargetValueHigh",
          "secondaryTargetValueType",
        ];
        for (const key of targetKeys) {
          step[key] = null;
        }

        if (typeof step.description === "string" && step.description.trim().length > 0) {
          let cleanedDescription = step.description.replace(repeatPrefixPattern, "");
          cleanedDescription = stripLeadingPunctuation(cleanedDescription).trim();

          cleanedDescription = cleanedDescription.replace(distancePrefixPattern, "").trim();
          restSuffixPatterns.forEach((pattern) => {
            cleanedDescription = cleanedDescription.replace(pattern, "").trim();
          });
          cleanedDescription = stripLeadingPunctuation(trimTrailingPunctuation(cleanedDescription)).trim();

          if (cleanedDescription.length === 0) {
            step.description = null;
          } else {
            step.description = cleanedDescription;
          }
        }

        if (!step.intensity) {
          step.intensity = inferRepeatIntensity(step);
        }
      } else if (type === "WorkoutStep" && Array.isArray(step.steps)) {
        // Sécurité : un WorkoutStep ne doit pas embarquer steps enfants
        step.steps = null;
      }

      if (type === "WorkoutStep") {
        ensureRestDescriptions(step);
      }

      ensureCadenceTargets(step);

      return step;
    })
      .filter((step) => {
        if (!step || typeof step !== "object") {
          return false;
        }

        const typed = step as Record<string, unknown>;
        if (typed.type !== "WorkoutStep") {
          return true;
        }

        if (typed.durationType == null || typed.durationValue == null) {
          return false;
        }

        return true;
      });

    return normalizedSteps;
  };

  if (Array.isArray(clone.segments)) {
    clone.segments = clone.segments.map((rawSegment) => {
      if (!rawSegment || typeof rawSegment !== "object") {
        return rawSegment;
      }

      const segment = { ...(rawSegment as Record<string, unknown>) };
      const sport = typeof segment.sport === "string" ? segment.sport : null;
      const isSwim = sport === "LAP_SWIMMING";
      const segmentIntensity = typeof segment.intensity === "string" ? segment.intensity : null;

    segment.steps = normalizeSteps(segment.steps, isSwim, segmentIntensity);

      if (isSwim) {
        const segPoolLength =
          typeof segment.poolLength === "number" && Number.isFinite(segment.poolLength)
            ? (segment.poolLength as number)
            : null;
        const segPoolUnit = typeof segment.poolLengthUnit === "string" ? segment.poolLengthUnit : null;

        swimSegmentPoolValues.push({ length: segPoolLength, unit: segPoolUnit });

        if (segPoolLength == null && typeof clone.poolLength === "number") {
          segment.poolLength = clone.poolLength;
        }
        if (segPoolUnit == null && typeof clone.poolLengthUnit === "string") {
          segment.poolLengthUnit = clone.poolLengthUnit;
        }
        if (segment.poolLength == null || segment.poolLengthUnit == null) {
          segment.poolLength = 25;
          segment.poolLengthUnit = "METER";
        }
      } else {
        segment.poolLength = null;
        segment.poolLengthUnit = null;
      }

      return segment;
    });
  }

  if (clone.sport === "MULTI_SPORT") {
    clone.isSessionTransitionEnabled = true;
    const firstSwimWithLength = swimSegmentPoolValues.find(({ length, unit }) => length != null && unit != null);
    if (firstSwimWithLength) {
      clone.poolLength = firstSwimWithLength.length;
      clone.poolLengthUnit = firstSwimWithLength.unit;
    }
    if (clone.poolLength == null || clone.poolLengthUnit == null) {
      clone.poolLength = 25;
      clone.poolLengthUnit = "METER";
    }
  } else if (clone.sport === "LAP_SWIMMING") {
    const preferred = swimSegmentPoolValues.find(({ length, unit }) => length != null && unit != null);
    if (preferred) {
      clone.poolLength = preferred.length;
      clone.poolLengthUnit = preferred.unit;
    } else {
      clone.poolLength = 25;
      clone.poolLengthUnit = "METER";
    }
  } else {
    clone.poolLength = null;
    clone.poolLengthUnit = null;
  }

  return clone;
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
    const workoutDraft = parsedJson as Record<string, unknown>;
    const workout: Record<string, unknown> = {
      ownerId: ownerContext.ownerId,
      ...workoutDraft,
    };
    workout.ownerId = ownerContext.ownerId;

    if (ownerContext.requireWarning) {
      const description = typeof workout.description === "string" ? workout.description : "";
      if (!description.includes("(ownerId non défini — utilisateur non identifié)")) {
        workout.description = description
          ? `${description.trim()} (ownerId non défini — utilisateur non identifié)`
          : "(ownerId non défini — utilisateur non identifié)";
      }
    }

    const sanitizedWorkout = sanitizeWorkoutValue(workout) as Record<string, unknown>;
    const normalizedWorkout = enforceWorkoutPostProcessing(sanitizedWorkout);

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

    if (ownerContext.localUserId) {
      try {
        await saveGarminWorkoutForUser(ownerContext.localUserId, validation.data as Record<string, unknown>);
      } catch (storageError) {
        console.error("garmin-trainer: unable to persist generated workout", storageError);
      }
    }
  }

  return NextResponse.json(
    parsedJson === undefined ? { raw: rawContent } : { trainingJson: parsedJson, raw: rawContent },
  );
}
