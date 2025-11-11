import { NextResponse, type NextRequest } from "next/server";

const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "120", 10);

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();
const RATE_LIMIT_IGNORES = ["/api/garmin/webhooks"];

const getClientIdentifier = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first && first.trim().length > 0) {
      return first.trim();
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }
  return "anonymous";
};

export const enforceRateLimit = (request: NextRequest): NextResponse | null => {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  if (RATE_LIMIT_IGNORES.some((ignored) => pathname.startsWith(ignored))) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  const now = Date.now();

  const bucket = buckets.get(identifier);
  if (!bucket || bucket.expiresAt <= now) {
    buckets.set(identifier, {
      count: 1,
      expiresAt: now + WINDOW_MS,
    });
    return null;
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));
    const response = NextResponse.json(
      { error: "Trop de requêtes. Merci de patienter avant de réessayer." },
      { status: 429 },
    );
    response.headers.set("Retry-After", `${retryAfterSeconds}`);
    return response;
  }

  bucket.count += 1;
  buckets.set(identifier, bucket);
  return null;
};
