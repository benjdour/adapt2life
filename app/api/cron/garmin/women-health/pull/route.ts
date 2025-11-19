import { NextRequest, NextResponse } from "next/server";

import { pullWomenHealthData } from "@/lib/services/garmin-women-health-pull";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const CRON_HEADER = "x-cron-secret";

const unauthorizedResponse = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const validateSecret = (request: NextRequest): { logger: ReturnType<typeof createLogger>; valid: boolean } => {
  const logger = createLogger("cron-garmin-women-health", { headers: request.headers });
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? request.headers.get(CRON_HEADER);

  if (secret !== env.CRON_SECRET) {
    logger.warn("cron invalid secret", { provided: secret ? "present" : "missing" });
    return { logger, valid: false };
  }

  return { logger, valid: true };
};

const executeCron = async (request: NextRequest) => {
  const { logger, valid } = validateSecret(request);
  if (!valid) {
    return unauthorizedResponse();
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
  return executeCron(request);
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
