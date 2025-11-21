import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { garminTrainerJobs, users } from "@/db/schema";
import { GarminTrainerWorkout, workoutSchema } from "@/schemas/garminTrainer.schema";
import { fetchGarminConnectionByUserId, ensureGarminAccessToken } from "@/lib/services/garmin-connections";
import { saveGarminWorkoutForUser } from "@/lib/services/userGeneratedArtifacts";
import { getAiModelCandidates } from "@/lib/services/aiModelConfig";
import { parseJsonWithCodeFence } from "@/lib/utils/jsonCleanup";
import { createLogger } from "@/lib/logger";
import { buildGarminExerciseCatalogSnippet } from "@/lib/garminExercises";
import { shouldUseExerciseTool, EXERCISE_TOOL_FEATURE_ENABLED } from "@/lib/ai/exercisePolicy";
import {
  inferExerciseSportsFromMarkdown,
  inferPrimarySportFromMarkdown,
  isFallbackExerciseSportsList,
} from "@/lib/garmin/exerciseInference";
import { getGarminAiClients, type GarminAiResult } from "@/lib/ai/garminAiClient";
import { GarminConversionError } from "@/lib/errors";

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

const buildFinalPrompt = (template: string, example: string): string => {
  let prompt = template;

  if (prompt.includes("{{STRUCTURED_PLAN_JSON}}")) {
    prompt = prompt.replaceAll("{{STRUCTURED_PLAN_JSON}}", example);
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

const sanitizeWorkoutValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeWorkoutValue(item));
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      sanitized[key] = sanitizeWorkoutValue(entry);
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

      const isRestStep = intensity === "REST" || intensity === "EASY" || step.type === "WorkoutRestStep";
      if (!isRestStep) {
        return;
      }

      if (durationType === "REPETITION_SWIM_CSS_OFFSET" || durationType === "FIXED_REPETITION") {
        if (typeof step.description !== "string" || !step.description.trim()) {
          step.description = "Repos (envoyer à la prochaine répétition)";
        }
      }
    };

    return steps.map((entry) => {
      if (!entry || typeof entry !== "object") {
        return entry;
      }

      const step = { ...(entry as Record<string, unknown>) };
      if (isSwim && step.type === "WorkoutRepeatStep") {
        step.skipLastRestStep = false;
      }
      ensureCadenceTargets(step);
      ensureRestDescriptions(step);

      if (step.type === "WorkoutRepeatStep") {
        step.intensity = typeof step.intensity === "string" && step.intensity.trim() ? step.intensity : inferRepeatIntensity(step);
        step.steps = normalizeSteps(step.steps, isSwim);
      }

      if (isSwim && step.poolLength && typeof step.poolLength === "object") {
        const pool = step.poolLength as Record<string, unknown>;
        const lengthValue =
          typeof pool.value === "number" && Number.isFinite(pool.value) ? pool.value : null;
        const lengthUnit = typeof pool.unit === "string" ? pool.unit : null;
        swimSegmentPoolValues.push({ length: lengthValue, unit: lengthUnit });
      }

      return step;
    });
  };

  const segments = Array.isArray(clone.segments) ? clone.segments : [];

  clone.segments = segments.map((segment) => {
    if (!segment || typeof segment !== "object") {
      return segment;
    }

    const segmentRecord = { ...(segment as Record<string, unknown>) };
    if ("segmentId" in segmentRecord) {
      delete segmentRecord.segmentId;
    }
    const sportType = typeof segmentRecord.sportType === "string" ? segmentRecord.sportType : null;

    const isSwim = sportType === "swimming" || sportType === "pool_swimming" || segmentRecord.sport === "LAP_SWIMMING";
    segmentRecord.steps = normalizeSteps(segmentRecord.steps, isSwim);

    if (isSwim && !segmentRecord.poolLength && swimSegmentPoolValues.length > 0) {
      segmentRecord.poolLength = swimSegmentPoolValues[0];
    }

    return segmentRecord;
  });

  return clone;
};

const ensureOwnerIdType = (garminUserId: string): string | number => {
  const numeric = Number.parseInt(garminUserId, 10);
  if (Number.isFinite(numeric) && Number.isSafeInteger(numeric)) {
    return numeric;
  }
  return garminUserId;
};

const logger = createLogger("garmin-trainer-jobs");
const DEFAULT_JOB_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_JOB_TIMEOUT_MS ?? "600000");
const FETCH_TIMEOUT_MS = Number(process.env.GARMIN_TRAINER_FETCH_TIMEOUT_MS ?? "120000");

