import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { db } from "@/db";
import { userGeneratedArtifacts, users } from "@/db/schema";
import { fetchGarminData } from "@/lib/garminData";
import { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import { AIScoreGraph } from "@/components/ui/ai-score-graph";
import { MarkdownPlan } from "@/components/MarkdownPlan";

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

const describeEnergyScore = (score: number) => {
  if (score >= 80) {
    return "Niveau optimal, prêt à performer ⚡";
  }
  if (score >= 60) {
    return "Énergie stable, adapte l’intensité 🔁";
  }
  return "Fatigue détectée, privilégie la récupération 🧘";
};

const TREND_DETAILS: Record<"up" | "stable" | "down", { label: string; tip: string }> = {
  up: { label: "En hausse", tip: "Ta récupération progresse, profites-en pour pousser un peu plus." },
  stable: { label: "Stable", tip: "Maintiens ton équilibre actuel et garde un œil sur tes sensations." },
  down: { label: "En baisse", tip: "Réduis la charge pour éviter le surmenage et focus récupération." },
};

const SCORE_SUMMARY = ["Sommeil profond", "Variabilité cardiaque", "Charge d’entraînement", "Niveau de stress"] as const;

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
  const energyInsight = heroScore !== null ? describeEnergyScore(heroScore) : null;

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
  ];

  if (user) {
    let latestPlanMarkdown: string | null = null;
    if (localUser) {
      const [latestPlan] = await db
        .select({
          trainingPlanMarkdown: userGeneratedArtifacts.trainingPlanMarkdown,
        })
        .from(userGeneratedArtifacts)
        .where(eq(userGeneratedArtifacts.userId, localUser.id))
        .limit(1);
      latestPlanMarkdown = latestPlan?.trainingPlanMarkdown ?? null;
    }

    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <section className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Dashboard</p>
          <h1 className="text-4xl font-heading">Bienvenue {firstName ?? "athlète"} 👋</h1>
          <p className="text-base text-muted-foreground">Visualise tes données clés et lance ta prochaine séance.</p>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {heroScore !== null && heroTrend !== null && energyInsight ? (
            <Card className="border-white/10 bg-card/80">
              <CardHeader className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Énergie du jour</p>
                <CardTitle>AI Energy Score</CardTitle>
                <CardDescription>Analyse issue de ta dernière synchronisation Garmin.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex justify-center md:flex-none">
                  <AIScoreGraph
                    score={heroScore}
                    label="AI Energy Score"
                    trend={heroTrend}
                    className="border-none bg-transparent p-0 shadow-none"
                    size={220}
                    thickness={18}
                  />
                </div>
                <div className="flex-1 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Statut</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{energyInsight}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Tendance</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{TREND_DETAILS[heroTrend].label}</p>
                      <p className="text-xs text-muted-foreground">{TREND_DETAILS[heroTrend].tip}</p>
                    </div>
                    <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                      Basé sur&nbsp;: {SCORE_SUMMARY.join(", ")}. 
                    </div>
                  </div>
                  <Link
                    href="/secure/garmin-data"
                    className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Voir les métriques détaillées →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accède aux sections clés de ton espace Adapt2Life.</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardGrid columns={{ sm: 1, md: 2, lg: 2 }} gap="sm">
                {quickActions.map((action) => (
                  <Card key={action.href} className="h-full border border-white/15 bg-white/5">
                    <CardHeader>
                      <CardTitle className="text-base">{action.title}</CardTitle>
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
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle>Dernier plan généré</CardTitle>
              <CardDescription>Visualise ta dernière séance fournie par le générateur IA.</CardDescription>
            </CardHeader>
            <CardContent>
              {latestPlanMarkdown ? (
                <MarkdownPlan content={latestPlanMarkdown} className="prose prose-invert max-w-none" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune séance générée pour le moment. Lance le générateur IA pour créer ton premier plan.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-160px)] items-center bg-background px-6 py-12 text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
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
