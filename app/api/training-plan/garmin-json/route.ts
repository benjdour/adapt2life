import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

const REQUEST_SCHEMA = z.object({
  plan: z.string().min(1, "Le plan est obligatoire."),
});

const GARMIN_WORKOUT_VALIDATOR = z.object({
  ownerId: z.number().int().nonnegative(),
  workoutName: z.string().min(1),
  description: z.string().nullable(),
  sport: z.string().min(1),
  estimatedDurationInSecs: z.number().int().nullable(),
  estimatedDistanceInMeters: z.number().nullable(),
  poolLength: z.number().nullable(),
  poolLengthUnit: z.union([z.literal("METER"), z.literal("YARD"), z.null()]),
  workoutProvider: z.string().min(1),
  workoutSourceId: z.string().min(1),
  isSessionTransitionEnabled: z.boolean(),
  segments: z
    .array(
      z.object({
        segmentOrder: z.number().int().nonnegative(),
        sport: z.string().min(1),
        poolLength: z.number().nullable(),
        poolLengthUnit: z.union([z.literal("METER"), z.literal("YARD"), z.null()]),
        estimatedDurationInSecs: z.number().int().nullable(),
        estimatedDistanceInMeters: z.number().nullable(),
        steps: z
          .array(
            z.object({
              type: z.literal("WorkoutStep"),
              stepOrder: z.number().int().nonnegative(),
              intensity: z.enum(["WARMUP", "COOLDOWN", "RECOVERY", "ACTIVE", "MAIN"]),
              description: z.string().max(512),
              durationType: z.enum(["TIME", "DISTANCE", "OPEN"]),
              durationValue: z.number().nullable(),
              durationValueType: z.string().nullable(),
              targetType: z.string().nullable(),
              targetValue: z.number().nullable(),
              targetValueLow: z.number().nullable(),
              targetValueHigh: z.number().nullable(),
              targetValueType: z.string().nullable(),
              secondaryTargetType: z.string().nullable(),
              secondaryTargetValue: z.number().nullable(),
              secondaryTargetValueLow: z.number().nullable(),
              secondaryTargetValueHigh: z.number().nullable(),
              secondaryTargetValueType: z.string().nullable(),
              strokeType: z.string().nullable(),
              drillType: z.string().nullable(),
              equipmentType: z.string().nullable(),
              exerciseCategory: z.string().nullable(),
              exerciseName: z.string().nullable(),
              weightValue: z.number().nullable(),
              weightDisplayUnit: z.string().nullable(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const SYSTEM_PROMPT = [
  "Tu es un assistant spécialisé dans la conversion de plans d'entraînement en JSON conforme à la Training API de Garmin.",
  "Tu dois produire un objet JSON strictement compatible avec le schéma fourni.",
  "Le JSON représente un seul segment (workout monosport).",
  "Convertis toutes les durées en secondes et toutes les distances en mètres.",
  "Développe les répétitions (ne crée pas de WorkoutRepeatStep).",
  "Respecte la casse exacte des champs (WARMUP, TIME, OPEN, etc.).",
  "Utilise toujours les valeurs nulles explicites quand aucun renseignement n’est disponible.",
  "N’ajoute aucune propriété en dehors du schéma.",
  "Réponds uniquement avec le JSON au format validé par le schéma.",
  "Le JSON doit être valide (guillemets doubles, aucune virgule superflue, pas de commentaires ni de texte hors JSON).",
].join("\n");

const REFERENCE_JSON = `{
  "ownerId": 12345,
  "workoutName": "Exemple tempo course à pied",
  "description": "Séance de course à pied tempo",
  "sport": "RUNNING",
  "estimatedDurationInSecs": 3600,
  "estimatedDistanceInMeters": null,
  "poolLength": null,
  "poolLengthUnit": null,
  "workoutProvider": "Adapt2Life",
  "workoutSourceId": "adapt2life",
  "isSessionTransitionEnabled": false,
  "segments": [
    {
      "segmentOrder": 1,
      "sport": "RUNNING",
      "poolLength": null,
      "poolLengthUnit": null,
      "estimatedDurationInSecs": 3600,
      "estimatedDistanceInMeters": null,
      "steps": [
        {
          "type": "WorkoutStep",
          "stepOrder": 1,
          "intensity": "WARMUP",
          "description": "10 min footing facile (Z1-Z2)",
          "durationType": "TIME",
          "durationValue": 600,
          "durationValueType": null,
          "targetType": "OPEN",
          "targetValue": null,
          "targetValueLow": null,
          "targetValueHigh": null,
          "targetValueType": null,
          "secondaryTargetType": null,
          "secondaryTargetValue": null,
          "secondaryTargetValueLow": null,
          "secondaryTargetValueHigh": null,
          "secondaryTargetValueType": null,
          "strokeType": null,
          "drillType": null,
          "equipmentType": null,
          "exerciseCategory": null,
          "exerciseName": null,
          "weightValue": null,
          "weightDisplayUnit": null
        },
        {
          "type": "WorkoutStep",
          "stepOrder": 2,
          "intensity": "ACTIVE",
          "description": "3 min tempo (Z3 bas)",
          "durationType": "TIME",
          "durationValue": 180,
          "durationValueType": null,
          "targetType": "HEART_RATE",
          "targetValue": null,
          "targetValueLow": 3,
          "targetValueHigh": 3,
          "targetValueType": null,
          "secondaryTargetType": null,
          "secondaryTargetValue": null,
          "secondaryTargetValueLow": null,
          "secondaryTargetValueHigh": null,
          "secondaryTargetValueType": null,
          "strokeType": null,
          "drillType": null,
          "equipmentType": null,
          "exerciseCategory": null,
          "exerciseName": null,
          "weightValue": null,
          "weightDisplayUnit": null
        },
        {
          "type": "WorkoutStep",
          "stepOrder": 3,
          "intensity": "COOLDOWN",
          "description": "5 min retour au calme",
          "durationType": "TIME",
          "durationValue": 300,
          "durationValueType": null,
          "targetType": "OPEN",
          "targetValue": null,
          "targetValueLow": null,
          "targetValueHigh": null,
          "targetValueType": null,
          "secondaryTargetType": null,
          "secondaryTargetValue": null,
          "secondaryTargetValueLow": null,
          "secondaryTargetValueHigh": null,
          "secondaryTargetValueType": null,
          "strokeType": null,
          "drillType": null,
          "equipmentType": null,
          "exerciseCategory": null,
          "exerciseName": null,
          "weightValue": null,
          "weightDisplayUnit": null
        }
      ]
    }
  ]
}`;

const PLAN_INSTRUCTIONS = [
  "Utilise l'identifiant ownerId fourni.",
  "Déduis le sport principal à partir du plan (RUNNING, CYCLING, LAP_SWIMMING, etc.).",
  "Crée un seul segment avec toutes les étapes dans l'ordre du plan.",
  "Convertis chaque bloc temporel en secondes (ex: 8 min -> 480).",
  "Convertis chaque distance en mètres (ex: 400 m -> 400).",
  "Pour les répétitions (ex: 3 x 30 s), duplique les steps correspondants autant de fois que nécessaire.",
  "Quand une cible de puissance est exprimée en pourcentage de FTP, utilise targetType POWER et targetValueLow / targetValueHigh en pourcentage.",
  "Pour les zones cardiaques (Z1 à Z5), utilise targetType HEART_RATE et exprime la plage via targetValueLow / targetValueHigh.",
  "Pour une cadence donnée (rpm), utilise secondaryTargetType CADENCE avec targetValueLow / High.",
  "Mets les champs poolLength et poolLengthUnit à null sauf pour la natation (utilise la valeur fournie ou laisse null si inconnue).",
  "Assure-toi que workoutProvider et workoutSourceId valent \"Adapt2Life\".",
  "Laisse strokeType, drillType, equipmentType, exerciseCategory, exerciseName, weightValue et weightDisplayUnit à null.",
  "Si une information est absente, renseigne null plutôt qu'une chaîne vide.",
  "Respecte strictement la structure du schéma et renvoie uniquement le JSON final.",
].join("\n");

const parseJsonFromMessage = (message: { content?: unknown } | null | undefined): unknown | null => {
  if (!message) {
    return null;
  }

  const search = (value: unknown): unknown | null => {
    if (!value) {
      return null;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          const result = search(item);
          if (result !== null) {
            return result;
          }
        }
        return null;
      }

      const record = value as Record<string, unknown>;
      if (record.json && typeof record.json === "object") {
        return record.json;
      }
      if (typeof record.text === "string") {
        try {
          return JSON.parse(record.text);
        } catch {
          // ignore
        }
      }
      if (record.content !== undefined) {
        const nested = search(record.content);
        if (nested !== null) {
          return nested;
        }
      }
    }
    return null;
  };

  return search(message.content ?? message);
};

async function ensureLocalUser(stackUser: NonNullable<Awaited<ReturnType<typeof stackServerApp.getUser>>>) {
  const [existingUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
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
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  if (inserted) {
    return inserted;
  }

  const [fallback] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!fallback) {
    throw new Error("Impossible de récupérer ou créer l'utilisateur local.");
  }

  return fallback;
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

    const localUser = await ensureLocalUser(stackUser);

    const body = await request.json();
    const parsedBody = REQUEST_SCHEMA.safeParse(body);
    if (!parsedBody.success) {
      const message = parsedBody.error.issues.map((issue) => issue.message).join(" ");
      return NextResponse.json({ error: message || "Requête invalide." }, { status: 400 });
    }

    const userPrompt = [
      "Plan en Markdown à convertir :",
      '"""',
      parsedBody.data.plan,
      '"""',
      "",
      `ownerId à utiliser : ${localUser.id}`,
      "",
      "Rappels importants :",
      PLAN_INSTRUCTIONS,
      "",
      "Exemple de structure attendue :",
      "```json",
      REFERENCE_JSON,
      "```",
    ].join("\n");

    const completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Adapt2Life",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        temperature: 0.2,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: [
              SYSTEM_PROMPT,
              "",
              "Réponds uniquement avec un objet JSON valide. Aucune explication ou texte en dehors du JSON.",
            ].join("\n"),
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!completionResponse.ok) {
      const errorPayload = await completionResponse.text();
      if (completionResponse.status === 429) {
        return NextResponse.json({ error: "Le service d’IA est temporairement indisponible." }, { status: 429 });
      }
      console.error("garmin-json: OpenRouter error", {
        status: completionResponse.status,
        payload: errorPayload,
      });
      return NextResponse.json(
        { error: "Génération du JSON échouée sur OpenRouter.", details: errorPayload },
        { status: completionResponse.status },
      );
    }

    const completionJson = (await completionResponse.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const message = completionJson.choices?.[0]?.message ?? null;
    const rawJson = parseJsonFromMessage(message);

    if (!rawJson) {
      console.error("garmin-json: unable to parse JSON from OpenRouter response", {
        message,
      });
      return NextResponse.json(
        {
          error: "Réponse OpenRouter invalide : aucun JSON détecté.",
          details: message ?? null,
        },
        { status: 502 },
      );
    }

    const validated = GARMIN_WORKOUT_VALIDATOR.safeParse(rawJson);
    if (!validated.success) {
      console.error("garmin-json: validation failed", validated.error.format());
      return NextResponse.json(
        { error: "Le JSON généré n’est pas conforme au schéma attendu." },
        { status: 502 },
      );
    }

    return NextResponse.json({ workout: validated.data });
  } catch (error) {
    console.error("Erreur lors de la génération du JSON Garmin :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du JSON Garmin." }, { status: 500 });
  }
}
