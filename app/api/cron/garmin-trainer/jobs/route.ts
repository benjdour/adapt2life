import { NextRequest, NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";
import { processPendingGarminTrainerJobs } from "@/lib/services/garminTrainerJobs";

const logger = createLogger("cron-garmin-trainer-jobs");

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const headerSecret = bearer ?? request.headers.get("x-cron-secret");

  if (headerSecret !== env.CRON_SECRET) {
    logger.warn("invalid cron secret", { provided: headerSecret ? "present" : "missing" });
    return unauthorized();
  }

  const processed = await processPendingGarminTrainerJobs(5);
  return NextResponse.json({ processed }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
