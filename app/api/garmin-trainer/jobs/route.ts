import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fetchGarminConnectionByUserId } from "@/lib/services/garmin-connections";
import { stackServerApp } from "@/stack/server";
import { createGarminTrainerJob, ensureLocalUser, triggerGarminTrainerJobProcessing } from "@/lib/services/garminTrainerJobs";
import { createLogger } from "@/lib/logger";

const REQUEST_SCHEMA = z.object({
  planMarkdown: z.string().trim().min(1, "Merci de fournir un plan valide."),
});

const logger = createLogger("garmin-trainer-job-create");

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
  logger.info("garmin trainer job ensure local user", { stackUserId: stackUser.id, localUserId: localUser.id });
  const garminConnection = await fetchGarminConnectionByUserId(localUser.id);
  if (!garminConnection) {
    return NextResponse.json(
      { error: "Aucune connexion Garmin trouvée. Connecte ton compte Garmin puis réessaie." },
      { status: 409 },
    );
  }

  const job = await createGarminTrainerJob(localUser.id, parsed.data.planMarkdown);
  logger.info("garmin trainer job created", { jobId: job.id, userId: localUser.id });
  triggerGarminTrainerJobProcessing(job.id);

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    etaMinutes: 5,
    message: "Ton entraînement sera disponible dans Garmin Connect d’ici 5 minutes.",
  });
}
