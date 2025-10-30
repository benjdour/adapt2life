import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { GarminOAuthError, exchangeAuthorizationCode, fetchGarminUserId } from "@/lib/adapters/garmin";
import { encryptSecret } from "@/lib/crypto";
import { stackServerApp } from "@/stack/server";

const OAUTH_COOKIE = "garmin_oauth_state";

type OAuthCookiePayload = {
  state: string;
  codeVerifier: string;
  userId: number;
  stackUserId: string;
};

const redirectWithCleanup = (url: URL) => {
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: OAUTH_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
};

const decodeCookie = (value: string): OAuthCookiePayload | null => {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    return JSON.parse(json) as OAuthCookiePayload;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const fallbackOrigin = requestUrl.origin;
  let appOrigin = fallbackOrigin;

  try {
    const envModule = await import("@/lib/env");
    const configuredUrl = envModule.env.APP_URL ?? new URL(envModule.env.GARMIN_REDIRECT_URI).origin;
    const configuredHost = new URL(configuredUrl).host;

    if (configuredHost === requestUrl.host) {
      appOrigin = configuredUrl;
    }
  } catch (error) {
    console.warn("Garmin callback unable to resolve APP_URL from env, fallback to request origin", error);
    appOrigin = fallbackOrigin;
  }

  const buildResultUrl = (status: "success" | "error", reason?: string) => {
    const url = new URL("/integrations/garmin", appOrigin);
    url.searchParams.set("status", status);
    if (reason) {
      url.searchParams.set("reason", reason);
    }
    return url;
  };

  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    console.warn("Garmin redirected with error param", errorParam);
    return redirectWithCleanup(buildResultUrl("error", "authorization_declined"));
  }

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  if (!code || !stateParam) {
    console.error("Garmin callback missing code or state", { hasCode: Boolean(code), hasState: Boolean(stateParam) });
    return redirectWithCleanup(buildResultUrl("error", "missing_parameters"));
  }

  const cookieStore = await cookies();
  const storedCookie = cookieStore.get(OAUTH_COOKIE);

  if (!storedCookie) {
    console.error("Garmin callback without stored oauth cookie");
    return redirectWithCleanup(buildResultUrl("error", "invalid_session"));
  }

  const cookiePayload = decodeCookie(storedCookie.value);
  if (!cookiePayload) {
    console.error("Garmin callback unable to decode oauth cookie");
    return redirectWithCleanup(buildResultUrl("error", "invalid_session"));
  }

  if (cookiePayload.state !== stateParam) {
    console.error("Garmin callback state mismatch");
    return redirectWithCleanup(buildResultUrl("error", "invalid_state"));
  }

  try {
    const stackUser = await stackServerApp.getUser({ tokenStore: request });
    if (!stackUser || stackUser.id !== cookiePayload.stackUserId) {
      console.error("Garmin callback stack user mismatch or missing");
      return redirectWithCleanup(buildResultUrl("error", "unauthorized"));
    }

    const [localUser] = await db
      .select({
        id: users.id,
        stackId: users.stackId,
      })
      .from(users)
      .where(eq(users.id, cookiePayload.userId))
      .limit(1);

    if (!localUser) {
      console.error("Garmin callback unable to find local user", { userId: cookiePayload.userId });
      return redirectWithCleanup(buildResultUrl("error", "user_not_found"));
    }

    if (localUser.stackId !== stackUser.id) {
      console.error("Garmin callback local user mismatch", {
        expectedStackId: stackUser.id,
        actualStackId: localUser.stackId,
      });
      return redirectWithCleanup(buildResultUrl("error", "unauthorized"));
    }

    const tokens = await exchangeAuthorizationCode({
      code,
      codeVerifier: cookiePayload.codeVerifier,
    });

    const garminUserId = await fetchGarminUserId(tokens.accessToken);

    const existingGarmin = await db
      .select({ userId: garminConnections.userId })
      .from(garminConnections)
      .where(eq(garminConnections.garminUserId, garminUserId))
      .limit(1);

    if (existingGarmin.length > 0 && existingGarmin[0].userId !== localUser.id) {
      console.error("Garmin account already linked to another user", { garminUserId });
      return redirectWithCleanup(buildResultUrl("error", "already_linked"));
    }

    const accessTokenEncrypted = encryptSecret(tokens.accessToken);
    const refreshTokenEncrypted = encryptSecret(tokens.refreshToken);

    await db
      .insert(garminConnections)
      .values({
        userId: localUser.id,
        garminUserId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      })
      .onConflictDoUpdate({
        target: garminConnections.userId,
        set: {
          garminUserId,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenType: tokens.tokenType,
          scope: tokens.scope,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          updatedAt: new Date(),
        },
      });

    return redirectWithCleanup(buildResultUrl("success"));
  } catch (error) {
    if (error instanceof GarminOAuthError) {
      console.error("Garmin OAuth callback failed", { message: error.message, cause: error.cause });
      return redirectWithCleanup(buildResultUrl("error", "oauth_failed"));
    }

    console.error("Unexpected Garmin callback failure", error);
    return redirectWithCleanup(buildResultUrl("error", "unexpected_error"));
  }
}
