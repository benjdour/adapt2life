import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { db } from "@/db";
import {
  garminConnections,
  garminDailySummaries,
  garminPullCursors,
  garminTrainerJobs,
  garminWebhookEvents,
  userGeneratedArtifacts,
  users,
  workouts,
} from "@/db/schema";

const ensureAdmin = async (request: NextRequest) => {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!user || !canAccessAdminArea(user.id)) {
    return null;
  }
  return user;
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const admin = await ensureAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(params.userId);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Identifiant utilisateur invalide." }, { status: 400 });
  }

  const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!targetUser) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx.delete(garminConnections).where(eq(garminConnections.userId, userId));
    await tx.delete(garminDailySummaries).where(eq(garminDailySummaries.userId, userId));
    await tx.delete(garminWebhookEvents).where(eq(garminWebhookEvents.userId, userId));
    await tx.delete(garminPullCursors).where(eq(garminPullCursors.userId, userId));
    await tx.delete(userGeneratedArtifacts).where(eq(userGeneratedArtifacts.userId, userId));
    await tx.delete(garminTrainerJobs).where(eq(garminTrainerJobs.userId, userId));
    await tx.delete(workouts).where(eq(workouts.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });

  return NextResponse.json({ success: true });
}
