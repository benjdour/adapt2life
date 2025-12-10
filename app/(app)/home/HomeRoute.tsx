import Link from "next/link";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";

import { HomePage } from "@/app/(public)/home/HomePage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import { AIScoreGraph } from "@/components/ui/ai-score-graph";
import { MarkdownPlan } from "@/components/MarkdownPlan";
import { db } from "@/db";
import { userGeneratedArtifacts, users } from "@/db/schema";
import { getCachedGarminData } from "@/lib/cachedGarminData";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath } from "@/lib/i18n/routing";
import { computeTrainingScore, mockGarminData } from "@/lib/trainingScore";
import { stackServerApp } from "@/stack/server";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
};

type NextStepsCopy = {
  title: string;
  description: string;
  profileTitle: string;
  profileDescription: string;
  profileButton: string;
  garminTitle: string;
  garminDescription: string;
  garminButton: string;
};

type EnergyCopy = {
  tag: string;
  title: string;
  description: string;
  graphLabel: string;
  statusLabel: string;
  trendLabel: string;
  summaryIntro: string;
  summaryItems: string[];
  insights: {
    high: string;
    medium: string;
    low: string;
  };
  trends: Record<"up" | "stable" | "down", { label: string; tip: string }>;
};

type QuickActionsCopy = {
  title: string;
  description: string;
  defaultButtonLabel: string;
  actions: QuickAction[];
};

type LatestPlanCopy = {
  title: string;
  descriptionWithDate: string;
  descriptionFallback: string;
  emptyState: string;
};

type DashboardCopy = {
  tag: string;
  welcomeTitle: string;
  fallbackName: string;
  description: string;
};

type HomeRouteCopy = {
  dashboard: DashboardCopy;
  nextSteps: NextStepsCopy;
  energy: EnergyCopy;
  quickActions: QuickActionsCopy;
  latestPlan: LatestPlanCopy;
};

const HOME_ROUTE_COPY: Record<Locale, HomeRouteCopy> = {
  fr: {
    dashboard: {
      tag: "Dashboard",
      welcomeTitle: "Bienvenue {name} 👋",
      fallbackName: "athlète",
      description: "Visualise tes données clés et lance ta prochaine séance.",
    },
    nextSteps: {
      title: "Prochaines étapes",
      description: "Ces deux actions sont nécessaires pour personnaliser ton coaching et activer les synchronisations.",
      profileTitle: "Profil",
      profileDescription: "Renseigne ton profil pour que les recommandations soient adaptées.",
      profileButton: "Compléter mon profil",
      garminTitle: "Intégration Garmin",
      garminDescription: "Lie Adapt2Life à ton compte Garmin Connect pour synchroniser tes données.",
      garminButton: "Connexion à Garmin Connect",
    },
    energy: {
      tag: "Énergie du jour",
      title: "Energy Score",
      description: "Analyse issue de ta dernière synchronisation Garmin.",
      graphLabel: "Energy Score",
      statusLabel: "Statut",
      trendLabel: "Tendance",
      summaryIntro: "Basé sur :",
      summaryItems: ["Sommeil profond", "Variabilité cardiaque", "Charge d’entraînement", "Niveau de stress"],
      insights: {
        high: "Niveau optimal, prêt à performer ⚡",
        medium: "Énergie stable, adapte l’intensité 🔁",
        low: "Fatigue détectée, privilégie la récupération 🧘",
      },
      trends: {
        up: { label: "En hausse", tip: "Ta récupération progresse, profites-en pour pousser un peu plus." },
        stable: { label: "Stable", tip: "Maintiens ton équilibre actuel et garde un œil sur tes sensations." },
        down: { label: "En baisse", tip: "Réduis la charge pour éviter le surmenage et focus récupération." },
      },
    },
    quickActions: {
      title: "Actions rapides",
      description: "Accède aux sections clés de ton espace Adapt2Life.",
      defaultButtonLabel: "Ouvrir",
      actions: [
        {
          title: "Générateur d’entraînements personnalisés",
          description: "Crée ta séance sur mesure (course, vélo, triathlon, renfo) en 10 secondes.",
          href: "/generateur-entrainement",
          buttonLabel: "Lancer",
        },
        {
          title: "Plans basés sur ta récupération",
          description: "Analyse ton stress, ta récupération et évite le surentraînement.",
          href: "/secure/garmin-data",
          buttonLabel: "Voir les données",
        },
      ],
    },
    latestPlan: {
      title: "Dernier plan généré",
      descriptionWithDate: "Dernière génération le {date}.",
      descriptionFallback: "Visualise ta dernière séance fournie par le générateur IA.",
      emptyState: "Aucune séance générée pour le moment. Lance le générateur IA pour créer ton premier plan.",
    },
  },
  en: {
    dashboard: {
      tag: "Dashboard",
      welcomeTitle: "Welcome {name} 👋",
      fallbackName: "athlete",
      description: "View your key metrics and launch your next session.",
    },
    nextSteps: {
      title: "Next steps",
      description: "Complete these two actions to personalize coaching and enable syncs.",
      profileTitle: "Profile",
      profileDescription: "Fill in your profile so recommendations match your context.",
      profileButton: "Complete my profile",
      garminTitle: "Garmin integration",
      garminDescription: "Connect Adapt2Life to Garmin Connect to sync your data.",
      garminButton: "Link Garmin Connect",
    },
    energy: {
      tag: "Daily energy",
      title: "Energy Score",
      description: "Insights from your latest Garmin sync.",
      graphLabel: "Energy Score",
      statusLabel: "Status",
      trendLabel: "Trend",
      summaryIntro: "Based on:",
      summaryItems: ["Deep sleep", "Heart rate variability", "Training load", "Stress level"],
      insights: {
        high: "Optimal level, ready to perform ⚡",
        medium: "Stable energy, adjust intensity 🔁",
        low: "Fatigue detected, focus on recovery 🧘",
      },
      trends: {
        up: { label: "Trending up", tip: "Recovery improving—use it to push a bit more." },
        stable: { label: "Stable", tip: "Maintain your balance and listen to your sensations." },
        down: { label: "Trending down", tip: "Dial back the load to avoid overreaching and recover." },
      },
    },
    quickActions: {
      title: "Quick actions",
      description: "Jump to the key areas of your Adapt2Life space.",
      defaultButtonLabel: "Open",
      actions: [
        {
          title: "Personalized workout generator",
          description: "Create a custom session (run, bike, tri, strength) in 10 seconds.",
          href: "/generateur-entrainement",
          buttonLabel: "Launch",
        },
        {
          title: "Recovery-based plans",
          description: "Track stress, recovery, and avoid overtraining.",
          href: "/secure/garmin-data",
          buttonLabel: "View data",
        },
      ],
    },
    latestPlan: {
      title: "Latest generated plan",
      descriptionWithDate: "Last generated on {date}.",
      descriptionFallback: "Review the latest workout provided by the AI generator.",
      emptyState: "No workouts generated yet. Launch the AI generator to create your first plan.",
    },
  },
};

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

