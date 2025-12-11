import { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import GarminDataClient, { GarminDataClientCopy } from "@/components/GarminDataClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCachedGarminData } from "@/lib/cachedGarminData";
import { mockGarminData } from "@/lib/trainingScore";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasStackSessionCookie } from "@/lib/stack/sessionCookies";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath, buildSignInUrl } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

type GarminDataPageCopy = {
  metadataTitle: string;
  headerTag: string;
  headerTitle: string;
  headerDescription: string;
  client: GarminDataClientCopy;
};

const copyByLocale: Record<Locale, GarminDataPageCopy> = {
  fr: {
    metadataTitle: "Adapt2Life — Données Garmin",
    headerTag: "Garmin",
    headerTitle: "Données synchronisées",
    headerDescription: "Visualise les métriques clés envoyées par Garmin Connect.",
    client: {
      waitingSyncLabel: "En attente de synchro",
      activityCarousel: {
        counterLabel: "Activité {current} / {total}",
        fallbackType: "Activité",
        fallbackDate: "Date inconnue",
        previousAria: "Activité précédente",
        nextAria: "Activité suivante",
        stats: {
          duration: "Durée",
          intensity: "Intensité",
          heartRate: "FC moyenne",
          power: "Puissance",
          cadence: "Cadence",
          calories: "Calories",
        },
      },
      toasts: {
        errorTitle: "Impossible d’actualiser les données Garmin.",
        errorDescription: "Dernière synchronisation indisponible. Vérifie ta connexion ou réessaie plus tard.",
        successTitle: "Données Garmin mises à jour",
        successDescription: "La connexion est rétablie, les dernières mesures sont affichées.",
      },
      noConnection: {
        title: "Aucune connexion Garmin",
        description: "Relie ton compte via la page d’intégration pour voir tes données apparaître ici.",
      },
      firstSync: {
        title: "Première synchronisation en attente",
        description: "Dès que Garmin enverra tes premières données, elles apparaîtront automatiquement ici.",
      },
    },
  },
  en: {
    metadataTitle: "Adapt2Life — Garmin data",
    headerTag: "Garmin",
    headerTitle: "Synced data",
    headerDescription: "Review the key metrics sent by Garmin Connect.",
    client: {
      waitingSyncLabel: "Waiting for sync",
      activityCarousel: {
        counterLabel: "Activity {current} / {total}",
        fallbackType: "Activity",
        fallbackDate: "Unknown date",
        previousAria: "Previous activity",
        nextAria: "Next activity",
        stats: {
          duration: "Duration",
          intensity: "Intensity",
          heartRate: "Avg HR",
          power: "Power",
          cadence: "Cadence",
          calories: "Calories",
        },
      },
      toasts: {
        errorTitle: "Unable to refresh Garmin data.",
        errorDescription: "Latest sync unavailable. Check your connection or try again later.",
        successTitle: "Garmin data updated",
        successDescription: "Connection restored, latest measurements are now visible.",
      },
      noConnection: {
        title: "No Garmin connection",
        description: "Connect your account from the integration page to start seeing your metrics here.",
      },
      firstSync: {
        title: "Awaiting first sync",
        description: "As soon as Garmin sends your first payload, it will appear automatically.",
      },
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  return {
    title: copy.metadataTitle,
  };
}

type GarminDataPanelProps = {
  localUserId: number;
  gender: string | null;
  locale: Locale;
  copy: GarminDataClientCopy;
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

async function GarminDataPanel({ localUserId, gender, locale, copy }: GarminDataPanelProps) {
  const data =
    (await getCachedGarminData(localUserId, { gender, locale })) ??
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
        <GarminDataClient initialData={data} copy={copy} locale={locale} />
      </CardContent>
    </Card>
  );
}

export default async function GarminDataPage() {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  if (!(await hasStackSessionCookie())) {
    redirect(buildSignInUrl(locale, "/secure/garmin-data"));
  }

  const stackUserPromise = stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  const stackUser = await stackUserPromise;

  if (!stackUser) {
    redirect(buildSignInUrl(locale, "/secure/garmin-data"));
  }

  const [localUser] = await db
    .select({ id: users.id, gender: users.gender })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    redirect(buildLocalePath(locale, "/integrations/garmin"));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">{copy.headerTag}</p>
          <CardTitle>{copy.headerTitle}</CardTitle>
          <CardDescription>{copy.headerDescription}</CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<GarminDataSkeleton />}>
        <GarminDataPanel
          localUserId={localUser.id}
          gender={localUser.gender}
          locale={locale}
          copy={copy.client}
        />
      </Suspense>
    </div>
  );
}
