import { createHash, randomBytes } from "crypto";

import { env } from "@/lib/env";

const GARMIN_AUTH_URL = "https://connect.garmin.com/oauth2Confirm";
const GARMIN_TOKEN_URL = "https://diauth.garmin.com/di-oauth2-service/oauth/token";
const GARMIN_USER_ID_URL = "https://apis.garmin.com/wellness-api/rest/user/id";

export interface GarminTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
  scope: string;
  jti: string;
  refresh_token_expires_in?: number;
}

export interface GarminTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string;
  accessTokenExpiresAt: Date;
  raw: GarminTokenResponse;
}

export class GarminOAuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "GarminOAuthError";
  }
}

export const generateState = (): string => randomBytes(16).toString("hex");

export const generatePkcePair = (): { codeVerifier: string; codeChallenge: string } => {
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
};

export const buildAuthorizationUrl = ({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}): string => {
  const url = new URL(GARMIN_AUTH_URL);
  url.searchParams.set("client_id", env.GARMIN_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", env.GARMIN_REDIRECT_URI);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
};

export const exchangeAuthorizationCode = async ({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}): Promise<GarminTokens> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.GARMIN_CLIENT_ID,
    client_secret: env.GARMIN_CLIENT_SECRET,
    code,
    code_verifier: codeVerifier,
    redirect_uri: env.GARMIN_REDIRECT_URI,
  });

  const response = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new GarminOAuthError(`Garmin token exchange failed (${response.status})`, errorBody);
  }

  const payload = (await response.json()) as GarminTokenResponse;
  const expiresIn = Math.max(0, payload.expires_in ?? 0);
  const safeExpiresIn = Math.max(0, expiresIn - 600); // refresh 10 minutes early

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type,
    scope: payload.scope,
    accessTokenExpiresAt: new Date(Date.now() + safeExpiresIn * 1000),
    raw: payload,
  };
};

export const fetchGarminUserId = async (accessToken: string): Promise<string> => {
  const response = await fetch(GARMIN_USER_ID_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new GarminOAuthError(`Garmin user id fetch failed (${response.status})`, errorBody);
  }

  const data = (await response.json()) as { userId: string };
  if (!data.userId) {
    throw new GarminOAuthError("Garmin user id response missing userId");
  }

  return data.userId;
};
