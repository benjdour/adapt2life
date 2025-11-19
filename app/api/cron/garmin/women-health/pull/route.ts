import { NextRequest, NextResponse } from "next/server";

import { pullWomenHealthData } from "@/lib/services/garmin-women-health-pull";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";

const CRON_HEADER = "x-cron-secret";

const unauthorizedResponse = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(request: NextRequest) {
  const logger = createLogger("cron-garmin-women-health", { headers: request.headers });
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;
  const secret = bearerSecret ?? request.headers.get(CRON_HEADER);

  if (secret !== env.CRON_SECRET) {
    logger.warn("cron invalid secret", { provided: secret ? "present" : "missing" });
    return unauthorizedResponse();
  }

  try {
    const stats = await pullWomenHealthData({ logger });
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    logger.error("cron women health pull failed", { error });
    return NextResponse.json({ error: "Pull failed" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
