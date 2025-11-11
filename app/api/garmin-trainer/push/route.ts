import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureGarminAccessToken, fetchGarminConnectionByUserId } from "@/lib/services/garmin-connections";
import { workoutSchema } from "@/schemas/garminTrainer.schema";
import { stackServerApp } from "@/stack/server";

const GARMIN_WORKOUT_CREATE_URL = "https://apis.garmin.com/workoutportal/workout/v2";
const GARMIN_WORKOUT_SCHEDULE_URL = "https://apis.garmin.com/training-api/schedule/";

const REQUEST_SCHEMA = z.object({
  workout: workoutSchema,
});

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

  const fallbackEmail =
    stackUserEmail && stackUserEmail.trim().length > 0 ? stackUserEmail : `${stackUserId}@adapt2life.local`;

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

const ensureOwnerIdType = (garminUserId: string): string | number => {
  const numeric = Number.parseInt(garminUserId, 10);
  if (Number.isFinite(numeric) && Number.isSafeInteger(numeric)) {
    return numeric;
  }
  return garminUserId;
};

export async function POST(request: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!stackUser) {
    return NextResponse.json(
      { error: "Authentification requise pour pousser un entraînement vers Garmin." },
      { status: 401 },
    );
  }

  const { id: localUserId } = await ensureLocalUser(stackUser.id, stackUser.primaryEmail, stackUser.displayName);

  const garminConnection = await fetchGarminConnectionByUserId(localUserId);
  if (!garminConnection) {
    return NextResponse.json(
      { error: "Aucune connexion Garmin trouvée pour cet utilisateur. Connecte ton compte Garmin puis réessaie." },
      { status: 409 },
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide : impossible de lire le JSON." }, { status: 400 });
  }

  const parsedRequest = REQUEST_SCHEMA.safeParse(requestBody);
  if (!parsedRequest.success) {
    const firstError = parsedRequest.error.issues[0]?.message ?? "Payload invalide.";
    return NextResponse.json({ error: firstError, issues: parsedRequest.error.issues }, { status: 400 });
  }

  const { accessToken, connection } = await ensureGarminAccessToken(garminConnection);
  const garminUserId = connection.garminUserId;

  const normalizeSourceField = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim().slice(0, 20);
    }
    return fallback;
  };

  const workoutPayload = {
    ...parsedRequest.data.workout,
    ownerId: ensureOwnerIdType(garminUserId),
    workoutProvider: normalizeSourceField(parsedRequest.data.workout.workoutProvider, "Adapt2Life"),
    workoutSourceId: normalizeSourceField(parsedRequest.data.workout.workoutSourceId, "Adapt2Life"),
  };

  try {
    const garminResponse = await fetch(GARMIN_WORKOUT_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(workoutPayload),
    });

    const responseText = await garminResponse.text();

    let responseJson: unknown = null;
    if (responseText) {
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = null;
      }
    }
    const responseData =
      responseJson && typeof responseJson === "object" ? (responseJson as Record<string, unknown>) : null;

    if (!garminResponse.ok) {
      const errorMessage =
        typeof responseData?.message === "string"
          ? responseData.message
          : typeof responseData?.error === "string"
            ? responseData.error
            : "Garmin a refusé la création de l’entraînement.";

      return NextResponse.json(
        {
          error: errorMessage,
          status: garminResponse.status,
          garminResponse: responseData ?? responseText ?? null,
        },
        { status: garminResponse.status },
      );
    }

    const workoutIdRaw =
      responseData?.workoutId ??
      responseData?.id ??
      (typeof responseData?.workout === "object" ? (responseData.workout as Record<string, unknown>)?.workoutId : null);

    const workoutId =
      typeof workoutIdRaw === "number"
        ? workoutIdRaw
        : typeof workoutIdRaw === "string" && workoutIdRaw.trim().length > 0
          ? Number.parseInt(workoutIdRaw, 10)
          : null;

    if (workoutId == null || Number.isNaN(workoutId)) {
      return NextResponse.json(
        {
          error: "Garmin n’a pas renvoyé d’identifiant d’entraînement, planification impossible.",
          garminResponse: responseData ?? responseText ?? null,
        },
        { status: 502 },
      );
    }

    const scheduleDate = new Date().toISOString().slice(0, 10);

    const scheduleResponse = await fetch(GARMIN_WORKOUT_SCHEDULE_URL, {
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
    });

    const scheduleText = await scheduleResponse.text();
    let scheduleJson: unknown = null;
    if (scheduleText) {
      try {
        scheduleJson = JSON.parse(scheduleText);
      } catch {
        scheduleJson = null;
      }
    }
    const scheduleData =
      scheduleJson && typeof scheduleJson === "object" ? (scheduleJson as Record<string, unknown>) : null;

    if (!scheduleResponse.ok) {
      const scheduleErrorMessage =
        typeof scheduleData?.message === "string"
          ? scheduleData.message
          : typeof scheduleData?.error === "string"
            ? scheduleData.error
            : "Garmin a refusé la planification de l’entraînement.";

      return NextResponse.json(
        {
          error: scheduleErrorMessage,
          status: scheduleResponse.status,
          garminResponse: {
            workoutCreation: responseData ?? responseText ?? null,
            schedule: scheduleData ?? scheduleText ?? null,
          },
        },
        { status: scheduleResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      workoutId,
      scheduledFor: scheduleDate,
      garminResponse: {
        workoutCreation: responseData ?? responseText ?? null,
        schedule: scheduleData ?? scheduleText ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur réseau lors de l’appel à l’API Garmin Training.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
