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
import { Locale } from "@/lib/i18n/locales";

type ActionStatusMessage = {
  title: string;
  description?: string;
};

type IntegrationCopy = {
  metadataTitle: string;
  metadataDescription: string;
  headerTag: string;
  headerTitle: string;
  headerDescription: {
    connected: string;
    disconnected: string;
  };
  connectionCard: {
    connectedTitle: string;
    disconnectedTitle: string;
    connectedDescription: string;
    disconnectedDescription: string;
    noteWhenDisconnected: string;
  };
  profileCard: {
    title: string;
    description: string;
    userLabel: string;
    defaultName: string;
    defaultEmail: string;
    statusLabel: string;
    statusConnected: string;
    statusDisconnected: string;
  };
  faq: {
    label: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  actions: {
    connectLabel: string;
    reconnectLabel: string;
    disconnectLabel: string;
    alreadyConnectedToast: string;
    reassignToast: string;
    successToast: string;
    disconnectSuccess: string;
    disconnectError: string;
    genericError: string;
    maskedUserLabel: string;
    tokenValidUntil: (formattedDate: string) => string;
    statusMessages: Record<string, ActionStatusMessage>;
  };
};

const copyByLocale: Record<Locale, IntegrationCopy> = {
  fr: {
    metadataTitle: "Intégration Garmin Connect — Adapt2Life",
    metadataDescription:
      "Connectez Adapt2Life à Garmin pour envoyer automatiquement vos entraînements personnalisés, analyser Body Battery et éviter le surentraînement.",
    headerTag: "Intégrations",
    headerTitle: "Garmin Connect",
    headerDescription: {
      connected: "Ton compte Garmin est lié à Adapt2Life. Tu peux relier un autre compte ou te déconnecter à tout moment.",
      disconnected: "Connecte ton compte Garmin afin de synchroniser automatiquement tes activités et métriques quotidiennes.",
    },
    connectionCard: {
      connectedTitle: "Connexion active",
      disconnectedTitle: "Connexion requise",
      connectedDescription: "Adapt2Life collecte tes données Garmin en toute sécurité.",
      disconnectedDescription: "Aucun compte Garmin lié. Clique sur le bouton pour démarrer.",
      noteWhenDisconnected: "Connecte-toi puis clique sur “Connecter Garmin” pour démarrer l’autorisation.",
    },
    profileCard: {
      title: "Profil Adapt2Life",
      description: "Mise à jour automatique après chaque connexion Stack Auth.",
      userLabel: "Utilisateur",
      defaultName: "Profil sans nom",
      defaultEmail: "Email non renseigné",
      statusLabel: "Statut Adapt2Life",
      statusConnected: "Synchronisation active ✅",
      statusDisconnected: "En attente de connexion Garmin",
    },
    faq: {
      label: "Questions fréquentes",
      title: "Tout savoir sur l’intégration Garmin",
      items: [
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
      ],
    },
    actions: {
      connectLabel: "Connecter Garmin",
      reconnectLabel: "Reconnecter Garmin",
      disconnectLabel: "Déconnecter Garmin",
      alreadyConnectedToast: "Garmin déjà connecté.",
      reassignToast: "Garmin relié à ce compte.",
      successToast: "Garmin connecté !",
      disconnectSuccess: "Garmin déconnecté.",
      disconnectError: "Impossible de se déconnecter de Garmin.",
      genericError: "Connexion Garmin échouée.",
      maskedUserLabel: "userId :",
      tokenValidUntil: (value) => `Token valide jusqu'au : ${value}`,
      statusMessages: {
        authorization_declined: {
          title: "Connexion annulée.",
          description: "Vous avez refusé l'accès dans Garmin Connect.",
        },
        missing_parameters: {
          title: "Réponse invalide.",
          description: "Certains paramètres de retour sont manquants.",
        },
        invalid_session: {
          title: "Session expirée.",
          description: "Relancez la connexion depuis Adapt2Life.",
        },
        invalid_state: {
          title: "Protection anti-CSRF invalide.",
          description: "Relancez la connexion pour générer un nouvel état sécurisé.",
        },
        unauthorized: {
          title: "Session utilisateur absente.",
          description: "Reconnectez-vous à Adapt2Life avant d'autoriser Garmin.",
        },
        user_not_found: {
          title: "Profil Adapt2Life introuvable.",
        },
        already_linked: {
          title: "Compte Garmin déjà lié.",
          description: "Ce compte Garmin est déjà associé à un autre utilisateur.",
        },
        oauth_failed: {
          title: "Erreur OAuth Garmin.",
          description: "Impossible d'échanger le code contre des tokens.",
        },
        unexpected_error: {
          title: "Erreur inattendue.",
          description: "Merci de réessayer ou de contacter le support.",
        },
      },
    },
  },
  en: {
    metadataTitle: "Garmin Connect Integration — Adapt2Life",
    metadataDescription:
      "Link Adapt2Life with Garmin to auto-sync personalized workouts, read Body Battery and avoid overtraining.",
    headerTag: "Integrations",
    headerTitle: "Garmin Connect",
    headerDescription: {
      connected: "Your Garmin account is linked to Adapt2Life. You can link another account or disconnect any time.",
      disconnected: "Connect Garmin to sync your activities and daily metrics automatically.",
    },
    connectionCard: {
      connectedTitle: "Active connection",
      disconnectedTitle: "Connection required",
      connectedDescription: "Adapt2Life securely ingests your Garmin data.",
      disconnectedDescription: "No Garmin account linked yet. Use the button to start.",
      noteWhenDisconnected: "Sign in, then click “Connect Garmin” to begin authorization.",
    },
    profileCard: {
      title: "Adapt2Life profile",
      description: "Automatically refreshed after every Stack Auth login.",
      userLabel: "User",
      defaultName: "No profile name",
      defaultEmail: "Email unavailable",
      statusLabel: "Adapt2Life status",
      statusConnected: "Active sync ✅",
      statusDisconnected: "Awaiting Garmin connection",
    },
    faq: {
      label: "FAQ",
      title: "Inside the Garmin integration",
      items: [
        {
          question: "Can I push an Adapt2Life workout directly into Garmin?",
          answer:
            "Yes. Every generated session is converted to the Garmin Training API format and synced to your calendar in one click.",
        },
        {
          question: "How does Adapt2Life use Body Battery or HRV?",
          answer:
            "We read Body Battery, HRV and recent load to recommend smart intensities and keep you away from overtraining.",
        },
        {
          question: "What if the Garmin connection expires?",
          answer:
            "You can restart the authorization from this page. We also email you when the token is about to expire.",
        },
      ],
    },
    actions: {
      connectLabel: "Connect Garmin",
      reconnectLabel: "Reconnect Garmin",
      disconnectLabel: "Disconnect Garmin",
      alreadyConnectedToast: "Garmin already connected.",
      reassignToast: "Garmin linked to this account.",
      successToast: "Garmin connected!",
      disconnectSuccess: "Garmin disconnected.",
      disconnectError: "Unable to disconnect Garmin.",
      genericError: "Garmin connection failed.",
      maskedUserLabel: "userId:",
      tokenValidUntil: (value) => `Token valid until: ${value}`,
      statusMessages: {
        authorization_declined: {
          title: "Authorization canceled.",
          description: "You denied access inside Garmin Connect.",
        },
        missing_parameters: {
          title: "Invalid response.",
          description: "Some callback parameters are missing.",
        },
        invalid_session: {
          title: "Session expired.",
          description: "Restart the connection from Adapt2Life.",
        },
        invalid_state: {
          title: "Invalid anti-CSRF token.",
          description: "Start the connection again to generate a secure state.",
        },
        unauthorized: {
          title: "No user session.",
          description: "Sign back into Adapt2Life before authorizing Garmin.",
        },
        user_not_found: {
          title: "Adapt2Life profile not found.",
        },
        already_linked: {
          title: "Garmin account already linked.",
          description: "This Garmin user is already associated with another profile.",
        },
        oauth_failed: {
          title: "Garmin OAuth error.",
          description: "Could not exchange the code for tokens.",
        },
        unexpected_error: {
          title: "Unexpected error.",
          description: "Please retry or contact support.",
        },
      },
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

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
  const copy = copyByLocale[locale];
  const signInPath = "/handler/sign-in";
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

  const faqItems = copy.faq.items;

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">{copy.headerTag}</p>
          <CardTitle>{copy.headerTitle}</CardTitle>
          <CardDescription>{isConnected ? copy.headerDescription.connected : copy.headerDescription.disconnected}</CardDescription>
        </CardHeader>
      </Card>

      <DashboardGrid columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{isConnected ? copy.connectionCard.connectedTitle : copy.connectionCard.disconnectedTitle}</CardTitle>
            <CardDescription>
              {isConnected ? copy.connectionCard.connectedDescription : copy.connectionCard.disconnectedDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
                {copy.connectionCard.noteWhenDisconnected}
              </p>
            ) : null}

            <GarminIntegrationActions
              isConnected={isConnected}
              garminUserId={connection?.garminUserId ?? undefined}
              accessTokenExpiresAt={connection?.accessTokenExpiresAt?.toISOString()}
              status={status === "success" || status === "error" ? status : undefined}
              reason={typeof reason === "string" ? reason : undefined}
              copy={copy.actions}
              locale={locale}
              redirectPath={integrationPath}
            />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>{copy.profileCard.title}</CardTitle>
            <CardDescription>{copy.profileCard.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.profileCard.userLabel}</p>
              <p className="text-lg font-semibold text-foreground">
                {localUser?.name ?? stackUser.displayName ?? copy.profileCard.defaultName}
              </p>
              <p>{localUser?.email ?? stackUser.primaryEmail ?? copy.profileCard.defaultEmail}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{copy.profileCard.statusLabel}</p>
              <p className="mt-1 text-sm text-foreground">
                {isConnected ? copy.profileCard.statusConnected : copy.profileCard.statusDisconnected}
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardGrid>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{copy.faq.label}</p>
          <h2 className="text-3xl font-heading text-foreground">{copy.faq.title}</h2>
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
