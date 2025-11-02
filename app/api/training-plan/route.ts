import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { garminWebhookEvents, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

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

    const profileLines = [
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
    ]
      .filter(Boolean)
      .join("\n");

    const { goal, constraints, availability, preferences } = parsed.data;

    const userPrompt = [
      "Tu es un coach sportif professionnel. Génère un plan d’entraînement hebdomadaire structuré.",
      "Prends en compte le profil et les contraintes énoncées ci-dessous.",
      "",
      "Profil utilisateur :",
      profileLines,
      "",
      `Objectif principal : ${goal}`,
      `Contraintes / blessures : ${constraints || "Aucune mentionnée"}`,
      `Disponibilités : ${availability || "Non précisées"}`,
      `Préférences : ${preferences || "Non précisées"}`,
      "",
      "Réponds en français, avec un ton motivant, et structure la réponse par jour (jour 1, jour 2, etc.).",
      "Ajoute des recommandations générales (échauffement, récupération, nutrition) en fin de plan.",
    ].join("\n");

    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": appUrl,
        "X-Title": "Adapt2Life",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku-20241022",
        messages: [
          {
            role: "system",
            content:
              "Tu es Adapt2Life, un entraîneur sportif numérique spécialisé dans la préparation de plans d’entraînement personnalisés.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      return NextResponse.json(
        { error: "La génération a échoué sur OpenRouter.", details: errorText },
        { status: completionResponse.status },
      );
    }

    const completionJson = (await completionResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const plan =
      completionJson.choices?.[0]?.message?.content?.trim() ??
      "Impossible de générer un plan d’entraînement pour le moment.";

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Erreur lors de la génération du plan :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du plan." }, { status: 500 });
  }
}
