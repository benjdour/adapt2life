import { cookies } from "next/headers";

export type SessionPayload = {
  userId: number;
  locale?: string;
  firstName?: string;
};

export const SESSION_COOKIE = "adapt_session";

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

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  return decodeSession(cookie);
}

export function clearSessionCookies() {
  cookies().delete(SESSION_COOKIE);
}
