import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { garminWebhookEvents, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { ADAPT2LIFE_SYSTEM_PROMPT } from "@/lib/prompts/adapt2lifeSystemPrompt";

const MAX_TEXT_LENGTH = 2000;

const trimString = z.string().transform((value) => value.trim());

const boundedText = trimString.refine((value) => value.length <= MAX_TEXT_LENGTH, {
  message: `Merci de limiter chaque champ à ${MAX_TEXT_LENGTH} caractères.`,
});

const REQUEST_SCHEMA = z.object({
  goal: boundedText.refine((value) => value.length >= 1, "L’objectif est obligatoire."),
  constraints: boundedText.optional().default(""),
  availability: boundedText.optional().default(""),
  preferences: boundedText.optional().default(""),
});

const WEIGHT_KG_PATHS: string[][] = [
  ["weightKg"],
  ["weightInKilograms"],
  ["bodyCompositions", "0", "weightKg"],
  ["bodyCompositions", "0", "weightInKilograms"],
  ["bodyComposition", "weightKg"],
  ["bodyComposition", "weightInKilograms"],
];

const WEIGHT_GRAM_PATHS: string[][] = [
  ["weightInGrams"],
  ["bodyCompositions", "0", "weightInGrams"],
  ["bodyCompositions", "0", "weight"],
  ["bodyComposition", "weightInGrams"],
  ["bodyComposition", "weight"],
  ["weight"],
];

const toNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getNestedValue = (source: unknown, path: readonly string[]): unknown => {
  let current: unknown = source;
  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }
    return undefined;
  }
  return current;
};

const pickNumberFromPaths = (source: unknown, paths: readonly string[][]): number | null => {
  for (const pathSegments of paths) {
    const value = getNestedValue(source, pathSegments);
    const numeric = toNumeric(value);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
};

const extractCapacityScore = (input: string): number | null => {
  if (!input) {
    return null;
  }

  const normalized = input.normalize("NFKC").replace(/,/g, ".");

  const slashMatch = normalized.match(/(\d{1,3}(?:\.\d{1,2})?)\s*\/\s*100/);
  if (slashMatch) {
    const value = Number.parseFloat(slashMatch[1]);
    if (!Number.isNaN(value) && value >= 0 && value <= 100) {
      return value;
    }
  }

  const percentMatch = normalized.match(/(\d{1,3}(?:\.\d{1,2})?)\s*%/);
  if (percentMatch) {
    const value = Number.parseFloat(percentMatch[1]);
    if (!Number.isNaN(value) && value >= 0 && value <= 100) {
      return value;
    }
  }

  const keywordMatch = normalized.match(
    /(?:capacit[eé]|forme|énergie|energie|fatigue|note)\D{0,12}(\d{1,3}(?:\.\d{1,2})?)/i,
  );
  if (keywordMatch) {
    const value = Number.parseFloat(keywordMatch[1]);
    if (!Number.isNaN(value) && value >= 0 && value <= 100) {
      return value;
    }
  }

  return null;
};

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "français",
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
  pt: "portugais",
};

const resolvePreferredLanguage = (
  header: string | null,
): {
  tag: string | null;
  label: string | null;
} => {
  if (!header) {
    return { tag: null, label: null };
  }

  const [rawFirst] = header
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!rawFirst) {
    return { tag: null, label: null };
  }

  const [tag] = rawFirst.split(";").map((segment) => segment.trim());
  if (!tag) {
    return { tag: null, label: null };
  }

  const normalized = tag.toLowerCase();
  const base = normalized.split("-")[0] ?? normalized;
  return { tag, label: LANGUAGE_LABELS[base] ?? null };
};

