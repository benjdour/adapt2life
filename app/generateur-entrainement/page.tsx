import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { GarminTrainerGenerator } from "@/components/GarminTrainerGenerator";
import { TrainingPlanGeneratorForm } from "@/components/TrainingPlanGeneratorForm";
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
          Décris ton objectif et tes contraintes : Adapt2Life te conçoit un plan d’entraînement personnalisé en quelques secondes,
          optimisé grâce à OpenRouter.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-sm text-white/70">
          Plus tu renseignes de détails (disponibilités, matériel, blessures, objectifs précis), plus le plan proposé sera pertinent. Tu
          peux regénérer le plan à volonté en ajustant les paramètres.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
      </section>

      <TrainingPlanGeneratorForm />

      <section
        id="garmin"
        className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white shadow-lg shadow-emerald-500/10 backdrop-blur"
      >
        <header className="space-y-2 text-center md:text-left">
          <p className="text-xs uppercase tracking-wide text-emerald-400">Garmin Training API (bêta)</p>
          <h2 className="text-2xl font-semibold">Générateur d’entraînements Garmin</h2>
          <p className="text-sm text-white/70">
            Colle un exemple d’entraînement ou un brief détaillé : nous produisons un JSON strictement conforme à la documentation Garmin
            Training API V2, prêt à être validé puis envoyé automatiquement sur ton compte.
          </p>
        </header>

        <div className="space-y-6">
          <GarminTrainerGenerator />

          <div className="rounded-xl border border-white/10 bg-emerald-900/20 p-4 text-xs text-emerald-100/80">
            <p className="font-semibold text-emerald-200">Bon à savoir</p>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Tu peux pousser le JSON validé vers Garmin directement depuis cette page (bouton &laquo;&nbsp;Envoyer l’entraînement sur Garmin&nbsp;&raquo;).</li>
              <li>Assure-toi d’être connecté à ton compte Garmin dans Adapt2Life pour l’envoi automatique.</li>
              <li>La longueur de piscine est définie par défaut à 25&nbsp;m si le brief ne la précise pas.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
