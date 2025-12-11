import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { mockGarminData } from "@/lib/trainingScore";
import { eq } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";
import { LOCALE_HEADER_NAME } from "@/lib/i18n/constants";
import { DEFAULT_LOCALE, type Locale, isLocale } from "@/lib/i18n/locales";

const resolveLocale = (request: Request): Locale => {
  const url = new URL(request.url);
  const searchLocale = url.searchParams.get("locale");
  if (searchLocale && isLocale(searchLocale)) {
    return searchLocale;
  }
  const headerLocale = request.headers.get(LOCALE_HEADER_NAME);
  if (headerLocale && isLocale(headerLocale)) {
    return headerLocale;
  }
  return DEFAULT_LOCALE;
};

export async function GET(request: Request) {
  const locale = resolveLocale(request);
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [localUser] = await db
    .select({ id: users.id, gender: users.gender })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    return NextResponse.json({
      connection: null,
      sections: [],
      trainingGaugeData: mockGarminData(),
      usedRealtimeMetrics: false,
      hasSyncedOnce: false,
    });
  }

  const data = await fetchGarminData(localUser.id, { gender: localUser.gender, locale });
  return NextResponse.json(data);
}
