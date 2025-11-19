import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fetchGarminConnectionByUserId } from "@/lib/services/garmin-connections";
import { stackServerApp } from "@/stack/server";
import { createGarminTrainerJob, ensureLocalUser } from "@/lib/services/garminTrainerJobs";

const REQUEST_SCHEMA = z.object({
  planMarkdown: z.string().trim().min(1, "Merci de fournir un plan valide."),
});

export async function POST(request: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide : JSON introuvable." }, { status: 400 });
  }

  const parsed = REQUEST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Plan invalide." }, { status: 400 });
  }

  const localUser = await ensureLocalUser(stackUser.id, stackUser.primaryEmail, stackUser.displayName);
  const garminConnection = await fetchGarminConnectionByUserId(localUser.id);
  if (!garminConnection) {
    return NextResponse.json(
      { error: "Aucune connexion Garmin trouvée. Connecte ton compte Garmin puis réessaie." },
      { status: 409 },
    );
  }

  const job = await createGarminTrainerJob(localUser.id, parsed.data.planMarkdown);

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    etaMinutes: 5,
    message: "Ton entraînement sera disponible dans Garmin Connect d’ici 5 minutes.",
  });
}