const updateJob = async (jobId: number, values: Partial<typeof garminTrainerJobs.$inferInsert>) => {
  await db
    .update(garminTrainerJobs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(garminTrainerJobs.id, jobId));
};

const convertPlanMarkdownForUser = async (userId: number, planMarkdown: string) => {
  const connection = await fetchGarminConnectionByUserId(userId);
  if (!connection) {
    throw new Error("Aucune connexion Garmin trouvée pour cet utilisateur.");
  }

  const promptTemplate = await loadPromptTemplate();
  if (!promptTemplate) {
    throw new Error("Prompt Garmin introuvable. Ajoute la variable GARMIN_TRAINER_PROMPT ou le fichier docs/garmin_trainer_prompt.txt.");
  }

  const ownerInstruction = `Utilise strictement "ownerId": "${connection.garminUserId}" (premier champ du JSON) et ne modifie jamais cette valeur.`;
  const basePrompt = [ownerInstruction, buildFinalPrompt(promptTemplate, planMarkdown.trim())].join("\n\n");
  const sportsForPrompt = inferExerciseSportsFromMarkdown(planMarkdown);
  const primaryMarkdownSport = inferPrimarySportFromMarkdown(planMarkdown);
  const primarySportSupportsTool = primaryMarkdownSport ? shouldUseExerciseTool(primaryMarkdownSport) : true;
  const useExerciseTool =
    EXERCISE_TOOL_FEATURE_ENABLED &&
    sportsForPrompt.length > 0 &&
    !isFallbackExerciseSportsList(sportsForPrompt) &&
    sportsForPrompt.every((sport) => shouldUseExerciseTool(sport)) &&
    primarySportSupportsTool;

  const candidateModels = await getAiModelCandidates("garmin-trainer");
  const systemPrompt = process.env.GARMIN_TRAINER_SYSTEM_PROMPT ??
    "Tu es un assistant spécialisé dans la préparation d’entraînements Garmin pour Adapt2Life. Analyse l’exemple fourni et applique fidèlement les instructions du prompt utilisateur.";

  const referer = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

  const { strict: strictClient, classic: classicClient } = getGarminAiClients();
  let aiResult: GarminAiResult | null = null;

  try {
    if (useExerciseTool) {
      aiResult = await strictClient.generate({
        basePrompt,
        systemPrompt,
        modelIds: candidateModels,
        referer,
      });
    } else {
      const catalogMaxChars = Number(process.env.GARMIN_EXERCISE_PROMPT_MAX_CHARS ?? "60000") || 60_000;
      const exerciseCatalogSnippet = buildGarminExerciseCatalogSnippet({
        sports: sportsForPrompt,
        maxChars: catalogMaxChars,
      });
      const userPrompt = [basePrompt, exerciseCatalogSnippet].join("\n\n");

      aiResult = await classicClient.generate({
        basePrompt: userPrompt,
        systemPrompt,
        modelIds: candidateModels,
        referer,
      });
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (!aiResult) {
    throw new Error("Réponse IA vide.");
  }

  logger.info("garmin trainer job conversion completed", { userId, useExerciseTool });

  const parsedResult = parseJsonWithCodeFence(aiResult.rawText);
  if (!parsedResult) {
    throw new GarminConversionError("JSON invalide renvoyé par l’IA : impossible de parser la réponse.", {
      rawResponse: aiResult.rawText,
    });
  }

  const parsedJson = parsedResult.parsed;
  const sourceJson = parsedResult.source;

  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
    throw new GarminConversionError("Le JSON renvoyé par l’IA ne correspond pas à un objet valide.", {
      rawResponse: sourceJson,
    });
  }

  if (useExerciseTool && (!("segments" in parsedJson) || !Array.isArray((parsedJson as Record<string, unknown>).segments))) {
    const toolError = typeof (parsedJson as Record<string, unknown>).error === "string"
      ? (parsedJson as Record<string, unknown>).error
      : "Aucun exercice valide trouvé dans le catalogue Garmin.";
    throw new GarminConversionError(String(toolError), {
      rawResponse: sourceJson,
      debugPayload: parsedJson,
    });
  }

  const sanitized = sanitizeWorkoutValue(parsedJson) as Record<string, unknown>;
  const normalized = enforceWorkoutPostProcessing(sanitized);

  const validation = workoutSchema.safeParse(normalized);
  if (!validation.success) {
    throw new GarminConversionError("L’entraînement généré ne respecte pas le schéma attendu.", {
      rawResponse: sourceJson,
      debugPayload: normalized,
      issues: validation.error.issues,
    });
  }

  await saveGarminWorkoutForUser(userId, validation.data as Record<string, unknown>);
  logger.info("garmin trainer job workout saved", { userId });

  return {
    workout: validation.data as GarminTrainerWorkout,
    raw: JSON.stringify(validation.data, null, 2),
  };
};

const pushWorkoutForUser = async (userId: number, workout: GarminTrainerWorkout) => {
  const garminConnection = await fetchGarminConnectionByUserId(userId);
  if (!garminConnection) {
    throw new Error("Aucune connexion Garmin trouvée pour cet utilisateur. Connecte ton compte Garmin puis réessaie.");
  }

  logger.info("garmin trainer job push started", { userId });
  const { accessToken, connection } = await ensureGarminAccessToken(garminConnection);
  const garminUserId = connection.garminUserId;

  const normalizeSourceField = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim().slice(0, 20);
    }
    return fallback;
  };

  const workoutPayload = {
    ...workout,
    ownerId: ensureOwnerIdType(garminUserId),
    workoutProvider: normalizeSourceField(workout.workoutProvider, "Adapt2Life"),
    workoutSourceId: normalizeSourceField(workout.workoutSourceId, "Adapt2Life"),
  };

  logger.info("garmin trainer job push creating workout", { userId, garminUserId });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const createResponse = await fetch("https://apis.garmin.com/workoutportal/workout/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(workoutPayload),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  const createText = await createResponse.text();
  let createJson: Record<string, unknown> | null = null;
  if (createText) {
    try {
      const parsed = JSON.parse(createText);
      createJson = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      createJson = null;
    }
  }

  if (!createResponse.ok) {
    const errorMessage =
      typeof createJson?.message === "string"
        ? createJson.message
        : typeof createJson?.error === "string"
          ? createJson.error
          : "Garmin a refusé la création de l’entraînement.";
    throw new Error(errorMessage);
  }

  const workoutIdRaw =
    createJson?.workoutId ??
    createJson?.id ??
    (typeof createJson?.workout === "object" ? (createJson.workout as Record<string, unknown>)?.workoutId : null);

  const workoutId =
    typeof workoutIdRaw === "number"
      ? workoutIdRaw
      : typeof workoutIdRaw === "string" && workoutIdRaw.trim().length > 0
        ? Number.parseInt(workoutIdRaw, 10)
        : null;

  if (workoutId == null || Number.isNaN(workoutId)) {
    throw new Error("Garmin n’a pas renvoyé d’identifiant d’entraînement, planification impossible.");
  }

  const scheduleDate = new Date().toISOString().slice(0, 10);

  logger.info("garmin trainer job push scheduling workout", { userId, garminUserId, workoutId, scheduleDate });
  const scheduleController = new AbortController();
  const scheduleTimeoutId = setTimeout(() => scheduleController.abort(), FETCH_TIMEOUT_MS);
  const scheduleResponse = await fetch("https://apis.garmin.com/training-api/schedule/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      workoutId,
      date: scheduleDate,
    }),
    signal: scheduleController.signal,
  }).finally(() => {
    clearTimeout(scheduleTimeoutId);
  });

  const scheduleText = await scheduleResponse.text();
  let scheduleJson: Record<string, unknown> | null = null;
  if (scheduleText) {
    try {
      const parsed = JSON.parse(scheduleText);
      scheduleJson = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      scheduleJson = null;
    }
  }

  if (!scheduleResponse.ok) {
    const errorMessage =
      typeof scheduleJson?.message === "string"
        ? scheduleJson.message
        : typeof scheduleJson?.error === "string"
          ? scheduleJson.error
          : "Garmin a refusé la planification de l’entraînement.";
    throw new Error(errorMessage);
  }

  const result = {
    workoutId,
    scheduledFor: scheduleDate,
    garminResponse: {
      workoutCreation: createJson ?? createText ?? null,
      schedule: scheduleJson ?? scheduleText ?? null,
    },
  };
  logger.info("garmin trainer job push completed", { userId, garminUserId, workoutId });
  return result;
};

