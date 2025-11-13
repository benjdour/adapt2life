import { Redis } from "@upstash/redis";
import { NextResponse, type NextRequest } from "next/server";

const WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "120", 10);
const RATE_LIMIT_PREFIX = process.env.RATE_LIMIT_REDIS_PREFIX ?? "rate_limit";

type CounterState = {
  count: number;
  expiresInMs: number;
};

const hasRedisConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const RATE_LIMIT_IGNORES = ["/api/garmin/webhooks"];

const createRedisClient = () => {
  if (!hasRedisConfig) return null;
  try {
    return Redis.fromEnv();
  } catch (error) {
    console.warn("Impossible d'initialiser Upstash Redis pour le rate limiting.", error);
    return null;
  }
};

const redisClient = createRedisClient();

const ensureRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error("Upstash Redis doit être configuré pour le rate limiting.");
  }
  return redisClient;
};

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

const coerceNumber = (value: number | string) => (typeof value === "number" ? value : Number.parseInt(value, 10));

const incrementWithRedis = async (identifier: string): Promise<CounterState> => {
  const redis = ensureRedisClient();
  const key = `${RATE_LIMIT_PREFIX}:${identifier}`;
  const count = await redis.incr(key);
  let ttl = await redis.pttl(key);
  if (typeof ttl !== "number" || ttl < 0) {
    await redis.pexpire(key, WINDOW_MS);
    ttl = WINDOW_MS;
  }
  return {
    count: coerceNumber(count),
    expiresInMs: ttl,
  };
};

export const enforceRateLimit = async (request: NextRequest): Promise<NextResponse | null> => {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  if (RATE_LIMIT_IGNORES.some((ignored) => pathname.startsWith(ignored))) {
    return null;
  }

  const identifier = getClientIdentifier(request);
  try {
    const { count, expiresInMs } = await incrementWithRedis(identifier);

    if (count > MAX_REQUESTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil(expiresInMs / 1000));
      const response = NextResponse.json(
        { error: "Trop de requêtes. Merci de patienter avant de réessayer." },
        { status: 429 },
      );
      response.headers.set("Retry-After", `${retryAfterSeconds}`);
      return response;
    }
  } catch (error) {
    console.error("Impossible d'appliquer le rate limiting via Upstash Redis.", error);
    return NextResponse.json(
      { error: "Service temporairement indisponible. Merci de réessayer ultérieurement." },
      { status: 503 },
    );
  }

  return null;
};
