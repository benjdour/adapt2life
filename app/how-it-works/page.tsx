import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Comment ça marche — Adapt2Life",
  description: "Suivez toutes les étapes pour connecter votre montre, générer un entraînement et le synchroniser.",
};

const steps = [
  {
    title: "Étape 1 — Connecte ta montre",
    description:
      "En quelques clics, autorise Adapt2Life à se synchroniser avec Garmin Connect via un flux OAuth2 PKCE sécurisé. Nous ne récupérons que les données nécessaires pour personnaliser tes entraînements, le tout dans une connexion chiffrée et réversible à tout moment.",
    image: "/brand/how-it-works-1.jpg",
  },
  {
    title: "Étape 2 — Décris ta journée",
    description:
      "Explique ton contexte du jour : niveau d’énergie, objectifs, contraintes horaires ou matériel disponible. Ces informations sont croisées avec tes métriques passées (Body Battery, sommeil, stress, charge d’entraînement) pour calibrer la charge et le format de la séance.",
    image: "/brand/how-it-works-2.jpg",
  },
  {
    title: "Étape 3 — Génère et personnalise",
    description:
      "Notre IA propose un plan complet (échauffement, bloc principal, récupérations), avec variantes pour le cardio, la musculation ou la mobilité. Tu peux regénérer la proposition, ajuster chaque bloc ou visualiser le JSON final prêt pour Garmin Training.",
    image: "/brand/how-it-works-3.jpg",
  },
  {
    title: "Étape 4 — Synchronise et exécute",
    description:
      "Une fois la séance validée, envoie-la directement sur ta montre Garmin. Adapt2Life surveille ton retour et met à jour ton plan pour les prochaines sessions, afin de rester aligné sur ta forme du moment.",
    image: "/brand/how-it-works-4.jpg",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Comment ça marche</p>
        <h1 className="text-4xl font-heading">Ton plan en 4 étapes simples</h1>
        <p className="text-base text-muted-foreground">
          Nous combinons ton ressenti, tes données Garmin et notre IA pour construire des séances ultra pertinentes.
        </p>
      </header>

      <ol className="space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg md:flex-row">
            <div className="md:w-2/3 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Étape {index + 1}</p>
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
        <p className="text-sm uppercase tracking-[0.35em] text-primary">Passe à l’action</p>
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
