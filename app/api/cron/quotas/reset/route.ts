import { NextRequest, NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";
import { resetMonthlyQuotas } from "@/lib/services/userCredits";

const CRON_HEADER = "x-cron-secret";

const unauthorizedResponse = (logger?: ReturnType<typeof createLogger>) => {
  logger?.warn("quota reset cron unauthorized");
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
};

const validateSecret = (request: NextRequest, logger: ReturnType<typeof createLogger>): { valid: boolean } => {
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const urlSecret = request.nextUrl?.searchParams?.get("secret") ?? null;
  const secret = bearerSecret ?? request.headers.get(CRON_HEADER) ?? urlSecret;

  if (secret !== env.CRON_SECRET) {
    logger.warn("invalid cron secret", { provided: Boolean(secret) });
    return { valid: false };
  }

  return { valid: true };
};

const executeCron = async (request: NextRequest) => {
  const logger = createLogger("cron-monthly-quota-reset", { headers: request.headers });
  const { valid } = validateSecret(request, logger);
  if (!valid) {
    return unauthorizedResponse(logger);
  }

  try {
    const result = await resetMonthlyQuotas();
    logger.info("monthly quotas reset", result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("monthly quotas reset failed", { error });
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
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
