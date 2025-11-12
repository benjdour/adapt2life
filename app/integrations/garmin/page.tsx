import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import { Button } from "@/components/ui/button";

import { GarminIntegrationActions } from "./garmin-integration-actions";

export const metadata: Metadata = {
  title: "Adapt2Life — Garmin",
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

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/integrations/garmin");
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

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Intégrations</p>
          <CardTitle>Garmin Connect</CardTitle>
          <CardDescription>
            {isConnected
              ? "Ton compte Garmin est lié à Adapt2Life. Tu peux relier un autre compte ou te déconnecter à tout moment."
              : "Connecte ton compte Garmin via OAuth2 PKCE afin de synchroniser automatiquement tes activités et métriques quotidiennes."}
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
                : "Aucun compte n’est lié pour le moment. Lance l’OAuth afin d’activer la synchronisation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <dl className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Garmin userId</dt>
                  <dd className="mt-1 font-mono text-base">{connection?.garminUserId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Token valide jusqu&apos;au</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {connection?.accessTokenExpiresAt ? connection.accessTokenExpiresAt.toLocaleString() : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-muted-foreground">
                Connecte-toi puis clique sur “Connecter Garmin” pour démarrer l’autorisation OAuth2 PKCE.
              </p>
            )}

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

      <div className="flex justify-end">
        <Button asChild variant="ghost">
          <Link href="/">Retour à l’accueil Adapt2Life</Link>
        </Button>
      </div>
    </div>
  );
}