async function ensureLocalUser(stackUser: NonNullable<Awaited<ReturnType<typeof stackServerApp.getUser>>>) {
  const [existingUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      gender: users.gender,
      birthDate: users.birthDate,
      sportLevel: users.sportLevel,
      heightCm: users.heightCm,
      weightKg: users.weightKg,
      trainingGoal: users.trainingGoal,
    })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  const [inserted] = await db
    .insert(users)
    .values({
      stackId: stackUser.id,
      name: stackUser.displayName ?? null,
      email: stackUser.primaryEmail ?? `user-${stackUser.id}@example.com`,
      gender: null,
      birthDate: null,
      sportLevel: null,
      heightCm: null,
      weightKg: null,
      trainingGoal: null,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      gender: users.gender,
      birthDate: users.birthDate,
      sportLevel: users.sportLevel,
      heightCm: users.heightCm,
      weightKg: users.weightKg,
      trainingGoal: users.trainingGoal,
    });

  if (inserted) {
    return inserted;
  }

  const [fallback] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      gender: users.gender,
      birthDate: users.birthDate,
      sportLevel: users.sportLevel,
      heightCm: users.heightCm,
      weightKg: users.weightKg,
      trainingGoal: users.trainingGoal,
    })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!fallback) {
    throw new Error("Impossible de créer le profil utilisateur local.");
  }

  return fallback;
}

async function fetchLatestGarminWeightKg(userId: number): Promise<number | null> {
  const [event] = await db
    .select({
      payload: garminWebhookEvents.payload,
    })
    .from(garminWebhookEvents)
    .where(and(eq(garminWebhookEvents.userId, userId), eq(garminWebhookEvents.type, "bodyCompositions")))
    .orderBy(desc(garminWebhookEvents.createdAt))
    .limit(1);

  if (!event?.payload) {
    return null;
  }

  const payload = event.payload as Record<string, unknown>;
  const weightKg = pickNumberFromPaths(payload, WEIGHT_KG_PATHS);
  if (weightKg !== null) {
    return weightKg;
  }
  const weightGrams = pickNumberFromPaths(payload, WEIGHT_GRAM_PATHS);
  return weightGrams !== null ? weightGrams / 1000 : null;
}

