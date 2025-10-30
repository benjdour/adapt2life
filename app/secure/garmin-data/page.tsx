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

  const latestSummary = dailySummaries[0] ?? null;

  const sections: Array<{
    title: string;
    description?: string;
    items: Array<{ label: string; value: string | null; hint?: string }>;
  }> = [
    {
      title: "🧠 Récupération & énergie",
      description: "Basé sur les résumés quotidiens, sommeil et HRV (Health API — Daily, Sleep, HRV summaries).",
      items: [
        { label: "Body Battery (actuel / chargé / dépensé / tendance 24h)", value: null, hint: "En attente des champs Body Battery dans Daily ou Stress summaries (docs/Garmin_Health_API_1.2.2.md)." },
        {
          label: "Sommeil — durée totale",
          value: latestSummary?.sleepSeconds ? `${(latestSummary.sleepSeconds / 3600).toFixed(1)} h` : null,
          hint: "Synchronisation des Sleep summaries nécessaire pour les phases & score détaillés.",
        },
        { label: "Sommeil — score & phases", value: null, hint: "Prévu via Sleep summaries (light/deep/REM) — docs/Garmin_Health_API_1.2.2.md §7.3." },
        { label: "HRV (moyenne / min / max, 24h)", value: null, hint: "À récupérer via HRV summaries (docs/Garmin_Health_API_1.2.2.md §7.10)." },
        { label: "Fréquence cardiaque au repos", value: null, hint: "Disponible dans User Metrics summaries." },
        { label: "Niveau d’énergie global", value: null, hint: "Calcul à définir à partir de Body Battery + Sommeil." },
      ],
    },
    {
      title: "💪 Charge d’entraînement",
      description: "Données issues de l’Activity API et des Training Status endpoints.",
      items: [
        { label: "Training Load (7 jours)", value: null, hint: "Activity summaries / Training Status requis (docs/Activity_API-1.2.3_0.md)." },
        { label: "Training Effect (aérobie / anaérobie)", value: null, hint: "Présent dans Activity Details summaries." },
        { label: "VO₂ Max estimé", value: null, hint: "Disponible via User Metrics summaries." },
        { label: "Temps de récupération recommandé", value: null, hint: "À extraire des Activity Details (Recovery Time)." },
        { label: "Statut d’entraînement", value: null, hint: "Training Status API (docs/Activity_API-1.2.3_0.md)." },
        { label: "Training Readiness", value: null, hint: "Selon disponibilité Garmin (Health API — User Metrics/Readiness)." },
      ],
    },
    {
      title: "⚡ Stress & système nerveux",
      description: "Utilise Stress Details summaries et HRV.",
      items: [
        {
          label: "Stress moyen de la journée",
          value: latestSummary?.stressLevel !== null && latestSummary?.stressLevel !== undefined ? `${latestSummary.stressLevel}` : null,
          hint: "Valeur issue du Daily summary (max/avg/min). Pour plus de détails, utiliser Stress Details summaries.",
        },
        { label: "Temps en stress faible / moyen / élevé", value: null, hint: "Disponible via Stress Details summaries (timeOffsetStressLevelValues)." },
        { label: "Stress maximal", value: null, hint: "À extraire via Stress Details." },
        { label: "HRV (corrélé au stress)", value: null, hint: "Voir HRV summaries." },
        { label: "Minutes de relaxation / respiration", value: null, hint: "Notifications spécifiques Garmin (Relax notifications)." },
      ],
    },
    {
      title: "🚶‍♂️ Activité générale",
      description: "Basé sur Daily summaries & Activity API.",
      items: [
        {
          label: "Nombre total de pas",
          value: latestSummary?.steps !== null && latestSummary?.steps !== undefined ? latestSummary.steps.toLocaleString("fr-FR") : null,
          hint: "Disponible — Daily summaries (steps).",
        },
        { label: "Minutes actives", value: null, hint: "Requiert Daily summaries (activeTimeInSeconds) ou Activity summaries." },
        { label: "Temps sédentaire", value: null, hint: "Disponible via Daily summaries (sedentaryTimeInSeconds)." },
        {
          label: "Calories totales brûlées",
          value: latestSummary?.calories !== null && latestSummary?.calories !== undefined ? `${latestSummary.calories} kcal` : null,
          hint: "Disponible — Daily summaries (totalKilocalories).",
        },
        { label: "Temps actif cumulé", value: null, hint: "À lire dans Daily summaries (activeTimeInSeconds)." },
      ],
    },
    {
      title: "🩸 Indicateurs physiologiques avancés",
      description: "Nécessite Health API (Pulse Ox, Skin Temp, Body Composition).",
      items: [
        { label: "SpO₂ moyen", value: null, hint: "Pulse Ox summaries (docs/Garmin_Health_API_1.2.2.md §7.8)." },
        { label: "Température corporelle moyenne / variation", value: null, hint: "Skin Temperature summaries (§7.12)." },
        { label: "Poids corporel", value: null, hint: "Body Composition summaries (§7.4)." },
        { label: "Composition corporelle (masse grasse, musculaire, hydratation)", value: null, hint: "Body Composition summaries." },
        { label: "Fréquence cardiaque moyenne (24h)", value: null, hint: "Daily summaries (averageHeartRate) ou HRV summaries." },
        { label: "Respiration moyenne (brpm)", value: null, hint: "Respiration summaries (§7.8)." },
      ],
    },
    {
      title: "🕒 Métadonnées d’activité",
      description: "Requiert Activity API (summaries & details).",
      items: [
        { label: "Dernière activité — date & heure", value: null, hint: "Activity summaries (§7.1 Activity API)." },
        { label: "Type d’activité", value: null, hint: "Activity summaries (activityType)." },
        { label: "Durée & intensité (HR moyenne, puissance, cadence)", value: null, hint: "Activity Details (docs/Activity_API-1.2.3_0.md)." },
        { label: "Calories de la dernière activité", value: null, hint: "Activity summaries (activeKilocalories)." },
        { label: "Score d’effort de la dernière activité", value: null, hint: "Activity summaries / Training Effect." },
      ],
    },
  ];

  const renderMetricValue = (value: string | null, hint?: string) => {
    if (value) {
      return <span className="text-base font-semibold text-white">{value}</span>;
    }

    return (
      <span className="text-sm text-yellow-200">
        En attente de synchro
        {hint ? (
          <>
            {" "}
            <span className="block text-xs text-yellow-200/80">{hint}</span>
          </>
        ) : null}
      </span>
    );
  };

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
            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">Sources Garmin Health API</p>
              <p className="text-emerald-100/80">
                Les métriques suivantes s’appuient sur les endpoints documentés dans <code>docs/Garmin_Health_API_1.2.2.md</code> et{" "}
                <code>docs/Activity_API-1.2.3_0.md</code>. Les valeurs non encore synchronisées affichent l’endpoint requis.
              </p>
            </div>
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

      {connection ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
              <header className="mb-4 space-y-1">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                {section.description ? <p className="text-sm text-white/70">{section.description}</p> : null}
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">{item.label}</p>
                    <div className="mt-2">{renderMetricValue(item.value, item.hint)}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {dailySummaries.length > 0 ? (
            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <header>
                <h2 className="text-xl font-semibold text-white">Historique brut (Daily summaries)</h2>
                <p className="text-sm text-white/70">Dernières entrées reçues pour contrôle et debug.</p>
              </header>
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
            </section>
          ) : (
            <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-sm text-yellow-100">
              <p className="font-semibold">Aucune donnée quotidienne reçue</p>
              <p className="text-yellow-100/80">
                Dès que Garmin enverra les événements &laquo;&nbsp;Dailies&nbsp;&raquo;, ils seront affichés ici. Assure-toi que l’endpoint
                Push est bien activé via l’Endpoint Configuration Tool.
              </p>
            </section>
          )}
        </div>
      ) : null}

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
