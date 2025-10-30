import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminConnections, garminDailySummaries, users } from "@/db/schema";
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
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    redirect("/integrations/garmin");
  }

  const [connection] = await db
    .select({
      garminUserId: garminConnections.garminUserId,
      updatedAt: garminConnections.updatedAt,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
    })
    .from(garminConnections)
    .where(eq(garminConnections.userId, localUser.id))
    .limit(1);

  const dailySummaries = await db
    .select({
      id: garminDailySummaries.id,
      calendarDate: garminDailySummaries.calendarDate,
      steps: garminDailySummaries.steps,
      distanceMeters: garminDailySummaries.distanceMeters,
      calories: garminDailySummaries.calories,
      stressLevel: garminDailySummaries.stressLevel,
      sleepSeconds: garminDailySummaries.sleepSeconds,
      createdAt: garminDailySummaries.createdAt,
    })
    .from(garminDailySummaries)
    .where(eq(garminDailySummaries.userId, localUser.id))
    .orderBy(desc(garminDailySummaries.createdAt))
    .limit(30);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Garmin</p>
        <h1 className="text-3xl font-semibold">Données synchronisées</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Cette page affichera prochainement les activités et métriques remontées depuis Garmin Connect.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        {connection ? (
          <>
            <div>
              <p className="text-sm font-medium text-white/90">Garmin userId</p>
              <p className="font-mono text-base text-emerald-200">{connection.garminUserId}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Dernière mise à jour :{" "}
                <strong className="text-white">{connection.updatedAt?.toLocaleString() ?? "—"}</strong>
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Token valide jusqu&apos;au :{" "}
                <strong className="text-white">{connection.accessTokenExpiresAt?.toLocaleString() ?? "—"}</strong>
              </span>
            </div>
            {dailySummaries.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Pas</th>
                      <th className="px-4 py-3">Distance (m)</th>
                      <th className="px-4 py-3">Calories</th>
                      <th className="px-4 py-3">Stress</th>
                      <th className="px-4 py-3">Sommeil (h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    {dailySummaries.map((summary) => (
                      <tr key={summary.id} className="bg-white/5 hover:bg-white/10">
                        <td className="px-4 py-3 font-medium text-white">{summary.calendarDate}</td>
                        <td className="px-4 py-3">{summary.steps ?? "—"}</td>
                        <td className="px-4 py-3">{summary.distanceMeters ?? "—"}</td>
                        <td className="px-4 py-3">{summary.calories ?? "—"}</td>
                        <td className="px-4 py-3">{summary.stressLevel ?? "—"}</td>
                        <td className="px-4 py-3">
                          {summary.sleepSeconds ? (summary.sleepSeconds / 3600).toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                <p className="font-semibold">Aucune donnée quotidienne reçue</p>
                <p className="text-yellow-100/80">
                  Dès que Garmin enverra les événements &laquo;&nbsp;Dailies&nbsp;&raquo;, ils seront affichés ici.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Aucune connexion Garmin</p>
            <p className="text-sm text-white/70">
              Relie ton compte via la page d’intégration pour voir les données apparaître ici.
            </p>
          </div>
        )}
      </section>

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