export async function POST(request: NextRequest) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY manquant côté serveur." }, { status: 500 });
    }

    const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
    if (!stackUser) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const json = await request.json();
    const parsed = REQUEST_SCHEMA.safeParse(json);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      const message =
        flattened.formErrors.join(" ") || Object.values(flattened.fieldErrors).flat().join(" ") || "Requête invalide.";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const localUser = await ensureLocalUser(stackUser);

    let inferredWeightKg: number | null =
      localUser?.weightKg !== null && localUser?.weightKg !== undefined
        ? Number.parseFloat(String(localUser.weightKg))
        : null;

    if ((inferredWeightKg === null || Number.isNaN(inferredWeightKg)) && localUser?.id) {
      inferredWeightKg = await fetchLatestGarminWeightKg(localUser.id);
    }

    const { goal, constraints, availability, preferences } = parsed.data;

    const trainingGoal = localUser?.trainingGoal?.trim() ?? null;

    const profileParts = [
      `Nom complet: ${localUser?.name ?? stackUser.displayName ?? "Inconnu"}`,
      `Genre: ${localUser?.gender ?? "Non spécifié"}`,
      `Date de naissance: ${localUser?.birthDate ?? "Non indiquée"}`,
      `Niveau sportif (1-10): ${localUser?.sportLevel ?? "Non renseigné"}`,
      `Taille: ${localUser?.heightCm ? `${localUser.heightCm} cm` : "Non renseignée"}`,
      `Poids: ${
        inferredWeightKg !== null && Number.isFinite(inferredWeightKg)
          ? `${inferredWeightKg.toFixed(2)} kg`
          : localUser?.weightKg ?? "Non renseigné"
      }`,
      `CAPACITÉ À S’ENTRAÎNER AUJOURD’HUI: ${goal}`,
    ];

    if (trainingGoal) {
      profileParts.splice(5, 0, `Objectif sportif principal: ${trainingGoal}`);
    }

    const profileLines = profileParts.filter(Boolean).join("\n");

    const { tag: preferredLanguageTag, label: preferredLanguageLabel } = resolvePreferredLanguage(
      request.headers.get("accept-language"),
    );

    const capacityScore = extractCapacityScore(goal);
    const formattedCapacityScore =
      capacityScore !== null ? (Number.isInteger(capacityScore) ? `${capacityScore}` : capacityScore.toFixed(1)) : null;

    const capacityLine =
      formattedCapacityScore !== null
        ? `${formattedCapacityScore}/100`
        : "Non indiquée (estime le niveau à partir de la description fournie).";

    const primaryObjective =
      trainingGoal && trainingGoal.length > 0
        ? trainingGoal
        : "Non précisé (identifie un objectif cohérent avec le contexte fourni).";

    const languageInstruction = preferredLanguageLabel
      ? `${preferredLanguageLabel} (${preferredLanguageTag ?? ""})`
      : "Analyse la langue utilisée par l’utilisateur et réponds dans cette langue.";

    const normalizedConstraints = constraints?.trim().length ? constraints : "Aucune précisée.";
    const normalizedAvailability = availability?.trim().length ? availability : "Non précisées.";
    const normalizedPreferences = preferences?.trim().length ? preferences : "Non précisées.";

    const userPromptSegments: string[] = [
      "Voici les informations disponibles pour élaborer la séance du jour :",
      "",
      `- Note de capacité à s’entraîner aujourd’hui (0-100) : ${capacityLine}`,
      `- Objectif sportif principal : ${primaryObjective}`,
      `- Langue de réponse attendue : ${languageInstruction}`,
      `- Contraintes spécifiques : ${normalizedConstraints}`,
      `- Disponibilités / durée : ${normalizedAvailability}`,
      `- Préférences / matériel : ${normalizedPreferences}`,
      "",
      "Contexte libre et demande formulée aujourd’hui :",
      '"""',
      goal,
      '"""',
    ];

    if (profileLines) {
      userPromptSegments.push(
        "",
        "Profil utilisateur connu (pour contextualiser, ne pas répéter textuellement) :",
        profileLines,
      );
    }

    userPromptSegments.push(
      "",
      "Consignes supplémentaires :",
      "- Propose uniquement une séance (sauf demande explicite d’un programme de plusieurs jours).",
      "- Respecte strictement la structure Markdown attendue (titres, listes, séparateurs).",
      "- Ajuste l’intensité, la durée et les conseils à la note de capacité du jour.",
    );

    const userPrompt = userPromptSegments.join("\n");

    const inferredOrigin =
      request.headers.get("origin") ??
      request.headers.get("referer") ??
      `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("host") ?? "localhost"}`;
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? inferredOrigin ?? "http://localhost:3000";

const candidateModels = [
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "anthropic/claude-3.5-haiku-20241022",
];

const collectTextSegments = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectTextSegments);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.type === "string") {
      if (record.type === "reasoning" || record.type === "alignment_response") {
        return [];
      }
      if (record.type === "output_text" && typeof record.text === "string") {
        return [record.text];
      }
      if (record.type === "output_json" && typeof record.json === "object" && record.json !== null) {
        try {
          const text = JSON.stringify(record.json);
          return text ? [text] : [];
        } catch {
          // ignore
        }
      }
    }
    const results: string[] = [];
    if (typeof record.text === "string") {
      results.push(record.text);
    }
    if (typeof record.content === "string") {
      results.push(record.content);
    }
    if (Array.isArray(record.content)) {
      results.push(...collectTextSegments(record.content));
    }
    if (typeof record.json === "object" && record.json !== null) {
      try {
        const text = JSON.stringify(record.json);
        if (text) {
          results.push(text);
        }
      } catch {
        // ignore
      }
    }
    if (Array.isArray(record.parts)) {
      results.push(...collectTextSegments(record.parts));
    }
    if (Array.isArray(record.messages)) {
      results.push(...collectTextSegments(record.messages));
    }
    return results;
  }
  return [];
};

