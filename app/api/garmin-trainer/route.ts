import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { AiRequestError } from "@/lib/ai";
import { createLogger } from "@/lib/logger";
import { workoutSchema } from "@/schemas/garminTrainer.schema";
import { saveGarminWorkoutForUser } from "@/lib/services/userGeneratedArtifacts";
import { getAiModelCandidates } from "@/lib/services/aiModelConfig";
import { shouldUseExerciseTool, EXERCISE_TOOL_FEATURE_ENABLED } from "@/lib/ai/exercisePolicy";
import { parseJsonWithCodeFence } from "@/lib/utils/jsonCleanup";
import { buildGarminExerciseCatalogSnippet } from "@/lib/garminExercises";
import {
  inferExerciseSportsFromMarkdown,
  inferPrimarySportFromMarkdown,
  isFallbackExerciseSportsList,
} from "@/lib/garmin/exerciseInference";
import { getGarminAiClients, type GarminAiResult } from "@/lib/ai/garminAiClient";

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

const buildFinalPrompt = (template: string, example: string): string => {
  let prompt = template;

  if (prompt.includes("{{STRUCTURED_PLAN_JSON}}")) {
    prompt = prompt.replaceAll("{{STRUCTURED_PLAN_JSON}}", "{}");
  }

  if (prompt.includes("{{HUMAN_PLAN_MARKDOWN}}")) {
    prompt = prompt.replaceAll("{{HUMAN_PLAN_MARKDOWN}}", example);
  }

  if (prompt.includes("{{EXAMPLE_MARKDOWN}}")) {
    prompt = prompt.replaceAll("{{EXAMPLE_MARKDOWN}}", example);
  } else if (!prompt.includes("{{HUMAN_PLAN_MARKDOWN}}")) {
    prompt = `${prompt.trim()}\n\n---\nExemple d’entraînement (Markdown) :\n${example}`;
  }

  return prompt;
};