const describeEnergyScore = (score: number, energyCopy: EnergyCopy) => {
  if (score >= 80) {
    return energyCopy.insights.high;
  }
  if (score >= 60) {
    return energyCopy.insights.medium;
  }
  return energyCopy.insights.low;
};

const hasTextValue = (value: string | null | undefined) => typeof value === "string" && value.trim().length > 0;
const hasPositiveNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
  }
  return false;
};

type HomeRouteProps = {
  locale: Locale;
};

export async function HomeRoute({ locale }: HomeRouteProps) {
  noStore();

  const copy = HOME_ROUTE_COPY[locale] ?? HOME_ROUTE_COPY.fr;
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });
  let firstName = extractFirstName(user);
  let localUser:
    | {
        id: number;
        firstName: string | null;
        lastName: string | null;
        name: string | null;
        pseudo: string | null;
        gender: string | null;
        birthDate: string | null;
        sportLevel: number | null;
        heightCm: number | null;
        weightKg: string | number | null;
        trainingGoal: string | null;
      }
    | undefined;

  if (user) {
    const [profile] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        name: users.name,
        pseudo: users.pseudo,
        gender: users.gender,
        lastName: users.lastName,
        birthDate: users.birthDate,
        sportLevel: users.sportLevel,
        heightCm: users.heightCm,
        weightKg: users.weightKg,
        trainingGoal: users.trainingGoal,
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

  const isProfileComplete = Boolean(
    localUser &&
      hasTextValue(localUser.firstName) &&
      hasTextValue(localUser.lastName) &&
      hasTextValue(localUser.gender) &&
      hasTextValue(localUser.birthDate) &&
      typeof localUser.sportLevel === "number" &&
      hasPositiveNumber(localUser.heightCm) &&
      hasPositiveNumber(localUser.weightKg) &&
      hasTextValue(localUser.trainingGoal),
  );

  let garminData: Awaited<ReturnType<typeof getCachedGarminData>> | null = null;
  let heroScore: number | null = null;
  let heroTrend: "up" | "down" | "stable" | null = null;
  if (user && localUser) {
    garminData = await getCachedGarminData(localUser.id, { gender: localUser.gender });
    const trainingGaugeData = garminData?.trainingGaugeData ?? mockGarminData();
    heroScore = Math.min(100, Math.max(0, computeTrainingScore(trainingGaugeData)));
    heroTrend = heroScore >= 80 ? "up" : heroScore >= 60 ? "stable" : "down";
  }
  const hasGarminConnection = Boolean(garminData?.connection);
  const energyCardLocked = !isProfileComplete || !hasGarminConnection;
  const energyInsight =
    !energyCardLocked && heroScore !== null ? describeEnergyScore(heroScore, copy.energy) : null;
  const canDisplayEnergyData = !energyCardLocked && heroScore !== null && heroTrend !== null && energyInsight !== null;

  const quickActions = copy.quickActions.actions;
  const localizeAppHref = (href: string) => buildLocalePath(locale, href);

  if (user) {
    let latestPlanMarkdown: string | null = null;
    let latestPlanGeneratedAtLabel: string | null = null;
    if (localUser) {
      const [latestPlan] = await db
        .select({
          trainingPlanMarkdown: userGeneratedArtifacts.trainingPlanMarkdown,
          updatedAt: userGeneratedArtifacts.updatedAt,
        })
        .from(userGeneratedArtifacts)
        .where(eq(userGeneratedArtifacts.userId, localUser.id))
        .limit(1);
      latestPlanMarkdown = latestPlan?.trainingPlanMarkdown ?? null;
      if (latestPlan?.updatedAt) {
        latestPlanGeneratedAtLabel = new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "long",
        }).format(latestPlan.updatedAt);
      }
    }

    return (
      <main className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-primary/80">{copy.dashboard.tag}</p>
            <CardTitle>
              {copy.dashboard.welcomeTitle.replace("{name}", firstName ?? copy.dashboard.fallbackName)}
            </CardTitle>
            <CardDescription>{copy.dashboard.description}</CardDescription>
          </CardHeader>
        </Card>

        {(!isProfileComplete || !hasGarminConnection) ? (
          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle>{copy.nextSteps.title}</CardTitle>
              <CardDescription>{copy.nextSteps.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardGrid columns={{ sm: 1, md: 2 }} gap="sm">
                {!isProfileComplete ? (
                  <Card className="h-full border border-white/15 bg-white/5">
                    <CardHeader>
                      <CardTitle className="text-base">{copy.nextSteps.profileTitle}</CardTitle>
                      <CardDescription>{copy.nextSteps.profileDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full justify-center">
                        <Link href={localizeAppHref("/secure/user-information")}>{copy.nextSteps.profileButton}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
                {!hasGarminConnection ? (
                  <Card className="h-full border border-white/15 bg-white/5">
                    <CardHeader>
                      <CardTitle className="text-base">{copy.nextSteps.garminTitle}</CardTitle>
                      <CardDescription>{copy.nextSteps.garminDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full justify-center">
                        <Link href={localizeAppHref("/integrations/garmin")}>{copy.nextSteps.garminButton}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </DashboardGrid>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-6">
          {canDisplayEnergyData ? (
            <Card className="border-white/10 bg-card/80">
              <CardHeader className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-primary/80">{copy.energy.tag}</p>
                <CardTitle>{copy.energy.title}</CardTitle>
                <CardDescription>{copy.energy.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                {(() => {
                  const score = heroScore as number;
                  const trend = heroTrend as "up" | "down" | "stable";
                  const insight = energyInsight as string;
                  return (
                    <>
                      <div className="flex justify-center md:flex-none">
                        <AIScoreGraph
                          score={score}
                          label={copy.energy.graphLabel}
                          trend={trend}
                          className="border-none bg-transparent p-0 shadow-none"
                          size={220}
                          thickness={18}
                        />
                      </div>
                      <div className="flex-1 space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.energy.statusLabel}</p>
                            <p className="mt-2 text-lg font-semibold text-foreground">{insight}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{copy.energy.trendLabel}</p>
                            <p className="mt-2 text-lg font-semibold text-foreground">{copy.energy.trends[trend].label}</p>
                            <p className="text-xs text-muted-foreground">{copy.energy.trends[trend].tip}</p>
                          </div>
                          <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                            {copy.energy.summaryIntro}&nbsp;{copy.energy.summaryItems.join(", ")}.
                          </div>
                        </div>
                        <div />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ) : null}

          {isProfileComplete && hasGarminConnection ? (
            <Card className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{copy.quickActions.title}</CardTitle>
                <CardDescription>{copy.quickActions.description}</CardDescription>
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
                        <Button asChild className="w-full justify-center">
                          <Link href={localizeAppHref(action.href)}>
                            {action.buttonLabel ?? copy.quickActions.defaultButtonLabel}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </DashboardGrid>
              </CardContent>
            </Card>
          ) : null}
        </section>

        {isProfileComplete && hasGarminConnection ? (
          <Card className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle>{copy.latestPlan.title}</CardTitle>
              <CardDescription>
                {latestPlanGeneratedAtLabel
                  ? copy.latestPlan.descriptionWithDate.replace("{date}", latestPlanGeneratedAtLabel)
                  : copy.latestPlan.descriptionFallback}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestPlanMarkdown ? (
                <MarkdownPlan content={latestPlanMarkdown} className="prose prose-invert max-w-none" />
              ) : (
                <p className="text-sm text-muted-foreground">{copy.latestPlan.emptyState}</p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    );
  }

  return <HomePage locale={locale} />;
}
