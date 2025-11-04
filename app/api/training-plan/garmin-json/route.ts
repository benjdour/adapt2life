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


const GARMIN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "ownerId",
    "workoutName",
    "description",
    "sport",
    "estimatedDurationInSecs",
    "estimatedDistanceInMeters",
    "poolLength",
    "poolLengthUnit",
    "workoutProvider",
    "workoutSourceId",
    "isSessionTransitionEnabled",
    "segments",
  ],
  properties: {
    ownerId: { anyOf: [{ type: "integer" }, { type: "null" }] },
    workoutName: { type: "string" },
    description: { type: "string" },
    sport: {
      enum: [
        "RUNNING",
        "CYCLING",
        "LAP_SWIMMING",
        "STRENGTH_TRAINING",
        "CARDIO_TRAINING",
        "YOGA",
        "PILATES",
        "MULTI_SPORT",
      ],
    },
    estimatedDurationInSecs: { anyOf: [{ type: "integer" }, { type: "null" }] },
    estimatedDistanceInMeters: { anyOf: [{ type: "number" }, { type: "null" }] },
    poolLength: { anyOf: [{ type: "number" }, { type: "null" }] },
    poolLengthUnit: { anyOf: [{ type: "string" }, { type: "null" }] },
    workoutProvider: { type: "string" },
    workoutSourceId: { type: "string" },
    isSessionTransitionEnabled: { type: "boolean" },
    segments: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "segmentOrder",
          "sport",
          "estimatedDurationInSecs",
          "estimatedDistanceInMeters",
          "poolLength",
          "poolLengthUnit",
          "steps",
        ],
        properties: {
          segmentOrder: { type: "integer" },
          sport: { type: "string" },
          estimatedDurationInSecs: { anyOf: [{ type: "integer" }, { type: "null" }] },
          estimatedDistanceInMeters: { anyOf: [{ type: "number" }, { type: "null" }] },
          poolLength: { anyOf: [{ type: "number" }, { type: "null" }] },
          poolLengthUnit: { anyOf: [{ type: "string" }, { type: "null" }] },
          steps: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "type",
                "stepId",
                "stepOrder",
                "repeatType",
                "repeatValue",
                "skipLastRestStep",
                "steps",
                "intensity",
                "description",
                "durationType",
                "durationValue",
                "durationValueType",
                "equipmentType",
                "exerciseCategory",
                "exerciseName",
                "weightValue",
                "weightDisplayUnit",
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
                "strokeType",
                "drillType",
              ],
              properties: {
                type: { enum: ["WorkoutStep", "WorkoutRepeatStep"] },
                stepId: { anyOf: [{ type: "integer" }, { type: "null" }] },
                stepOrder: { type: "integer" },
                repeatType: { anyOf: [{ type: "string" }, { type: "null" }] },
                repeatValue: { anyOf: [{ type: "number" }, { type: "null" }] },
                skipLastRestStep: { type: "boolean" },
                steps: {
                  anyOf: [
                    { type: "null" },
                    {
                      type: "array",
                      items: { $ref: "#" },
                    },
                  ],
                },
                intensity: {
                  enum: ["REST", "WARMUP", "COOLDOWN", "RECOVERY", "ACTIVE", "INTERVAL", "MAIN"],
                },
                description: { type: "string" },
                durationType: { enum: ["TIME", "DISTANCE", "REPS"] },
                durationValue: { anyOf: [{ type: "number" }, { type: "null" }] },
                durationValueType: { anyOf: [{ type: "string" }, { type: "null" }] },
                equipmentType: { anyOf: [{ type: "string" }, { type: "null" }] },
                exerciseCategory: { anyOf: [{ type: "string" }, { type: "null" }] },
                exerciseName: { anyOf: [{ type: "string" }, { type: "null" }] },
                weightValue: { anyOf: [{ type: "number" }, { type: "null" }] },
                weightDisplayUnit: { anyOf: [{ type: "string" }, { type: "null" }] },
                targetType: {
                  anyOf: [
                    {
                      enum: [
                        "OPEN",
                        "SPEED",
                        "HEART_RATE",
                        "POWER",
                        "CADENCE",
                        "GRADE",
                        "RESISTANCE",
                        "POWER_3S",
                        "POWER_10S",
                        "POWER_30S",
                        "POWER_LAP",
                        "SPEED_LAP",
                        "HEART_RATE_LAP",
                        "PACE",
                      ],
                    },
                    { type: "null" },
                  ],
                },
                targetValue: { anyOf: [{ type: "number" }, { type: "null" }] },
                targetValueLow: { anyOf: [{ type: "number" }, { type: "null" }] },
                targetValueHigh: { anyOf: [{ type: "number" }, { type: "null" }] },
                targetValueType: { anyOf: [{ enum: ["PERCENT"] }, { type: "null" }] },
                secondaryTargetType: { anyOf: [{ type: "string" }, { type: "null" }] },
                secondaryTargetValue: { anyOf: [{ type: "number" }, { type: "null" }] },
                secondaryTargetValueLow: { anyOf: [{ type: "number" }, { type: "null" }] },
                secondaryTargetValueHigh: { anyOf: [{ type: "number" }, { type: "null" }] },
                secondaryTargetValueType: { anyOf: [{ type: "string" }, { type: "null" }] },
                strokeType: { anyOf: [{ type: "string" }, { type: "null" }] },
                drillType: { anyOf: [{ type: "string" }, { type: "null" }] },
              },
            },
          },
        },
      },
    },
  },
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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "garmin_workout",
            schema: GARMIN_JSON_SCHEMA,
          },
        },
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

    const trimmedContent = rawContent.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmedContent);
    } catch (parseError) {
      console.error("garmin-json: unable to parse OpenRouter content", { trimmedContent, parseError });
      return NextResponse.json(
        { error: "Réponse OpenRouter invalide : JSON non reconnu." },
        { status: 502 },
      );
    }

    if (typeof parsed !== "object" || parsed === null) {
      console.error("garmin-json: parsed content is not an object", { parsed });
      return NextResponse.json(
        { error: "Réponse OpenRouter invalide : structure inattendue." },
        { status: 502 },
      );
    }

    const workout = {
      ...(parsed as Record<string, unknown>),
      ownerId: localUser.id,
      workoutProvider: "Adapt2Life",
      workoutSourceId: "Adapt2Life",
    };

    return NextResponse.json({ workoutJson: JSON.stringify(workout, null, 2) });
  } catch (error) {
    console.error("Erreur lors de la génération du JSON Garmin :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du JSON Garmin." }, { status: 500 });
  }
}
