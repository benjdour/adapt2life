import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { buildAuthorizationUrl, generatePkcePair, generateState } from "@/lib/adapters/garmin";
import { stackServerApp } from "@/stack/server";
import { DEFAULT_USER_PLAN, getUserPlanConfig } from "@/lib/constants/userPlans";

const OAUTH_COOKIE = "garmin_oauth_state";
const COOKIE_MAX_AGE_SECONDS = 10 * 60;

const buildIntegrationUrl = (requestUrl: URL, params?: Record<string, string | undefined>) => {
  const base = new URL("/integrations/garmin", requestUrl.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        base.searchParams.set(key, value);
      }
    }
  }
  return base;
};

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const stackUser = await stackServerApp.getUser({ tokenStore: request });
    if (!stackUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let [localUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stackId, stackUser.id))
      .limit(1);

    if (!localUser) {
      await db
        .insert(users)
        .values({
          stackId: stackUser.id,
          name: stackUser.displayName ?? "Utilisateur Stack",
          email: stackUser.primaryEmail ?? `user-${stackUser.id}@example.com`,
          planType: DEFAULT_USER_PLAN,
          trainingGenerationsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).trainingQuota ?? 0,
          garminConversionsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).conversionQuota ?? 0,
        })
        .onConflictDoNothing({ target: users.stackId });

      [localUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.stackId, stackUser.id))
        .limit(1);
    }

    if (!localUser) {
      return NextResponse.json({ error: "Unable to create user profile" }, { status: 500 });
    }

    const [existingConnection] = await db
      .select({
        garminUserId: garminConnections.garminUserId,
      })
      .from(garminConnections)
      .where(eq(garminConnections.userId, localUser.id))
      .limit(1);

    if (existingConnection) {
      const redirectUrl = buildIntegrationUrl(requestUrl, { status: "success", reason: "already_connected" });
      return NextResponse.redirect(redirectUrl);
    }

    const { codeVerifier, codeChallenge } = generatePkcePair();
    const state = generateState();
    const authorizationUrl = buildAuthorizationUrl({ state, codeChallenge });

    const cookiePayload = {
      state,
      codeVerifier,
      userId: localUser.id,
      stackUserId: stackUser.id,
    };
    const cookieValue = Buffer.from(JSON.stringify(cookiePayload)).toString("base64url");

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set({
      name: OAUTH_COOKIE,
      value: cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Garmin OAuth start failed", error);
    return NextResponse.json({ error: "Garmin authorization failed" }, { status: 500 });
  }
}
