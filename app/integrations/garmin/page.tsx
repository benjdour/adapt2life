import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminConnections, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

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
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-white/60">Intégrations</p>
        <h1 className="text-3xl font-semibold text-white">Garmin Connect</h1>
        {isConnected ? (
          <p className="max-w-2xl text-sm text-white/70">
            Ton compte Garmin est déjà lié à Adapt2Life. Tu peux le gérer ou te déconnecter ci-dessous.
          </p>
        ) : (
          <p className="max-w-2xl text-sm text-white/70">
            Teste l&apos;autorisation Garmin Connect via OAuth2 PKCE. Une fois connecté, Adapt2Life pourra synchroniser tes
            activités et métriques quotidiennes.
          </p>
        )}
      </header>

      {isConnected ? (
        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-white/60">Statut</p>
            <h2 className="text-2xl font-semibold text-white">Garmin est connecté ✅</h2>
            <p className="text-sm text-white/70">
              Adapt2Life peut collecter tes activités depuis Garmin. Tu peux relier un autre compte ou te déconnecter à tout moment.
            </p>
          </div>

          <dl className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/60">Garmin userId</dt>
              <dd className="mt-1 font-mono text-base">{connection?.garminUserId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/60">Token valide jusqu&apos;au</dt>
              <dd className="mt-1 font-medium text-white/80">
                {connection?.accessTokenExpiresAt ? connection.accessTokenExpiresAt.toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/60">Utilisateur Adapt2Life</dt>
              <dd className="mt-1 font-medium text-white/80">{localUser?.name ?? stackUser.displayName ?? "Profil sans nom"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/60">Email</dt>
              <dd className="mt-1 font-medium text-white/80">{localUser?.email ?? stackUser.primaryEmail ?? "Email non renseigné"}</dd>
            </div>
          </dl>

          <GarminIntegrationActions
            isConnected
            garminUserId={connection?.garminUserId ?? undefined}
            accessTokenExpiresAt={connection?.accessTokenExpiresAt?.toISOString()}
            status={status === "success" || status === "error" ? status : undefined}
            reason={typeof reason === "string" ? reason : undefined}
          />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 sm:w-auto"
          >
            Retour à l’accueil Adapt2Life
          </Link>
        </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-lg">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">Utilisateur Stack Auth</p>
            <p className="text-lg font-semibold text-white">
              {localUser?.name ?? stackUser.displayName ?? "Profil sans nom"}
            </p>
            <p className="text-sm text-white/70">
              {localUser?.email ?? stackUser.primaryEmail ?? "Email non renseigné"}
            </p>
          </div>

          <GarminIntegrationActions
            isConnected={false}
            garminUserId={undefined}
            accessTokenExpiresAt={undefined}
            status={status === "success" || status === "error" ? status : undefined}
            reason={typeof reason === "string" ? reason : undefined}
          />
        </section>
      )}
    </div>
  );
}
