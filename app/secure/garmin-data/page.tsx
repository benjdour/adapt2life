import { unstable_noStore as noStore } from "next/cache";
import { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import GarminDataClient from "@/components/GarminDataClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { mockGarminData } from "@/lib/trainingScore";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Adapt2Life — Données Garmin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GarminDataPage() {
  noStore();

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

  const data = await fetchGarminData(localUser.id, { gender: localUser.gender });

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">Garmin</p>
          <CardTitle>Données synchronisées</CardTitle>
          <CardDescription>Visualise les métriques clés envoyées par Garmin Connect.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <GarminDataClient
            initialData={
              data ?? {
                connection: null,
                sections: [],
                trainingGaugeData: mockGarminData(),
                usedRealtimeMetrics: false,
              }
            }
          />
        </CardContent>
      </Card>

    </div>
  );
}