const tryParsePlanJson = (value: string): string | null => {
  try {
    const parsed = JSON.parse(value.trim());
    if (parsed && typeof parsed.plan === "string") {
      const trimmed = parsed.plan.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  } catch {
    return null;
  }
};

const extractPlanFromMessage = (message: { content?: unknown } | undefined): { plan: string; source: "json" | "text" } | null => {
  if (!message) {
    return null;
  }

  if (typeof message.content === "string") {
    const jsonPlan = tryParsePlanJson(message.content);
    if (jsonPlan) {
      return { plan: jsonPlan, source: "json" };
    }
    const plain = message.content.trim();
    return plain.length > 0 ? { plan: plain, source: "text" } : null;
  }

  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      if (!part || typeof part !== "object") {
        continue;
      }
      const record = part as Record<string, unknown>;
      const possibleText =
        (typeof record.content === "string" && record.content) ||
        (typeof record.text === "string" && record.text);
      if (possibleText) {
        const jsonPlan = tryParsePlanJson(possibleText);
        if (jsonPlan) {
          return { plan: jsonPlan, source: "json" };
        }
      }
      if (typeof record.json === "object" && record.json !== null) {
        try {
          const jsonPlan = tryParsePlanJson(JSON.stringify(record.json));
          if (jsonPlan) {
            return { plan: jsonPlan, source: "json" };
          }
        } catch {
          // ignore
        }
      }
    }

    const segments = collectTextSegments(message.content)
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return { plan: segments.join("\n\n"), source: "text" };
    }
  }

  return null;
};

const cleanTextPlan = (raw: string): string => {
  const normalized = raw.trim();
  const hasStructuredSections =
    normalized.includes("## 🔥 Échauffement") &&
    normalized.includes("## 💪 Corps de la séance") &&
    normalized.includes("## 🧘 Retour au calme");

  if (hasStructuredSections) {
    return normalized;
  }

  let cleaned = normalized;
  cleaned = cleaned.replace(/(^|\n)\*\*[^*\n]*\b(plan|séance|workout)\b[^*\n]*\*\*/gi, "\n");
  cleaned = cleaned.replace(/(^|\n)(Je|I) (?:peux|can) [^\.\!\?]*[\.\!\?]/gi, "\n");
  cleaned = cleaned.replace(/(^|\n)Il (?:convient|serait|pourrait) [^\.\!\?]*[\.\!\?]/gi, "\n");
  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const firstContentIndex = lines.findIndex((line) =>
    /^(total|warm[- ]?up|échauffement|seance|séance|plan|1[\).\s])/i.test(line),
  );
  const relevantLines = firstContentIndex > -1 ? lines.slice(firstContentIndex) : lines;
  const result = relevantLines.join("\n\n").trim();
  return result.length > 0 ? result : raw.trim();
};

const STRIP_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

const normalizeHeadingKey = (heading: string): string => {
  const normalized = heading
    .normalize("NFKD")
    .replace(STRIP_DIACRITICS_REGEX, "")
    .toLowerCase();

  if (normalized.includes("echauffement")) {
    return "warmup";
  }
  if (normalized.includes("corps")) {
    return "main";
  }
  if (normalized.includes("retour")) {
    return "cooldown";
  }
  if (normalized.includes("conseils")) {
    return "advice";
  }
  if (normalized.includes("raisonnement")) {
    return "reasoning";
  }
  return normalized.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
};

type ParsedWorkoutSections = {
  title: string | null;
  objective: string | null;
  duration: string | null;
  sections: Record<string, string[]>;
};

const parseWorkoutSectionsFromMarkdown = (markdown: string): ParsedWorkoutSections | null => {
  if (!markdown.trim()) {
    return null;
  }

  const titleMatch = markdown.match(/^\s*#\s+(.+)\s*$/m);
  const objectiveMatch = markdown.match(/\*\*Objectif principal\s*:\*\*\s*(.+)/i);
  const durationMatch = markdown.match(/\*\*Durée totale estimée\s*:\*\*\s*(.+)/i);

  const sections: Record<string, string[]> = {};
  let currentKey: string | null = null;

  const pushToSection = (key: string, value: string) => {
    const cleaned = value.replace(/^[•\-–]\s*/, "").trim();
    if (!cleaned) {
      return;
    }
    if (!sections[key]) {
      sections[key] = [];
    }
    sections[key].push(cleaned);
  };

  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      currentKey = null;
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^##\s+/, "").trim();
      currentKey = normalizeHeadingKey(heading);
      if (!sections[currentKey]) {
        sections[currentKey] = [];
      }
      continue;
    }

    if (currentKey) {
      pushToSection(currentKey, trimmed);
    }
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    objective: objectiveMatch ? objectiveMatch[1].trim() : null,
    duration: durationMatch ? durationMatch[1].trim() : null,
    sections,
  };
};