export const createGarminTrainerJob = async (userId: number, planMarkdown: string) => {
  const [job] = await db
    .insert(garminTrainerJobs)
    .values({ userId, planMarkdown: planMarkdown.trim(), status: "pending" })
    .returning({ id: garminTrainerJobs.id, status: garminTrainerJobs.status, createdAt: garminTrainerJobs.createdAt });
  return job;
};

export type GarminTrainerJobView = {
  id: number;
  status: string;
  error: string | null;
  processedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export const getGarminTrainerJobForUser = async (
  jobId: number,
  userId: number,
): Promise<GarminTrainerJobView | null> => {
  const [job] = await db
    .select({
      id: garminTrainerJobs.id,
      status: garminTrainerJobs.status,
      error: garminTrainerJobs.error,
      processedAt: garminTrainerJobs.processedAt,
      createdAt: garminTrainerJobs.createdAt,
      updatedAt: garminTrainerJobs.updatedAt,
    })
    .from(garminTrainerJobs)
    .where(and(eq(garminTrainerJobs.id, jobId), eq(garminTrainerJobs.userId, userId)))
    .limit(1);

  return job ?? null;
};

export const markGarminTrainerJobFailed = async (jobId: number, errorMessage: string) => {
  await updateJob(jobId, {
    status: "failed",
    error: errorMessage,
    processedAt: new Date(),
  });
};

export const hasGarminTrainerJobTimedOut = (
  job: GarminTrainerJobView,
  options?: { timeoutMs?: number },
): boolean => {
  if (job.status === "success" || job.status === "failed") {
    return false;
  }
  const timeoutMs = Number.isFinite(options?.timeoutMs) ? Number(options?.timeoutMs) : DEFAULT_JOB_TIMEOUT_MS;
  const referenceDate = job.updatedAt ?? job.createdAt;
  if (!referenceDate) {
    return false;
  }
  return Date.now() - referenceDate.getTime() > timeoutMs;
};

const processJob = async (job: { id: number; userId: number; planMarkdown: string }) => {
  await updateJob(job.id, { status: "processing" });
  logger.info("garmin trainer job processing started", { jobId: job.id, userId: job.userId });
  try {
    const conversion = await convertPlanMarkdownForUser(job.userId, job.planMarkdown);
    const pushResult = await pushWorkoutForUser(job.userId, conversion.workout);

    await updateJob(job.id, {
      status: "success",
      resultJson: {
        workoutId: pushResult.workoutId,
        scheduledFor: pushResult.scheduledFor,
        garminResponse: pushResult.garminResponse,
      },
      processedAt: new Date(),
      error: null,
      aiRawResponse: conversion.raw,
      aiDebugPayload: null,
    });
    logger.info("garmin trainer job completed", { jobId: job.id, userId: job.userId, workoutId: pushResult.workoutId });
  } catch (error) {
    if (error instanceof GarminConversionError) {
      logger.error("garmin trainer job failed", {
        jobId: job.id,
        error,
        rawResponse: error.rawResponse,
        debugPayload: error.debugPayload,
        issues: error.issues ?? null,
      });
    } else {
      logger.error("garmin trainer job failed", { jobId: job.id, error });
    }
    await updateJob(job.id, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      processedAt: new Date(),
      aiRawResponse: error instanceof GarminConversionError ? error.rawResponse : null,
      aiDebugPayload: error instanceof GarminConversionError ? (error.debugPayload ?? null) : null,
    });
  }
};

