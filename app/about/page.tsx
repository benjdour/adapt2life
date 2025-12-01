import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "À propos — Adapt2Life",
  description:
    "Découvre l’histoire d’Adapt2Life, notre mission et la manière dont nous combinons IA et données sportives pour accompagner les athlètes connectés.",
};

const values = [
  {
    title: "IA responsable",
    description:
      "Nous gardons l’humain au centre. L’IA sert à accélérer les décisions, pas à déshumaniser le coaching.",
  },
  {
    title: "Données utiles",
    description:
      "Chaque métrique Garmin exploitée doit déboucher sur une recommandation concrète pour éviter la fatigue ou maximiser la progression.",
  },
  {
    title: "Simplicité radicale",
    description:
      "Moins de frictions, plus d’action. Nous avons fait le choix d’une interface claire et d’automatisations pour gagner du temps.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">À propos</p>
          <h1 className="text-4xl font-heading leading-tight md:text-5xl">L’IA qui s’adapte à ta vie.</h1>
          <p className="text-base text-muted-foreground">
            Adapt2Life est né d’un constat simple : les plans d’entraînement statiques ne suivent pas notre réalité. Nous avons donc construit
            un coach IA qui lit ta récupération, écoute ton ressenti et aligne chaque séance sur ton contexte.
          </p>
          <p className="text-base text-muted-foreground">
            L’équipe rassemble des entraîneurs, des passionnés de data et des spécialistes Garmin. Notre objectif est de te donner un coaching
            aussi qualitatif qu’un suivi humain, mais disponible 24/7 et branché sur tes données en temps réel.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/handler/sign-in?redirect=/generateur-entrainement">Découvrir Adapt2Life</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Parler à l’équipe</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/brand/about-team.jpg"
            alt="Équipe Adapt2Life"
            width={640}
            height={480}
            className="rounded-3xl border border-white/10 object-cover shadow-2xl"
          />
          <div className="absolute -bottom-4 -right-4 rounded-2xl border border-primary/30 bg-background/80 px-5 py-3 text-sm text-muted-foreground">
            12 000 séances générées par mois
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value.title} className="border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle className="text-xl">{value.title}</CardTitle>
              <CardDescription>{value.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-primary/80">Notre mission</p>
          <h2 className="text-3xl font-heading text-foreground">Réconcilier planning et réalité</h2>
          <p className="text-base text-muted-foreground">
            Nous aidons les athlètes connectés à planifier une année entière sans sacrifier leur flexibilité. Grâce à nos workflows IA + Garmin,
            chaque séance est recalculée selon ton sommeil, ton stress, ta charge et tes contraintes quotidiennes.
          </p>
          <p className="text-base text-muted-foreground">
            Au-delà des entraînements, nous voulons rassurer sur la fatigue, donner des insights exploitables à ton coach humain et faciliter le
            passage du “brief” au “push” Garmin.
          </p>
        </div>
      </section>
    </main>
  );
}