const buildWorkoutDebugJson = (markdown: string): string | null => {
  const parsed = parseWorkoutSectionsFromMarkdown(markdown);
  if (!parsed) {
    return null;
  }

  const workoutPayload = buildGarminWorkoutPayload(parsed);
  const { sections } = parsed;

  const payload = {
    title: parsed.title,
    objective: parsed.objective,
    estimatedDuration: parsed.duration,
    garminWorkout: workoutPayload,
    coachNotes: {
      advice: sections.advice ?? [],
      reasoning: sections.reasoning ?? [],
    },
    rawSections: sections,
  };

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return null;
  }
};

type ParsedDuration =
  | {
      durationType: "TIME";
      durationValue: number;
      durationValueType: null;
    }
  | {
      durationType: "DISTANCE";
      durationValue: number;
      durationValueType: "METER";
    }
  | {
      durationType: "OPEN";
      durationValue: null;
      durationValueType: null;
    };

const durationMatchers: Array<{
  regex: RegExp;
  handler: (value: number) => ParsedDuration;
}> = [
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:minutes?|mins?|mn)\b/i,
    handler: (value) => ({
      durationType: "TIME",
      durationValue: Math.round(value * 60),
      durationValueType: null,
    }),
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:secondes?|secs?|s)\b/i,
    handler: (value) => ({
      durationType: "TIME",
      durationValue: Math.round(value),
      durationValueType: null,
    }),
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:kilom[eè]tres?|km)\b/i,
    handler: (value) => ({
      durationType: "DISTANCE",
      durationValue: Math.round(value * 1000),
      durationValueType: "METER",
    }),
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s*(?:m(?:etres?)?)\b/i,
    handler: (value) => ({
      durationType: "DISTANCE",
      durationValue: Math.round(value),
      durationValueType: "METER",
    }),
  },
];

const extractDuration = (text: string): ParsedDuration => {
  const normalized = text.normalize("NFKD").replace(STRIP_DIACRITICS_REGEX, " ");

  for (const matcher of durationMatchers) {
    const match = normalized.match(matcher.regex);
    if (!match) {
      continue;
    }
    const raw = match[1].replace(",", ".");
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) {
      continue;
    }
    const parsed = matcher.handler(value);
    if (parsed.durationValue === null || parsed.durationValue <= 0) {
      continue;
    }
    return parsed;
  }

  return {
    durationType: "OPEN",
    durationValue: null,
    durationValueType: null,
  };
};

const inferSectionIntensity = (sectionKey: string, text: string): "WARMUP" | "COOLDOWN" | "RECOVERY" | "ACTIVE" => {
  if (sectionKey === "warmup") {
    return "WARMUP";
  }
  if (sectionKey === "cooldown") {
    return "COOLDOWN";
  }
  const normalized = text.normalize("NFKD").replace(STRIP_DIACRITICS_REGEX, "").toLowerCase();
  if (normalized.includes("repos") || normalized.includes("recup")) {
    return "RECOVERY";
  }
  return "ACTIVE";
};

