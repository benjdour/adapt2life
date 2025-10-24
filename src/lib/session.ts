import { cookies } from "next/headers";

export type SessionPayload = {
  userId: number;
  locale?: string;
  firstName?: string;
};

export const SESSION_COOKIE = "adapt_session";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

function decodeSession(value: string | undefined): SessionPayload | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64").toString("utf-8");
    const payload = JSON.parse(decoded) as SessionPayload;

    if (payload && typeof payload.userId === "number") {
      return payload;
    }
  } catch (error) {
    console.warn("Failed to decode session cookie", error);
  }

  return null;
}

export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

export async function setSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  const encoded = encodeSession(payload);
  cookieStore.set(SESSION_COOKIE, encoded, SESSION_COOKIE_OPTIONS);
  return payload;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  return decodeSession(cookie);
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE, { path: "/" });
}
