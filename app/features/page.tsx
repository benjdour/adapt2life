import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fonctionnalités — Coach IA Garmin & entraînements personnalisés",
  description:
    "AI Ultra Coach, synchronisation Garmin Connect, IA adaptative : explorez toutes les fonctionnalités d’Adapt2Life pour des entraînements personnalisés basés sur vos données.",
};

const features = [
  {
    title: "AI Ultra Coach",
    description:
      "Ton coach IA qui propose des séances sur mesure en fonction de ta forme, de ton temps et de ton matériel.",
    image: "/brand/feature-coach.jpg",
  },
  {
    title: "Connexion Garmin native",
    description:
      "Connecte ton compte Garmin pour récupérer tes données et envoyer tes séances validées, sans manipulations compliquées.",
    image: "/brand/feature-garmin.jpg",
  },
  {
    title: "IA adaptative",
    description:
      "On suit ton sommeil, ton stress et ta récupération pour te dire quand pousser et quand lever le pied.",
    image: "/brand/feature-adaptive.jpg",
  },
];

export default function FeaturesPage() {
  const faqItems = [
    {
      question: "Peut-on générer un plan d’entraînement Garmin automatiquement ?",
      answer:
        "Oui. Adapt2Life compose une séance personnalisée, la met au format exigé par Garmin et l’envoie directement dans ton calendrier Garmin Connect.",
    },
    {
      question: "L’IA adapte-t-elle l’entraînement selon la récupération Body Battery ?",
      answer:
        "Tout à fait. Nous lisons Body Battery, VFC et charge d’entraînement pour ajuster l’intensité recommandée et éviter le surmenage.",
    },
    {
      question: "Quels sports sont compatibles avec l’IA ?",
      answer:
        "Course sur route, trail, vélo, triathlon et renforcement fonctionnel à domicile. Tu peux préciser ton matériel ou tes contraintes.",
    },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Fonctionnalités</p>
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

      <section className="space-y-4">
        <header>
          <p className="text-sm uppercase tracking-[0.35em] text-primary/80">Questions fréquentes</p>
          <h2 className="text-3xl font-heading text-foreground">Tout savoir sur nos fonctionnalités IA</h2>
        </header>
        <div className="space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-white/10 bg-card/80 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading text-foreground">
                {item.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Guide approfondi</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">Coach IA Garmin : tout comprendre en 5 minutes</h2>
            <p className="text-base text-muted-foreground">
              Découvre comment Adapt2Life lit tes données Garmin, génère tes séances et les envoie automatiquement sur ta montre.
            </p>
          </div>
          <Button asChild size="lg" className="px-8 text-base font-semibold">
            <Link href="/features/coach-ia-garmin">Lire le guide complet</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-background to-background p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-primary/80">Passe à l’action</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">Prêt à tester Adapt2Life ?</h2>
            <p className="text-base text-muted-foreground">
              Connecte ton compte, lance le générateur IA et envoie ta prochaine séance sur Garmin en quelques clics.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href="/handler/sign-in?redirect=/generateur-entrainement">Commencer maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href="/contact">Parler à l’équipe</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="px-8 text-base">
              <Link href="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
