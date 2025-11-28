import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { db } from "@/db";
import { users } from "@/db/schema";
import { applyUserPlan } from "@/lib/services/userCredits";
import { USER_PLAN_IDS, type UserPlanId } from "@/lib/constants/userPlans";

const PLAN_SCHEMA = z.object({
  planType: z.enum(USER_PLAN_IDS),
});

const ensureAdmin = async (request: NextRequest) => {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!user || !canAccessAdminArea(user.id)) {
    return null;
  }
  return user;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await ensureAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdParam } = await params;
  const userId = Number(userIdParam);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Identifiant utilisateur invalide." }, { status: 400 });
  }

  let payload: { planType: UserPlanId };
  try {
    payload = PLAN_SCHEMA.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message ?? "Plan invalide." : "Plan invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  await applyUserPlan(userId, payload.planType);

  return NextResponse.json({ success: true });
}
