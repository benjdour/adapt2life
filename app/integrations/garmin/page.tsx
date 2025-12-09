import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardGrid } from "@/components/ui/dashboard-grid";

import { GarminIntegrationActions } from "./garmin-integration-actions";
import { DEFAULT_USER_PLAN, getUserPlanConfig } from "@/lib/constants/userPlans";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Intégration Garmin Connect — Adapt2Life",
  description:
    "Connectez Adapt2Life à Garmin pour envoyer automatiquement vos entraînements personnalisés, analyser Body Battery et éviter le surentraînement.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const normalizeSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export default async function GarminIntegrationPage({ searchParams }: PageProps) {
  noStore();

  const locale = await getRequestLocale();
  const signInPath = buildLocalePath(locale, "/handler/sign-in");
  const integrationPath = buildLocalePath(locale, "/integrations/garmin");

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect(`${signInPath}?redirect=${encodeURIComponent(integrationPath)}`);
  }

  const [existingUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  let localUser = existingUser;

  if (!localUser) {
    const inserted = await db
      .insert(users)
      .values({
        stackId: stackUser.id,
        name: stackUser.displayName ?? "Utilisateur Stack",
        email: stackUser.primaryEmail ?? `user-${stackUser.id}@example.com`,
        planType: DEFAULT_USER_PLAN,
        trainingGenerationsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).trainingQuota ?? 0,
        garminConversionsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).conversionQuota ?? 0,
      })
      .onConflictDoNothing({ target: users.stackId })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    localUser =
      inserted[0] ??
      (
        await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.stackId, stackUser.id))
          .limit(1)
      )[0];
  }

  const [connection] = await db
    .select({
      garminUserId: garminConnections.garminUserId,
      accessTokenExpiresAt: garminConnections.accessTokenExpiresAt,
      updatedAt: garminConnections.updatedAt,
    })
    .from(garminConnections)
    .where(eq(garminConnections.userId, localUser.id))
    .limit(1);

  const status = normalizeSearchParam(searchParams?.status);
  const reason = normalizeSearchParam(searchParams?.reason);
  const isConnected = Boolean(connection);

  const faqItems = [
    {
      question: "Puis-je envoyer un entraînement Adapt2Life directement dans Garmin ?",
      answer:
        "Oui. Chaque séance générée est convertie au format Garmin Training API et synchronisée dans ton calendrier en un clic.",
    },
    {
      question: "Comment Adapt2Life utilise Body Battery ou la VFC ?",
      answer:
        "Nous lisons Body Battery, VFC et la charge récente pour recommander des intensités cohérentes et éviter le surentraînement.",
    },
    {
      question: "Que faire si la connexion Garmin expire ?",
      answer:
        "Tu peux relancer l’autorisation depuis cette page. Nous t’avertissons aussi par email quand le token arrive à expiration.",
    },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">Intégrations</p>
          <CardTitle>Garmin Connect</CardTitle>
          <CardDescription>
            {isConnected
              ? "Ton compte Garmin est lié à Adapt2Life. Tu peux relier un autre compte ou te déconnecter à tout moment."
              : "Connecte ton compte Garmin afin de synchroniser automatiquement tes activités et métriques quotidiennes."}
          </CardDescription>
        </CardHeader>
      </Card>

      <DashboardGrid columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{isConnected ? "Connexion active" : "Connexion requise"}</CardTitle>
            <CardDescription>
              {isConnected
                ? "Adapt2Life collecte tes données Garmin en toute sécurité."
                : "Aucun compte Garmin lié. Clique sur le bouton pour démarrer."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
                Connecte-toi puis clique sur “Connecter Garmin” pour démarrer l’autorisation.
              </p>
            ) : null}

            <GarminIntegrationActions
              isConnected={isConnected}
              garminUserId={connection?.garminUserId ?? undefined}
              accessTokenExpiresAt={connection?.accessTokenExpiresAt?.toISOString()}
              status={status === "success" || status === "error" ? status : undefined}
              reason={typeof reason === "string" ? reason : undefined}
            />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Profil Adapt2Life</CardTitle>
            <CardDescription>Mise à jour automatique après chaque connexion Stack Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Utilisateur</p>
              <p className="text-lg font-semibold text-foreground">
                {localUser?.name ?? stackUser.displayName ?? "Profil sans nom"}
              </p>
              <p>{localUser?.email ?? stackUser.primaryEmail ?? "Email non renseigné"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Statut Adapt2Life</p>
              <p className="mt-1 text-sm text-foreground">
                {isConnected ? "Synchronisation active ✅" : "En attente de connexion Garmin"}
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardGrid>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Questions fréquentes</p>
          <h2 className="text-3xl font-heading text-foreground">Tout savoir sur l’intégration Garmin</h2>
        </header>
        <div className="space-y-3">
          {faqItems.map((faq) => (
            <details key={faq.question} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading text-foreground">
                {faq.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </section>
    </div>
  );
}