const inferSportFromContext = (context: string): string => {
  const normalized = context.normalize("NFKD").replace(STRIP_DIACRITICS_REGEX, "").toLowerCase();
  const entries: Array<{ sport: string; patterns: RegExp[] }> = [
    {
      sport: "RUNNING",
      patterns: [/\b(run|course|footing|jog|semi|marathon|trail)\b/],
    },
    {
      sport: "CYCLING",
      patterns: [/\b(velo|cycling|bike|cyclisme)\b/],
    },
    {
      sport: "LAP_SWIMMING",
      patterns: [/\b(natation|swim|piscine|nage)\b/],
    },
    {
      sport: "STRENGTH_TRAINING",
      patterns: [/\b(force|muscu|renfo|strength|halteres|halt[eè]res)\b/],
    },
    {
      sport: "CARDIO_TRAINING",
      patterns: [/\b(cardio|hiit|fractionne|interval)\b/],
    },
    {
      sport: "YOGA",
      patterns: [/\b(yoga)\b/],
    },
    {
      sport: "PILATES",
      patterns: [/\b(pilates)\b/],
    },
  ];

  for (const entry of entries) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.sport;
    }
  }

  return "GENERIC";
};

type GarminWorkoutStep = {
  type: "WorkoutStep";
  stepOrder: number;
  intensity: "WARMUP" | "COOLDOWN" | "RECOVERY" | "ACTIVE";
  description: string | null;
  durationType: ParsedDuration["durationType"];
  durationValue: ParsedDuration["durationValue"];
  durationValueType: ParsedDuration["durationValueType"];
  targetType: "OPEN";
  targetValue: null;
  targetValueLow: null;
  targetValueHigh: null;
  targetValueType: null;
  secondaryTargetType: null;
  secondaryTargetValue: null;
  secondaryTargetValueLow: null;
  secondaryTargetValueHigh: null;
  secondaryTargetValueType: null;
  strokeType: null;
  drillType: null;
  equipmentType: null;
  exerciseCategory: null;
  exerciseName: null;
  weightValue: null;
  weightDisplayUnit: null;
  repeatType?: undefined;
  repeatValue?: undefined;
  steps?: undefined;
  skipLastRestStep?: undefined;
};

type GarminWorkoutSegment = {
  segmentOrder: number;
  sport: string;
  poolLength: null;
  poolLengthUnit: null;
  estimatedDurationInSecs: number | null;
  estimatedDistanceInMeters: number | null;
  steps: GarminWorkoutStep[];
};

type GarminWorkoutPayload = {
  workoutName: string;
  description: string | null;
  sport: string;
  workoutProvider: string;
  workoutSourceId: string;
  isSessionTransitionEnabled: boolean;
  estimatedDurationInSecs: number | null;
  estimatedDistanceInMeters: number | null;
  poolLength: null;
  poolLengthUnit: null;
  segments: GarminWorkoutSegment[];
};

