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

  let trainingGaugeData = mockGarminData();
  if (user && localUser) {
    const garminData = await fetchGarminData(localUser.id);
    trainingGaugeData = garminData?.trainingGaugeData ?? trainingGaugeData;
  }

  let heroScore = Math.min(100, Math.max(0, computeTrainingScore(trainingGaugeData)));
  if (!user) {
    heroScore = 64;
  }
  const heroTrend = heroScore >= 80 ? "up" : heroScore >= 60 ? "stable" : "down";

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
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {authState === "unauthorized" ? (
          <Card className="border-error/40 bg-error/5 text-error">
            <CardContent className="py-4 text-sm">
              <p className="font-semibold">Accès refusé</p>
              <p className="text-error/80">Tu dois être connecté avec un compte autorisé pour accéder à cette page.</p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Image src="/brand/logo-main.png" alt="Adapt2Life" width={40} height={40} className="h-10 w-10 rounded-full" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Adapt2Life</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Bienvenue sur Adapt2Life</p>
                <h1 className="text-4xl font-heading">
                  {user ? `Bonjour ${firstName ?? "athlète"} 👋` : "Pilote ton énergie au quotidien"}
                </h1>
                <p className="text-base text-muted-foreground">
                  {user
                    ? "Accède à tes données Garmin, génère des plans IA et synchronise-les en un geste."
                    : "Connecte ton compte pour accéder à l’espace sécurisé Garmin et commencer tes plans adaptatifs."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <>
                    <Button asChild className="flex-1">
                      <Link href="/generateur-entrainement">Lancer le générateur IA</Link>
                    </Button>
                    <Button asChild variant="secondary" className="flex-1">
                      <Link href="/secure/garmin-data">Voir les données Garmin</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="flex-1">
                    <Link href="/handler/sign-in?redirect=/integrations/garmin">Se connecter / Créer un compte</Link>
                  </Button>
                )}
              </div>

              {user ? (
                <form action="/handler/sign-out" method="post" className="flex justify-start">
                  <input type="hidden" name="redirect" value="/" />
                  <Button type="submit" variant="ghost" className="text-sm text-muted-foreground">
                    Se déconnecter d’Adapt2Life
                  </Button>
                </form>
              ) : null}
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/30 p-6">
              <AIScoreGraph score={heroScore} label="AI Energy Score" trend={heroTrend} />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {user
                  ? "Score calculé à partir de ta dernière synchronisation Garmin."
                  : "Connecte ta montre pour obtenir ton score personnalisé."}
              </p>
            </div>
          </CardContent>
        </Card>

        <DashboardGrid columns={{ sm: 1, md: 2, lg: 2, xl: 4 }} gap="md">
          {quickActions.map((action) => (
            <Card key={action.href} className="h-full border-white/10 bg-card/90">
              <CardHeader>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href={action.href}>Accéder</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </DashboardGrid>
      </div>
    </main>
  );
}
