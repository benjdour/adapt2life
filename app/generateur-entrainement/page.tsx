import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainingGeneratorsSection } from "@/components/TrainingGeneratorsSection";
import { stackServerApp } from "@/stack/server";

export const metadata: Metadata = {
  title: "Adapt2Life — Générateur d’entraînement",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrainingGeneratorPage() {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/generateur-entrainement");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Coaching IA</p>
        <h1 className="text-3xl font-semibold">Générateur d’entraînement</h1>
        <p className="text-sm text-white/70">
          Décris ton objectif et tes contraintes : Adapt2Life te conçoit un plan d’entraînement personnalisé en quelques secondes.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-sm text-white/70">
          Plus tu renseignes de détails (disponibilités, matériel, blessures, objectifs précis), plus le plan proposé sera pertinent. Tu
          peux regénérer le plan à volonté en ajustant les paramètres.
        </p>
      </section>

      <TrainingGeneratorsSection />

      <div className="mt-auto">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
