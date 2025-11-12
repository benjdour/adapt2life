import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import { AIScoreGraph } from "@/components/ui/ai-score-graph";

const normalizeFirstName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const [firstSegment] = trimmed.split(/\s+/);
  if (!firstSegment) {
    return null;
  }
  const [initial, ...rest] = firstSegment;
  if (!initial) {
    return null;
  }
  return `${initial.toLocaleUpperCase("fr-FR")}${rest.join("")}`;
};

const extractFirstName = (user: unknown, fallback?: string | null): string | null => {
  if (!user || typeof user !== "object") {
    return normalizeFirstName(fallback);
  }

  const record = user as Record<string, unknown>;
  const candidates: Array<unknown> = [
    record["firstName"],
    record["first_name"],
    record["givenName"],
    record["given_name"],
    record["name"],
    record["displayName"],
  ];

  const profileRaw = record["profile"];

  if (profileRaw && typeof profileRaw === "object") {
    const profile = profileRaw as Record<string, unknown>;
    candidates.push(profile["firstName"], profile["first_name"], profile["givenName"], profile["given_name"]);

    const profileName = profile["name"];
    if (profileName && typeof profileName === "object") {
      const nameRecord = profileName as Record<string, unknown>;
      const keys = ["givenName", "given_name", "firstName", "first_name", "given", "first"];
      for (const key of keys) {
        candidates.push(nameRecord[key]);
      }
    }
  }

  if (fallback) {
    candidates.push(fallback);
  }

  for (const candidate of candidates) {
    const normalized = normalizeFirstName(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const readParam = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export default async function Home({ searchParams }: HomePageProps) {
  noStore();

  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });
  let firstName = extractFirstName(user);
  let localUser:
    | { id: number; firstName: string | null; name: string | null; pseudo: string | null }
    | undefined;

  if (user) {
    const [profile] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        name: users.name,
        pseudo: users.pseudo,
      })
      .from(users)
      .where(eq(users.stackId, user.id))
      .limit(1);
    localUser = profile;

    if (!firstName && profile) {
      firstName =
        extractFirstName(
          {
            firstName: profile.firstName ?? undefined,
            name: profile.name ?? undefined,
            displayName: profile.pseudo ?? undefined,
          },
          profile.firstName ?? profile.name ?? profile.pseudo ?? null,
        ) ?? normalizeFirstName(profile.firstName ?? profile.name ?? profile.pseudo);
    }
  }

  const authState = readParam(searchParams?.auth);

  let heroScore: number | null = null;
  let heroTrend: "up" | "down" | "stable" | null = null;
  if (user && localUser) {
    const garminData = await fetchGarminData(localUser.id);
    const trainingGaugeData = garminData?.trainingGaugeData ?? mockGarminData();
    heroScore = Math.min(100, Math.max(0, computeTrainingScore(trainingGaugeData)));
    heroTrend = heroScore >= 80 ? "up" : heroScore >= 60 ? "stable" : "down";
  }

  const quickActions = [
    {
      title: "Générateur IA",
      description: "Crée ta séance personnalisée en quelques secondes.",
      href: "/generateur-entrainement",
    },
    {
      title: "Données Garmin",
      description: "Visualise tes métriques synchronisées.",
      href: "/secure/garmin-data",
    },
    {
      title: "Profil Adapt2Life",
      description: "Mets à jour tes informations et objectifs.",
      href: "/secure/user-information",
    },
    {
      title: "Intégration Garmin",
      description: "Connecte ou gère ton compte Garmin.",
      href: "/integrations/garmin",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-center">
        <div className="space-y-6 md:w-1/2">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Ton coach IA</p>
          <h1 className="text-4xl font-heading md:text-5xl">Qui s’adapte à ta vie.</h1>
          <p className="text-base text-muted-foreground">
            Des séances personnalisées, générées en temps réel selon ta forme, tes objectifs et tes contraintes quotidiennes.
          </p>
          <Button asChild className="px-8 py-6 text-base font-semibold">
            <Link href="/handler/sign-in?redirect=/generateur-entrainement">Découvrir ton potentiel</Link>
          </Button>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/brand/main-visual.jpg"
            alt="Adapt2Life hero"
            width={800}
            height={600}
            priority
            className="rounded-3xl border border-white/10 object-cover shadow-2xl"
          />
        </div>
      </section>
    </main>
  );
}
