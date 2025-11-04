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

    const assistantMessage = completionJson.choices?.[0]?.message ?? null;
    const rawContent = assistantMessage?.content;

    const tryParseString = (value: string | null | undefined): unknown | null => {
      if (!value) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const searchJson = (value: unknown): unknown | null => {
      if (!value) {
        return null;
      }
      if (typeof value === "string") {
        return tryParseString(value);
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const result = searchJson(item);
          if (result !== null) {
            return result;
          }
        }
        return null;
      }
      if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (record.json && typeof record.json === "object") {
          return record.json;
        }
        if (typeof record.text === "string") {
          const parsed = tryParseString(record.text);
          if (parsed !== null) {
            return parsed;
          }
        }
        if (typeof record.content === "string") {
          const parsed = tryParseString(record.content);
          if (parsed !== null) {
            return parsed;
          }
        }
        if (Array.isArray(record.content)) {
          const nested = searchJson(record.content);
          if (nested !== null) {
            return nested;
          }
        }
      }
      return null;
    };

    let parsed: unknown = null;
    if (typeof rawContent === "string" && rawContent.trim().length > 0) {
      parsed = tryParseString(rawContent);
    }
    if (parsed === null) {
      parsed = searchJson(assistantMessage);
    }

    if (parsed === null) {
      console.error("garmin-json: unable to parse OpenRouter content", { assistantMessage });
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

    return NextResponse.json({ workout });
  } catch (error) {
    console.error("Erreur lors de la génération du JSON Garmin :", error);
    return NextResponse.json({ error: "Erreur interne lors de la génération du JSON Garmin." }, { status: 500 });
  }
}
