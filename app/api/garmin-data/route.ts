import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { mockGarminData } from "@/lib/trainingScore";
import { eq } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [localUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    return NextResponse.json({
      connection: null,
      sections: [],
      trainingGaugeData: mockGarminData(),
      usedRealtimeMetrics: false,
    });
  }

  const data = await fetchGarminData(localUser.id);
  return NextResponse.json(data);
}
