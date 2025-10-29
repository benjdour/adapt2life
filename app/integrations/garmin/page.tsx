import { unstable_noStore as noStore } from "next/cache";
import { Metadata } from "next";
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Intégrations</p>
        <h1 className="text-3xl font-semibold text-white">Connexion Garmin</h1>
        <p className="max-w-xl text-sm text-white/70">
          Testez l&apos;autorisation Garmin Connect via OAuth2 PKCE. Une fois connecté, Adapt2Life pourra synchroniser vos
          activités et métriques quotidiennes.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/90">Utilisateur Stack Auth</p>
          <p className="text-lg font-semibold text-white">
            {localUser?.name ?? stackUser.displayName ?? "Profil sans nom"}
          </p>
          <p className="text-sm text-white/70">
            {localUser?.email ?? stackUser.primaryEmail ?? "Email non renseigné"}
          </p>
        </div>

        <GarminIntegrationActions
          isConnected={Boolean(connection)}
          garminUserId={connection?.garminUserId ?? undefined}
          accessTokenExpiresAt={connection?.accessTokenExpiresAt?.toISOString()}
          status={status === "success" || status === "error" ? status : undefined}
          reason={typeof reason === "string" ? reason : undefined}
        />
      </section>
    </div>
  );
}
