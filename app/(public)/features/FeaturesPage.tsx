import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath } from "@/lib/i18n/routing";

type FeatureCard = {
  title: string;
  description: string;
  image: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type CallToAction = {
  label: string;
  href: string;
};

type FeaturesCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  featureCards: FeatureCard[];
  faqTag: string;
  faqTitle: string;
  faqItems: FaqItem[];
  guideTag: string;
  guideTitle: string;
  guideDescription: string;
  guideAction: CallToAction;
  actionTag: string;
  actionTitle: string;
  actionDescription: string;
  primaryAction: CallToAction;
  secondaryAction: CallToAction;
  tertiaryAction: CallToAction;
};

const frCopy: FeaturesCopy = {
  heroTag: "Fonctionnalités",
  heroTitle: "L’IA qui s’adapte à toi",
  heroDescription: "Adapt2Life analyse tes métriques, anticipe ta récupération et construit des entraînements réellement personnalisés.",
  featureCards: [
    {
      title: "AI Ultra Coach",
      description: "Ton coach IA qui propose des séances sur mesure en fonction de ta forme, de ton temps et de ton matériel.",
      image: "/brand/feature-coach.jpg",
    },
    {
      title: "Connexion Garmin native",
      description: "Connecte ton compte Garmin pour récupérer tes données et envoyer tes séances validées, sans manipulations compliquées.",
      image: "/brand/feature-garmin.jpg",
    },
    {
      title: "IA adaptative",
      description: "On suit ton sommeil, ton stress et ta récupération pour te dire quand pousser et quand lever le pied.",
      image: "/brand/feature-adaptive.jpg",
    },
  ],
  faqTag: "Questions fréquentes",
  faqTitle: "Tout savoir sur nos fonctionnalités IA",
  faqItems: [
    {
      question: "Peut-on générer un plan d’entraînement Garmin automatiquement ?",
      answer:
        "Oui. Adapt2Life compose une séance personnalisée, la met au format exigé par Garmin et l’envoie directement dans ton calendrier Garmin Connect.",
    },
    {
      question: "L’IA adapte-t-elle l’entraînement selon la récupération Body Battery ?",
      answer:
        "Tout à fait. Nous lisons Body Battery, HRV et charge d’entraînement pour ajuster l’intensité recommandée et éviter le surmenage.",
    },
    {
      question: "Quels sports sont compatibles avec l’IA ?",
      answer:
        "Course sur route, trail, vélo, triathlon et renforcement fonctionnel à domicile. Tu peux préciser ton matériel ou tes contraintes.",
    },
  ],
  guideTag: "Guide approfondi",
  guideTitle: "Smart Coach : tout comprendre en 5 minutes",
  guideDescription: "Découvre comment Adapt2Life lit tes données Garmin, génère tes séances et les envoie automatiquement sur ta montre.",
  guideAction: { label: "Lire le guide complet", href: "/features/smart-coach" },
  actionTag: "Passe à l’action",
  actionTitle: "Prêt à tester Adapt2Life ?",
  actionDescription: "Connecte ton compte, lance le générateur IA et envoie ta prochaine séance sur Garmin en quelques clics.",
  primaryAction: { label: "Commencer maintenant", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  secondaryAction: { label: "Parler à l’équipe", href: "/contact" },
  tertiaryAction: { label: "Voir les tarifs", href: "/pricing" },
};

const FEATURES_COPY: Record<Locale, FeaturesCopy> = {
  fr: frCopy,
  en: frCopy,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const basePath = "/features";

const featuresMetadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Fonctionnalités — Smart Coach & entraînements personnalisés",
    description:
      "AI Ultra Coach, synchronisation Garmin Connect, IA adaptative : explore toutes les fonctionnalités d’Adapt2Life pour des entraînements personnalisés basés sur tes données.",
    alternates: { canonical: `${siteUrl}${basePath}` },
    openGraph: {
      url: `${siteUrl}${basePath}`,
      title: "Fonctionnalités Smart Coach Adapt2Life",
      description: "Smart Coach, intégration Garmin, IA adaptative : tout ce qu’offre Adapt2Life pour des séances sur mesure.",
      type: "website",
    },
  },
  en: {
    title: "Features — Smart Coach & Personalized Training",
    description:
      "AI Ultra Coach, Garmin Connect sync, adaptive AI: explore everything Adapt2Life offers to tailor workouts from your data.",
    alternates: { canonical: `${siteUrl}/en${basePath}` },
    openGraph: {
      url: `${siteUrl}/en${basePath}`,
      title: "Adapt2Life Smart Coach Features",
      description: "Smart Coach, Garmin integration, adaptive AI: everything you need for personalized sessions.",
      type: "website",
    },
  },
};

export const getFeaturesMetadata = (locale: Locale): Metadata =>
  featuresMetadataByLocale[locale] ?? featuresMetadataByLocale.fr;

type FeaturesPageProps = {
  locale: Locale;
};

export function FeaturesPage({ locale }: FeaturesPageProps) {
  const copy = FEATURES_COPY[locale] ?? FEATURES_COPY.fr;

  const localizeHref = (href: string) => {
    if (/^(https?:)?\/\//.test(href)) return href;
    const [base, search] = href.split("?");
    const localizedBase = buildLocalePath(locale, base);
    return search ? `${localizedBase}?${search}` : localizedBase;
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading">{copy.heroTitle}</h1>
        <p className="text-base text-muted-foreground">{copy.heroDescription}</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {copy.featureCards.map((feature) => (
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
          <p className="text-sm uppercase tracking-[0.35em] text-primary/80">{copy.faqTag}</p>
          <h2 className="text-3xl font-heading text-foreground">{copy.faqTitle}</h2>
        </header>
        <div className="space-y-3">
          {copy.faqItems.map((item) => (
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
            __html: JSON.stringify(faqJsonLd),
          }}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.guideTag}</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">{copy.guideTitle}</h2>
            <p className="text-base text-muted-foreground">{copy.guideDescription}</p>
          </div>
          <Button asChild size="lg" className="px-8 text-base font-semibold">
            <Link href={localizeHref(copy.guideAction.href)}>{copy.guideAction.label}</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-background to-background p-8 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-primary/80">{copy.actionTag}</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">{copy.actionTitle}</h2>
            <p className="text-base text-muted-foreground">{copy.actionDescription}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href={localizeHref(copy.primaryAction.href)}>{copy.primaryAction.label}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href={localizeHref(copy.secondaryAction.href)}>{copy.secondaryAction.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="px-8 text-base">
              <Link href={localizeHref(copy.tertiaryAction.href)}>{copy.tertiaryAction.label}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
