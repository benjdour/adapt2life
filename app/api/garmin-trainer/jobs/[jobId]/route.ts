import { NextRequest, NextResponse } from "next/server";

import { stackServerApp } from "@/stack/server";
import {
  getGarminTrainerJobForUser,
  ensureLocalUser,
  hasGarminTrainerJobTimedOut,
  markGarminTrainerJobFailed,
} from "@/lib/services/garminTrainerJobs";
import { createLogger } from "@/lib/logger";

const logger = createLogger("garmin-trainer-job-status");
const JOB_TIMEOUT_ERROR =
  "Le traitement Garmin a dépassé le délai autorisé et a été interrompu. Relance la conversion pour réessayer.";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { jobId } = await params;
  const numericJobId = Number.parseInt(jobId, 10);
  if (!Number.isFinite(numericJobId)) {
    return NextResponse.json({ error: "Identifiant de job invalide." }, { status: 400 });
  }

  const localUser = await ensureLocalUser(stackUser.id, stackUser.primaryEmail, stackUser.displayName);
  const job = await getGarminTrainerJobForUser(numericJobId, localUser.id);
  if (!job) {
    return NextResponse.json({ error: "Job introuvable." }, { status: 404 });
  }

  if (hasGarminTrainerJobTimedOut(job)) {
    await markGarminTrainerJobFailed(job.id, JOB_TIMEOUT_ERROR);
    logger.warn("garmin trainer job timed out", {
      jobId: job.id,
      status: job.status,
      updatedAt: job.updatedAt ?? job.createdAt,
    });
    const failedJob = await getGarminTrainerJobForUser(job.id, localUser.id);
    if (failedJob) {
      return NextResponse.json(failedJob);
    }
  }

  return NextResponse.json(job);
}
