import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const pageUrl = `${siteUrl}/features/coach-ia-garmin`;

export const metadata: Metadata = {
  title: "Coach IA Garmin — Guide complet Adapt2Life",
  description:
    "Comprends comment Adapt2Life combine l’IA et tes données Garmin pour générer des plans d’entraînement sur-mesure, validés et envoyés sur ta montre.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Coach IA Garmin — Adapt2Life",
    description:
      "Découvre notre approche IA + Garmin : diagnostic quotidien, génération de séances, envoi automatique et suivi de la récupération.",
    url: pageUrl,
    type: "article",
    images: [
      {
        url: `${siteUrl}/brand/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Adapt2Life — Coach IA Garmin",
      },
    ],
  },
};

const heroStats = [
  { label: "Séances générées / mois", value: "12 000+" },
  { label: "Taux d’envoi Garmin", value: "98,5 %" },
  { label: "Temps moyen de génération", value: "< 30 s" },
];

const benefits = [
  {
    title: "Lecture intelligente des métriques",
    description: "Charge, sommeil, stress, Body Battery… l’IA identifie instantanément les signaux forts pour personnaliser ton prochain entraînement.",
  },
  {
    title: "Brief naturel, sortie structurée",
    description: "Tu décris ton contexte en langage courant, Adapt2Life génère un bloc détaillé avec zones, intensités et consignes.",
  },
  {
    title: "Respect du format Garmin",
    description: "Chaque séance est vérifiée automatiquement avant d’être envoyée dans ton agenda Garmin.",
  },
  {
    title: "Boucle d’amélioration continue",
    description: "Les séances réalisées enrichissent ton profil pour affiner les recommandations suivantes : progression, fatigue, préférences.",
  },
];

const steps = [
  {
    title: "1. Synchronisation & diagnostic",
    description:
      "Tu connectes Garmin Connect ; nous analysons automatiquement les 30 derniers jours pour comprendre ton volume, ton intensité et tes tendances de récupération.",
  },
  {
    title: "2. Brief IA",
    description:
      "Tu expliques ta forme du jour, tes contraintes de temps ou de matériel. L’IA traduit ces signaux en un cahier de charges précis.",
  },
  {
    title: "3. Génération & validation",
    description:
      "Adapt2Life compose la séance (échauffement, blocs principaux, récupérations), vérifie la cohérence des zones, puis la convertit dans le format officiel Garmin.",
  },
  {
    title: "4. Envoi & suivi",
    description:
      "En un clic, la séance est poussée dans ton calendrier Garmin. Après exécution, nous analysons la réalité vs. la cible pour ajuster la suite.",
  },
];

const useCases = [
  {
    title: "Triathlètes & multi-sportifs",
    description:
      "Planifie natation, vélo, course avec une charge maîtrisée et des séances croisée adaptées à ta semaine.",
  },
  {
    title: "Coureurs route / trail",
    description:
      "Prépare 10 km, marathon ou ultra avec des blocs spécifiques (VDOT, rando-course, seuil) et des rappels de gestion d’allure.",
  },
  {
    title: "Cyclistes connectés",
    description:
      "Structure tes sorties home-trainer ou outdoor avec puissance, cadence et consignes nutritionnelles.",
  },
  {
    title: "Retour de blessure",
    description:
      "Mentionne tes restrictions : l’IA propose du renfo ciblé, de l’endurance douce ou du travail technique sécurisé.",
  },
];

const comparisonRows = [
  {
    critere: "Analyse des données en temps réel",
    adapt2life: "Oui — connexion native Garmin + signaux IA",
    generique: "Non — séances statiques",
    coachHumain: "Oui, mais revue manuelle hebdo",
  },
  {
    critere: "Temps de réponse",
    adapt2life: "Instantané (quelques secondes)",
    generique: "Immédiat mais non personnalisé",
    coachHumain: "24-72h selon disponibilité",
  },
  {
    critere: "Coût mensuel",
    adapt2life: "Accessible (offre mensuelle/annuelle)",
    generique: "Variable, souvent gratuit mais limité",
    coachHumain: "150€+ / mois",
  },
  {
    critere: "Envoi automatique sur Garmin",
    adapt2life: "Oui, validé et suivi",
    generique: "Non, export manuel",
    coachHumain: "Parfois (selon outils)",
  },
];

const pageFaq = [
  {
    question: "Pourquoi relier Adapt2Life à Garmin plutôt qu’à une autre plateforme ?",
    answer:
      "Garmin fournit les métriques les plus complètes (charge, HRV, Body Battery). Adapt2Life se branche à ces signaux pour comprendre ta récupération et envoyer la séance directement dans ton calendrier Garmin Connect.",
  },
  {
    question: "Ai-je besoin d’un coach humain en plus de l’IA ?",
    answer:
      "Tout dépend de ton besoin d’accompagnement. Notre IA couvre la personnalisation quotidienne et l’envoi automatique. Tu peux toujours partager les séances avec un coach humain si tu veux un suivi hybride.",
  },
  {
    question: "Que se passe-t-il si je n’ai pas mes capteurs (puissance, FC) ?",
    answer:
      "Tu précises dans le brief que tu t’entraînes à la sensation ou à l’allure. L’IA adapte les consignes en RPE ou en tempo pour que la séance reste exploitable sur ta montre.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Coach IA Garmin — Guide complet Adapt2Life",
  description:
    "Comprendre comment Adapt2Life combine l’IA et les données Garmin pour générer des plans d’entraînement personnalisés et envoyés automatiquement sur ta montre.",
  datePublished: "2024-11-01",
  dateModified: new Date().toISOString(),
  author: {
    "@type": "Organization",
    name: "Adapt2Life",
  },
  publisher: {
    "@type": "Organization",
    name: "Adapt2Life",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/brand/logo-main.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": pageUrl,
  },
  image: `${siteUrl}/brand/og-image.jpg`,
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Fonctionnalités",
      item: `${siteUrl}/features`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Coach IA Garmin",
      item: pageUrl,
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pageFaq.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function CoachIAGarminPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 text-foreground">
      <section className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.5em] text-primary/80">Présentation complète</p>
          <h1 className="text-4xl font-heading leading-tight md:text-5xl">
            Coach IA Garmin : la méthode Adapt2Life pour des entraînements toujours alignés sur ta réalité.
          </h1>
          <p className="text-base text-muted-foreground">
            Relie tes données, décris ton contexte et laisse l’IA composer, valider et envoyer tes séances directement sur ton
            calendrier Garmin. Une approche pensée pour les athlètes connectés qui n’ont pas de temps à perdre.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href="/handler/sign-in?redirect=/generateur-entrainement">Tester gratuitement</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href="/contact">Parler à un expert</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <Image
            src="/brand/main-visual.jpg"
            alt="Interface Adapt2Life et données Garmin"
            width={640}
            height={420}
            priority
            className="w-full rounded-3xl border border-white/10 object-cover"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-card/70 p-4 text-center">
                <p className="text-2xl font-heading text-primary">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Pourquoi Adapt2Life</p>
          <h2 className="mt-2 text-3xl font-heading">L’IA qui comprend vraiment tes données Garmin</h2>
          <p className="text-base text-muted-foreground">
            Au-delà des séances “standards”, on lit tes métriques quotidiennes pour générer des recommandations exploitables et
            prêtes à être synchronisées.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Méthodologie</p>
          <h2 className="mt-2 text-3xl font-heading">Comment fonctionne le coaching IA connecté à Garmin ?</h2>
          <p className="text-base text-muted-foreground">
            Chaque étape est automatisée mais contrôlée : diagnostic, brief, génération, conversion puis envoi.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.title} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Cas d’usage</p>
          <h2 className="mt-2 text-3xl font-heading">Pensé pour tous les profils connectés</h2>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{useCase.title}</CardTitle>
                <CardDescription>{useCase.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Comparatif</p>
          <h2 className="text-3xl font-heading">Pourquoi l’IA Adapt2Life fait la différence</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-3 font-semibold">Critère</th>
                <th className="p-3 font-semibold text-primary">Adapt2Life</th>
                <th className="p-3 font-semibold">Plan générique</th>
                <th className="p-3 font-semibold">Coach humain</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.critere} className="border-t border-white/10">
                  <td className="p-3 font-semibold text-foreground">{row.critere}</td>
                  <td className="p-3 text-primary">{row.adapt2life}</td>
                  <td className="p-3 text-muted-foreground">{row.generique}</td>
                  <td className="p-3 text-muted-foreground">{row.coachHumain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Ressources</p>
          <h2 className="mt-2 text-3xl font-heading">Aller plus loin avec Adapt2Life</h2>
          <p className="text-base text-muted-foreground">
            Guide complet, fonctionnement détaillé et intégration Garmin sont à portée de clic.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Découvrir toutes les fonctionnalités", href: "/features" },
            { label: "Comprendre l’intégration Garmin", href: "/integrations/garmin" },
            { label: "Étapes du générateur IA", href: "/how-it-works" },
          ].map((item) => (
            <Card key={item.href} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{item.label}</CardTitle>
                <CardDescription>
                  <Link href={item.href} className="font-semibold text-primary hover:underline">
                    Lire la ressource →
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Questions fréquentes</p>
          <h2 className="mt-2 text-3xl font-heading">Tout savoir sur le coach IA Garmin</h2>
        </header>
        <div className="space-y-3">
          {pageFaq.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-white/10 bg-card/80 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading text-foreground">
                {faq.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="text-sm">
          Encore une question ? Consulte la <Link href="/faq" className="text-primary hover:underline">
            FAQ complète
          </Link>{" "}
          ou contacte-nous.
        </p>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.45em] text-primary/80">Passe à l’action</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-heading text-foreground">Prêt à connecter Adapt2Life et ta montre Garmin ?</h2>
            <p className="text-base text-muted-foreground">
              Lance le générateur IA, teste plusieurs séances gratuites et envoie-les dans Garmin en quelques secondes.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href="/handler/sign-in?redirect=/generateur-entrainement">Commencer</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href="/contact">Planifier une démo</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </main>
  );
}
