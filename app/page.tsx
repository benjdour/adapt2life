import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { stackServerApp } from "@/stack/server";

export default async function Home() {
  noStore();

  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Adapt2Life</h1>
          <p className="text-sm text-white/70">
            {user ? "Bienvenue dans l’espace Garmin." : "Connecte-toi pour accéder à l’espace sécurisé Garmin."}
          </p>
        </header>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg">Bonjour {user.displayName ?? "athlète"} 👋</p>
            <Link
              href="/integrations/garmin"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Accéder à la page Garmin
            </Link>
            <Link
              href="/secure/user-information"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Voir les informations utilisateur
            </Link>
            <Link
              href="/secure/garmin-data"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-emerald-500/60 bg-transparent font-semibold text-white transition hover:bg-emerald-500/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Voir les données Garmin
            </Link>
            <Link
              href="/generateur-entrainement"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Générateur d’entraînement
            </Link>
            <form action="/handler/sign-out" method="post" className="inline-flex w-full">
              <input type="hidden" name="redirect" value="/" />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/30 bg-transparent font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/60"
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
