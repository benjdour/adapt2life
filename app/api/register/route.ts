import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { DEFAULT_USER_PLAN, getUserPlanConfig } from "@/lib/constants/userPlans";

const registerSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide.").optional(),
});

export async function POST(request: Request) {
  const stackUser = await stackServerApp.getUser({ tokenStore: request, or: "return-null" });
  if (!stackUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof registerSchema>;
  try {
    payload = registerSchema.parse((await request.json()) as unknown);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return NextResponse.json({ error: firstIssue?.message ?? "Requête invalide." }, { status: 400 });
    }
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const resolvedEmail = payload.email ?? stackUser.primaryEmail ?? `user-${stackUser.id}@example.com`;
  const resolvedName = payload.name || stackUser.displayName || "Utilisateur Adapt2Life";

  try {
    await db
      .insert(users)
      .values({
        stackId: stackUser.id,
        name: resolvedName,
        email: resolvedEmail,
        planType: DEFAULT_USER_PLAN,
        trainingGenerationsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).trainingQuota ?? 0,
        garminConversionsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).conversionQuota ?? 0,
      })
      .onConflictDoNothing({ target: users.stackId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error inserting user:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