const GARMIN_PROMPT_FILENAME = "docs/garmin_trainer_prompt.txt";

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return fallback;
};


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

    const ensureCadenceTargets = (step: Record<string, unknown>) => {
      if (step.type === "WorkoutRepeatStep") {
        return;
      }
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

    const normalizedSteps: unknown[] = [];
    let pendingNote: string | null = null;

    steps.forEach((rawStep) => {
      if (!rawStep || typeof rawStep !== "object") {
        return;
      }

      const step = { ...(rawStep as Record<string, unknown>) };
      const type = step.type;

      if (!step.intensity && typeof segmentIntensity === "string" && segmentIntensity.trim().length > 0) {
        step.intensity = segmentIntensity;
      }

      if (pendingNote) {
        const pending = pendingNote;
        pendingNote = null;
        if (type === "WorkoutStep") {
          const existing = typeof step.description === "string" ? step.description.trim() : "";
          step.description = existing ? `${existing} — ${pending}` : pending;
        } else if (type === "WorkoutRepeatStep") {
          const existing = typeof step.description === "string" ? step.description.trim() : "";
          step.description = existing ? `${existing} — ${pending}` : pending;
        }
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

        if (typeof step.description === "string") {
          const normalized = step.description.replace(/\s+/g, " ").trim();
          step.description = normalized.length > 0 ? normalized : null;
        }

        if (!step.intensity) {
          step.intensity = inferRepeatIntensity(step);
        }
      } else if (type === "WorkoutStep" && Array.isArray(step.steps)) {
        step.steps = null;
      }

      if (type === "WorkoutStep") {
        ensureRestDescriptions(step);

        const hasDurationType = typeof step.durationType === "string" && step.durationType.trim().length > 0;
        const hasDurationValue = typeof step.durationValue === "number" && Number.isFinite(step.durationValue);

        if (!hasDurationType || !hasDurationValue) {
          const note = typeof step.description === "string" ? step.description.trim() : "";
          if (note && normalizedSteps.length > 0) {
            const last = normalizedSteps[normalizedSteps.length - 1];
            if (last && typeof last === "object") {
              const lastStep = last as Record<string, unknown>;
              const parts = [] as string[];
              if (typeof lastStep.description === "string" && lastStep.description.trim().length > 0) {
                parts.push(lastStep.description.trim());
              }
              parts.push(note);
              lastStep.description = parts.join(" — ");
            } else {
              pendingNote = note;
            }
          } else if (note) {
            pendingNote = note;
          } else {
            pendingNote = null;
          }
          return;
        }
      }

      ensureCadenceTargets(step);

      normalizedSteps.push(step);
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
  const logger = createLogger("garmin-trainer", { headers: request.headers });
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

  const normalizedExample = exampleMarkdown.trim();
  logger.info("garmin trainer conversion requested", {
    ownerId: ownerContext.ownerId ?? null,
    hasLocalUser: Boolean(ownerContext.localUserId),
  });

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

  const modelCandidates = await getAiModelCandidates("garmin-trainer");
  const systemPrompt = process.env.GARMIN_TRAINER_SYSTEM_PROMPT ?? FALLBACK_SYSTEM_PROMPT;

  const inferredOrigin =
    request.headers.get("origin") ??
    request.headers.get("referer") ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("host") ?? "localhost"}`;
  const referer = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? inferredOrigin ?? "http://localhost:3000";

  const sportsForPrompt = inferExerciseSportsFromMarkdown(normalizedExample);
  const primaryMarkdownSport = inferPrimarySportFromMarkdown(normalizedExample);
  const primarySportSupportsTool = primaryMarkdownSport ? shouldUseExerciseTool(primaryMarkdownSport) : true;
  const defaultPrompt = [ownerContext.ownerInstruction, buildFinalPrompt(promptTemplate, normalizedExample)].join("\n\n");
  const useExerciseTool =
    EXERCISE_TOOL_FEATURE_ENABLED &&
    sportsForPrompt.length > 0 &&
    !isFallbackExerciseSportsList(sportsForPrompt) &&
    sportsForPrompt.every((sport) => shouldUseExerciseTool(sport)) &&
    primarySportSupportsTool;

  const { strict: strictClient, classic: classicClient } = getGarminAiClients();
  let rawContent: string | null = null;
  let aiResult: GarminAiResult | null = null;
  try {
    if (useExerciseTool) {
      aiResult = await strictClient.generate({
        basePrompt: defaultPrompt,
        systemPrompt,
        modelIds: modelCandidates,
        referer,
      });
    } else {
      const catalogMaxChars = toPositiveInt(process.env.GARMIN_EXERCISE_PROMPT_MAX_CHARS, 60_000);
      const exerciseCatalogSnippet = buildGarminExerciseCatalogSnippet({
        sports: sportsForPrompt,
        maxChars: catalogMaxChars,
      });
      const userPrompt = [defaultPrompt, exerciseCatalogSnippet].join("\n\n");
      aiResult = await classicClient.generate({
        basePrompt: userPrompt,
        systemPrompt,
        modelIds: modelCandidates,
        referer,
      });
    }
  } catch (error) {
    const aiError = error instanceof AiRequestError ? error : new AiRequestError("AI request failed", { cause: error });
    if (!useExerciseTool && aiError.status === 429) {
      return NextResponse.json(
        {
          error: "Le service d’IA est momentanément saturé. Réessaie dans quelques instants ou ajuste la fréquence des requêtes.",
          details: aiError.body ?? null,
        },
        { status: 429 },
      );
    }
    const statusCode = aiError.status && aiError.status !== 0 ? aiError.status : 500;
    return NextResponse.json(
      {
        error: useExerciseTool
          ? "La génération de l’entraînement a échoué via le moteur strict."
          : "La génération de l’entraînement a échoué via OpenRouter.",
        details: aiError.body ?? aiError.message ?? null,
      },
      { status: statusCode },
    );
  }

  if (!aiResult) {
    return NextResponse.json({ error: "Réponse IA vide.", raw: null }, { status: 502 });
  }

  rawContent = aiResult.rawText;

  if (!useExerciseTool && !aiResult.data && aiResult.parseError) {
    return NextResponse.json(
      {
        raw: rawContent,
        parseError: aiResult.parseError,
      },
      { status: 200 },
    );
  }

  let parsedJson: unknown | undefined;
  const parsedResult = parseJsonWithCodeFence(rawContent);
  if (parsedResult) {
    parsedJson = parsedResult.parsed;
    rawContent = parsedResult.source;
  }

  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    if (useExerciseTool && (!("segments" in parsedJson) || !Array.isArray((parsedJson as Record<string, unknown>).segments))) {
      const toolError = typeof (parsedJson as Record<string, unknown>).error === "string"
        ? (parsedJson as Record<string, unknown>).error
        : "Aucun exercice valide trouvé dans le catalogue Garmin.";
      return NextResponse.json(
        {
          error: toolError,
          raw: rawContent,
        },
        { status: 422 },
      );
    }
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
        logger.error("garmin-trainer unable to persist generated workout", { error: storageError });
      }
    }
  }

  return NextResponse.json(
    parsedJson === undefined ? { raw: rawContent } : { trainingJson: parsedJson, raw: rawContent },
  );
}
