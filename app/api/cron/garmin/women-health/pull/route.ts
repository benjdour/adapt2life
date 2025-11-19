import { NextRequest, NextResponse } from "next/server";

import { pullWomenHealthData } from "@/lib/services/garmin-women-health-pull";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const CRON_HEADER = "x-cron-secret";

const unauthorizedResponse = (logger?: ReturnType<typeof createLogger>) => {
  logger?.warn("cron unauthorized response");
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
};

const validateSecret = (request: NextRequest, logger: ReturnType<typeof createLogger>): { valid: boolean } => {
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const urlSecret = request.nextUrl?.searchParams?.get("secret") ?? null;
  const secret = bearerSecret ?? request.headers.get(CRON_HEADER) ?? urlSecret;
  const snippet = secret ? `${secret.slice(0, 6)}...` : null;

  if (secret !== env.CRON_SECRET) {
    logger.warn("cron invalid secret", {
      provided: secret ? "present" : "missing",
      snippet,
    });
    return { valid: false };
  }

  logger.info("cron secret accepted", { snippet });
  return { valid: true };
};

const executeCron = async (request: NextRequest) => {
  const logger = createLogger("cron-garmin-women-health", { headers: request.headers });
  const { valid } = validateSecret(request, logger);
  if (!valid) {
    return unauthorizedResponse(logger);
  }

  try {
    const stats = await pullWomenHealthData({ logger });
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    logger.error("cron women health pull failed", { error });
    return NextResponse.json({ error: "Pull failed" }, { status: 500 });
  }
};

export async function POST(request: NextRequest) {
  return executeCron(request);
}

export async function GET(request: NextRequest) {
  const logger = createLogger("cron-garmin-women-health", { headers: request.headers });
  logger.info("cron received GET request", {
    authorization: request.headers.get("authorization") ? "present" : "missing",
    cronHeader: request.headers.get(CRON_HEADER) ? "present" : "missing",
    querySecret: request.nextUrl?.searchParams?.has("secret") ? "present" : "missing",
  });
  return executeCron(request);
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
