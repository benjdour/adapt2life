import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

export async function POST(request: Request) {
  try {
    const stackUser = await stackServerApp.getUser({ tokenStore: request });

    if (!stackUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [localUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stackId, stackUser.id))
      .limit(1);

    if (!localUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const result = await db
      .delete(garminConnections)
      .where(eq(garminConnections.userId, localUser.id))
      .returning({ id: garminConnections.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "No Garmin connection to disconnect" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Garmin disconnect failed", error);
    return NextResponse.json({ error: "Unable to disconnect from Garmin" }, { status: 500 });
  }
}
