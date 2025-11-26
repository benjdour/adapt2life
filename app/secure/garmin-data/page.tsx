import { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import GarminDataClient from "@/components/GarminDataClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCachedGarminData } from "@/lib/cachedGarminData";
import { mockGarminData } from "@/lib/trainingScore";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasStackSessionCookie } from "@/lib/stack/sessionCookies";

export const metadata: Metadata = {
  title: "Adapt2Life — Données Garmin",
};

type GarminDataPanelProps = {
  localUserId: number;
  gender: string | null;
};

function GarminDataSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-foreground/10" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-foreground/5" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-foreground/5" />
      </CardContent>
    </Card>
  );
}

async function GarminDataPanel({ localUserId, gender }: GarminDataPanelProps) {
  const data =
    (await getCachedGarminData(localUserId, { gender })) ??
    {
      connection: null,
      sections: [],
      trainingGaugeData: mockGarminData(),
      usedRealtimeMetrics: false,
      hasSyncedOnce: false,
    };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <GarminDataClient initialData={data} />
      </CardContent>
    </Card>
  );
}

export default async function GarminDataPage() {
  if (!hasStackSessionCookie()) {
    redirect("/handler/sign-in?redirect=/secure/garmin-data");
  }

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/secure/garmin-data");
  }

  const [localUser] = await db
    .select({ id: users.id, gender: users.gender })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    redirect("/integrations/garmin");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">Garmin</p>
          <CardTitle>Données synchronisées</CardTitle>
          <CardDescription>Visualise les métriques clés envoyées par Garmin Connect.</CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<GarminDataSkeleton />}>
        <GarminDataPanel localUserId={localUser.id} gender={localUser.gender} />
      </Suspense>
    </div>
  );
}
