import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import GarminDataClient from "@/components/GarminDataClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { mockGarminData } from "@/lib/trainingScore";
import { stackServerApp } from "@/stack/server";

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
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    redirect("/integrations/garmin");
  }

  const data = await fetchGarminData(localUser.id);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Garmin</p>
        <h1 className="text-3xl font-semibold">Données synchronisées</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Cette page présente les métriques clés envoyées par Garmin Connect via les webhooks Push.
        </p>
      </header>

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/integrations/garmin"
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Gérer l’intégration Garmin
        </Link>
      </div>
    </div>
  );
}

