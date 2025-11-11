import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { db } from "@/db";
import { users } from "@/db/schema";

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

  if (!firstName && user) {
    const [localUser] = await db
      .select({
        firstName: users.firstName,
        name: users.name,
        pseudo: users.pseudo,
      })
      .from(users)
      .where(eq(users.stackId, user.id))
      .limit(1);

    if (localUser) {
      firstName =
        extractFirstName(
          {
            firstName: localUser.firstName ?? undefined,
            name: localUser.name ?? undefined,
            displayName: localUser.pseudo ?? undefined,
          },
          localUser.firstName ?? localUser.name ?? localUser.pseudo ?? null,
        ) ?? normalizeFirstName(localUser.firstName ?? localUser.name ?? localUser.pseudo);
    }
  }

  const authState = readParam(searchParams?.auth);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur">
        {authState === "unauthorized" ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-100">
            <p className="font-semibold text-red-200">Accès refusé</p>
            <p className="text-red-100/80">
              Tu dois être connecté avec un compte autorisé pour accéder à cette page.
            </p>
          </div>
        ) : null}
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Adapt2Life</h1>
          <p className="text-sm text-white/70">
            {user ? "Bienvenue dans l’espace Garmin." : "Connecte-toi pour accéder à l’espace sécurisé Garmin."}
          </p>
        </header>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg">Bonjour {firstName ?? "athlète"} 👋</p>
            <Link
              href="/generateur-entrainement"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Générateur d’entraînement
            </Link>
            <Link
              href="/secure/garmin-data"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Voir les données Garmin
            </Link>
            <Link
              href="/secure/user-information"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Voir les informations utilisateur
            </Link>
            <Link
              href="/integrations/garmin"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Accéder à la page Garmin
            </Link>
            <form action="/handler/sign-out" method="post" className="inline-flex w-full">
              <input type="hidden" name="redirect" value="/" />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
              >
                Se déconnecter d’Adapt2Life
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Clique sur le bouton ci-dessous pour te connecter via Stack Auth, puis accéder à l’intégration Garmin.
            </p>
            <Link
              href="/handler/sign-in?redirect=/integrations/garmin"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Se connecter / Créer un compte
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
