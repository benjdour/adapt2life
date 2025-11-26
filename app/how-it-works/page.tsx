import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Comment ça marche — Entraînement personnalisé avec Garmin et IA",
  description:
    "Connectez votre montre Garmin, décrivez votre forme du jour et laissez l’IA Adapt2Life générer des entraînements personnalisés envoyés automatiquement sur votre montre.",
};

const steps = [
  {
    title: "Étape 1 — Connecte ta montre",
    description:
      "Autorise Adapt2Life à lire tes données Garmin en quelques secondes. Tu restes maître de la connexion et peux l’arrêter quand tu veux.",
    image: "/brand/how-it-works-1.jpg",
  },
  {
    title: "Étape 2 — Décris ta journée",
    description:
      "Raconte comment tu te sens, ton objectif du jour et tes contraintes de temps ou de matériel. Plus le brief est simple et précis, plus la séance colle à ta réalité.",
    image: "/brand/how-it-works-2.jpg",
  },
  {
    title: "Étape 3 — Génère et personnalise",
    description:
      "L’IA te suggère une séance complète (échauffement, bloc principal, récup). Tu peux regénérer, ajuster les blocs ou garder la version qui te plaît.",
    image: "/brand/how-it-works-3.jpg",
  },
  {
    title: "Étape 4 — Synchronise et exécute",
    description:
      "Envoie la séance sur ta montre Garmin et lance-toi. Après ton entraînement, nous adaptons les prochaines propositions à ta forme du moment.",
    image: "/brand/how-it-works-4.jpg",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Comment ça marche</p>
        <h1 className="text-4xl font-heading">Ton plan en 4 étapes simples</h1>
        <p className="text-base text-muted-foreground">
          Nous combinons ton ressenti, tes données Garmin (Body Battery, VFC, charge) et notre IA pour construire des séances ultra pertinentes.
        </p>
      </header>

      <ol className="space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg md:flex-row">
            <div className="md:w-2/3 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Étape {index + 1}</p>
              <h2 className="text-2xl font-heading">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            <div className="md:w-1/3">
              <Image
                src={step.image}
                alt={step.title}
                width={800}
                height={600}
                className="h-full rounded-xl border border-white/10 object-cover shadow-lg"
              />
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-background to-background p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-primary/80">Passe à l’action</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">Envie d’essayer Adapt2Life ?</h2>
            <p className="text-base text-muted-foreground">
              Connecte ton compte, génère un plan IA et synchronise-le directement avec Garmin Connect.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href="/handler/sign-in?redirect=/generateur-entrainement">Commencer maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href="/contact">Parler à l’équipe</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
