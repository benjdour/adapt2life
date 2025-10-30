import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { ensureGarminAccessToken, fetchGarminConnectionByUserId } from "@/lib/services/garmin-connections";
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

    const connection = await fetchGarminConnectionByUserId(localUser.id);
    if (!connection) {
      return NextResponse.json({ error: "No Garmin connection to disconnect" }, { status: 404 });
    }

    const { accessToken } = await ensureGarminAccessToken(connection);

    try {
      const response = await fetch("https://apis.garmin.com/wellness-api/rest/user/registration", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Accept-Encoding": "gzip,deflate",
          "User-Agent": "Adapt2Life-GarminDisconnect/1.0",
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorBody = await response.text().catch(() => undefined);
        console.error("Garmin deregistration failed", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        return NextResponse.json({ error: "Failed to deregister Garmin connection" }, { status: 502 });
      }
    } catch (error) {
      console.error("Garmin deregistration request error", error);
      return NextResponse.json({ error: "Failed to deregister Garmin connection" }, { status: 502 });
    }

    await db.delete(garminConnections).where(eq(garminConnections.userId, localUser.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Garmin disconnect failed", error);
    return NextResponse.json({ error: "Unable to disconnect from Garmin" }, { status: 500 });
  }
}
