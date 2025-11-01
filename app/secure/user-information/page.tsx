import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

export const metadata: Metadata = {
  title: "Adapt2Life — Informations utilisateur",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserInformationPage() {
  noStore();

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/secure/user-information");
  }

  const [localUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  const primaryEmail = stackUser.primaryEmail ?? localUser?.email ?? "Email non renseigné";
  const signedUpAt =
    stackUser.signedUpAt instanceof Date ? stackUser.signedUpAt : stackUser.signedUpAt ? new Date(stackUser.signedUpAt) : null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Compte</p>
        <h1 className="text-3xl font-semibold">Informations utilisateur</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Consulte les informations essentielles associées à ton profil Adapt2Life et à ton compte Stack Auth.
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-white/60">Identité Stack Auth</p>
          <div>
            <h2 className="text-2xl font-semibold">{stackUser.displayName ?? "Profil sans nom"}</h2>
            <p className="text-sm text-white/70">{primaryEmail}</p>
          </div>
          {stackUser.profileImageUrl ? (
            <p className="text-xs text-white/50">
              Image de profil:{" "}
              <a href={stackUser.profileImageUrl} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                {stackUser.profileImageUrl}
              </a>
            </p>
          ) : null}
        </div>

        <dl className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Email vérifié</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.primaryEmailVerified ? "Oui ✅" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Mot de passe configuré</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.hasPassword ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Compte anonyme</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.isAnonymous ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Inscription Stack</dt>
            <dd className="mt-2 text-base font-semibold">{signedUpAt ? signedUpAt.toLocaleString("fr-FR") : "Non disponible"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">ID Stack</dt>
            <dd className="mt-2 font-mono text-xs sm:text-sm">{stackUser.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Métadonnées client</dt>
            <dd className="mt-2 text-xs text-white/60">
              {stackUser.clientMetadata ? JSON.stringify(stackUser.clientMetadata) : "Aucune métadonnée"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-3xl border border-emerald-700/40 bg-emerald-900/20 p-8 shadow-xl backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">Profil Adapt2Life</p>
          <p className="text-sm text-emerald-100/80">
            {localUser
              ? "Informations synchronisées avec la base de données interne."
              : "Aucun profil local n’a encore été créé pour ce compte. Lance l’intégration Garmin pour initialiser la synchronisation."}
          </p>
        </div>

        {localUser ? (
          <dl className="grid gap-4 rounded-2xl border border-emerald-700/30 bg-emerald-900/30 p-4 text-sm sm:grid-cols-2 sm:gap-6 sm:p-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Identifiant interne</dt>
              <dd className="mt-2 font-mono text-xs sm:text-sm">{localUser.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Nom enregistré</dt>
              <dd className="mt-2 text-base font-semibold">{localUser.name ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Email enregistré</dt>
              <dd className="mt-2 text-base font-semibold">{localUser.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Créé le</dt>
              <dd className="mt-2 text-base font-semibold">
                {localUser.createdAt ? localUser.createdAt.toLocaleString("fr-FR") : "Non disponible"}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/integrations/garmin"
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Gérer l’intégration Garmin
        </Link>
      </div>
    </div>
  );
}
