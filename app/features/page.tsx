import type { Metadata } from "next";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Fonctionnalités — Adapt2Life",
  description: "Découvrez les fonctionnalités clés d’Adapt2Life : coaching IA, synchronisation Garmin et suivi en temps réel.",
};

const features = [
  {
    title: "AI Ultra Coach",
    description:
      "Génération de plans en temps réel qui s’adaptent à ta forme, à tes contraintes et à ton matériel. Chaque séance est recalibrée automatiquement.",
    image: "/brand/feature-coach.jpg",
  },
  {
    title: "Connexion Garmin native",
    description:
      "Synchronise ton compte Garmin Connect en OAuth2 PKCE, récupère tes métriques et renvoie les entraînements validés automatiquement.",
    image: "/brand/feature-garmin.jpg",
  },
  {
    title: "IA adaptative",
    description:
      "L’IA surveille ton Body Battery, ton sommeil, ton stress et ton historique pour t’indiquer quand pousser ou lever le pied.",
    image: "/brand/feature-adaptive.jpg",
  },
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Fonctionnalités</p>
        <h1 className="text-4xl font-heading">L’IA qui s’adapte à toi</h1>
        <p className="text-base text-muted-foreground">
          Adapt2Life analyse tes métriques, anticipe ta récupération et construit des entraînements réellement personnalisés.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-white/10 bg-card/80 shadow-lg">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Image
                src={feature.image}
                alt={feature.title}
                width={400}
                height={300}
                className="rounded-2xl border border-white/10 object-cover"
              />
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