const buildGarminWorkoutPayload = (parsed: ParsedWorkoutSections): GarminWorkoutPayload => {
  const { title, objective, sections } = parsed;
  const contextSource = [title, objective, ...Object.values(sections).flat()].filter(Boolean).join(" ");
  const sport = inferSportFromContext(contextSource);

  let stepOrder = 1;
  let totalDurationSeconds = 0;
  let totalDistanceMeters = 0;

  const mapSectionSteps = (sectionKey: string, lines: string[]): GarminWorkoutStep[] => {
    return lines.map((line) => {
      const duration = extractDuration(line);
      if (duration.durationType === "TIME") {
        totalDurationSeconds += duration.durationValue;
      } else if (duration.durationType === "DISTANCE") {
        totalDistanceMeters += duration.durationValue;
      }

      const step: GarminWorkoutStep = {
        type: "WorkoutStep",
        stepOrder,
        intensity: inferSectionIntensity(sectionKey, line),
        description: line.length > 512 ? `${line.slice(0, 509)}...` : line,
        durationType: duration.durationType,
        durationValue: duration.durationValue,
        durationValueType: duration.durationValueType,
        targetType: "OPEN",
        targetValue: null,
        targetValueLow: null,
        targetValueHigh: null,
        targetValueType: null,
        secondaryTargetType: null,
        secondaryTargetValue: null,
        secondaryTargetValueLow: null,
        secondaryTargetValueHigh: null,
        secondaryTargetValueType: null,
        strokeType: null,
        drillType: null,
        equipmentType: null,
        exerciseCategory: null,
        exerciseName: null,
        weightValue: null,
        weightDisplayUnit: null,
      };
      stepOrder += 1;
      return step;
    });
  };

  const warmupSteps = mapSectionSteps("warmup", sections.warmup ?? []);
  const mainSteps = mapSectionSteps("main", sections.main ?? []);
  const cooldownSteps = mapSectionSteps("cooldown", sections.cooldown ?? []);

  const segmentSteps = [...warmupSteps, ...mainSteps, ...cooldownSteps];

  const segment: GarminWorkoutSegment = {
    segmentOrder: 1,
    sport,
    poolLength: null,
    poolLengthUnit: null,
    estimatedDurationInSecs: segmentSteps.length > 0 ? totalDurationSeconds || null : null,
    estimatedDistanceInMeters: segmentSteps.length > 0 ? totalDistanceMeters || null : null,
    steps: segmentSteps,
  };

  return {
    workoutName: title ?? "Séance Adapt2Life",
    description: objective ?? null,
    sport,
    workoutProvider: "Adapt2Life",
    workoutSourceId: "adapt2life",
    isSessionTransitionEnabled: false,
    estimatedDurationInSecs: segment.estimatedDurationInSecs,
    estimatedDistanceInMeters: segment.estimatedDistanceInMeters,
    poolLength: null,
    poolLengthUnit: null,
    segments: segmentSteps.length > 0 ? [segment] : [],
  };
};

    let completionResponse: Response | null = null;
    let lastErrorPayload: string | null = null;

    for (let index = 0; index < candidateModels.length; index += 1) {
      const model = candidateModels[index];

      completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": appUrl,
          "X-Title": "Adapt2Life",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: ADAPT2LIFE_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 4096,
          stop: ["DEBUG", "FIN_PLAN"],
        }),
      });

      if (completionResponse.ok) {
        break;
      }

      if (completionResponse.status === 429 && index < candidateModels.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      lastErrorPayload = await completionResponse.text();
      break;
    }

    if (!completionResponse || !completionResponse.ok) {
      if (completionResponse?.status === 429) {
        return NextResponse.json(
          {
            error:
              "Le service d’IA est momentanément saturé. Réessaie dans quelques instants ou réduis la fréquence de génération.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "La génération a échoué sur OpenRouter.", details: lastErrorPayload ?? null },
        { status: completionResponse?.status ?? 500 },
      );
    }

    const completionJson = (await completionResponse.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const planResult = extractPlanFromMessage(completionJson.choices?.[0]?.message);
    const plan =
      planResult?.source === "json"
        ? planResult.plan
        : planResult?.plan
        ? cleanTextPlan(planResult.plan)
        : null;

    let finalPlan = plan;

    if (!finalPlan) {
      const rawMessage = completionJson.choices?.[0]?.message;
      if (rawMessage) {
        if (typeof rawMessage.content === "string" && rawMessage.content.trim().length > 0) {
          finalPlan = rawMessage.content.trim();
        } else if (Array.isArray(rawMessage.content)) {
          const fallbackSegments = collectTextSegments(rawMessage.content)
            .map((segment) => segment.trim())
            .filter(Boolean);
          if (fallbackSegments.length > 0) {
            finalPlan = fallbackSegments.join("\n\n");
          }
        }
      }
      if (finalPlan) {
        finalPlan = cleanTextPlan(finalPlan);
      }
    }

    if (!finalPlan) {
      console.error("training-plan: unable to extract plan", {
        choices: completionJson.choices,
        lastErrorPayload,
      });
      return NextResponse.json(
        { error: "Impossible de générer un plan d’entraînement pour le moment." },
        { status: 502 },
      );
    }

    const debugJson = buildWorkoutDebugJson(finalPlan);
    const planWithDebug =
      debugJson !== null
        ? `${finalPlan.trim()}\n\n---\n\n\`\`\`json\n${debugJson}\n\`\`\`\n`
        : finalPlan;

    return NextResponse.json({ plan: planWithDebug });
  } catch (error) {
    console.error("Erreur lors de la génération du plan :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du plan." }, { status: 500 });
  }
}
