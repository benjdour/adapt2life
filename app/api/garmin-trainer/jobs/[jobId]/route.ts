import { NextRequest, NextResponse } from "next/server";

import { stackServerApp } from "@/stack/server";
import { getGarminTrainerJobForUser, ensureLocalUser } from "@/lib/services/garminTrainerJobs";

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

  return NextResponse.json(job);
}
