import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { ADAPT2LIFE_GARMIN_JSON_PROMPT } from "@/lib/prompts/adapt2lifeGarminJsonPrompt";

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

    const userPrompt = parsedBody.data.plan;

    const completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Adapt2Life",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        temperature: 0.2,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: [
              ADAPT2LIFE_GARMIN_JSON_PROMPT,
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

    const rawContent = completionJson.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      console.error("garmin-json: OpenRouter response missing string content", {
        message: completionJson.choices?.[0]?.message,
      });
      return NextResponse.json(
        { error: "Réponse OpenRouter invalide : contenu absent." },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("garmin-json: unable to parse OpenRouter content", { rawContent, parseError });
      return NextResponse.json(
        { error: "Réponse OpenRouter invalide : JSON non reconnu." },
        { status: 502 },
      );
    }

    const validated = GARMIN_WORKOUT_VALIDATOR.safeParse(parsed);
    if (!validated.success) {
      console.error("garmin-json: validation failed", validated.error.format());
      return NextResponse.json(
        { error: "Le JSON généré n’est pas conforme au schéma attendu." },
        { status: 502 },
      );
    }

    const workout = {
      ...validated.data,
      ownerId: localUser.id,
      workoutProvider: "Adapt2Life",
      workoutSourceId: "Adapt2Life",
    };

    return NextResponse.json({ workout });
  } catch (error) {
    console.error("Erreur lors de la génération du JSON Garmin :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du JSON Garmin." }, { status: 500 });
  }
}