export const processPendingGarminTrainerJobs = async (limit = 5) => {
  const jobs = await db
    .select({ id: garminTrainerJobs.id, userId: garminTrainerJobs.userId, planMarkdown: garminTrainerJobs.planMarkdown })
    .from(garminTrainerJobs)
    .where(eq(garminTrainerJobs.status, "pending"))
    .orderBy(garminTrainerJobs.createdAt)
    .limit(limit);

  for (const job of jobs) {
    await processJob(job);
  }

  return jobs.length;
};

export const processGarminTrainerJobById = async (jobId: number) => {
  const [job] = await db
    .select({ id: garminTrainerJobs.id, userId: garminTrainerJobs.userId, planMarkdown: garminTrainerJobs.planMarkdown })
    .from(garminTrainerJobs)
    .where(eq(garminTrainerJobs.id, jobId))
    .limit(1);

  if (!job) {
    return false;
  }

  await processJob(job);
  return true;
};

export const triggerGarminTrainerJobProcessing = (jobId: number) => {
  processGarminTrainerJobById(jobId).catch((error) => {
    logger.error("garmin trainer job processing failed", { jobId, error });
  });
};

export const ensureLocalUser = async (
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

export const __garminTrainerJobsTesting = {
  convertPlanMarkdownForUser,
};
