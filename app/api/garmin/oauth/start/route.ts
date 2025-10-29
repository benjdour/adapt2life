import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { buildAuthorizationUrl, generatePkcePair, generateState } from "@/lib/adapters/garmin";
import { stackServerApp } from "@/stack/server";

const OAUTH_COOKIE = "garmin_oauth_state";
const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export async function GET(request: Request) {
  try {
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
