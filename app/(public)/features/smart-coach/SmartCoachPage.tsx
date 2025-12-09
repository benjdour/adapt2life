import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath } from "@/lib/i18n/routing";

type HeroStat = { label: string; value: string };
type SimpleBlock = { title: string; description: string };
type ComparisonRow = { criterion: string; adapt2life: string; generic: string; coach: string };
type ResourceLink = { label: string; href: string };
type Cta = { label: string; href: string };
type BreadcrumbLabels = { home: string; features: string; current: string };
type FaqItem = { question: string; answer: string };

type SmartCoachCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  heroImageAlt: string;
  heroStats: HeroStat[];
  heroPrimaryAction: Cta;
  heroSecondaryAction: Cta;
  whyTag: string;
  whyTitle: string;
  whyDescription: string;
  benefits: SimpleBlock[];
  methodologyTag: string;
  methodologyTitle: string;
  methodologyDescription: string;
  steps: SimpleBlock[];
  useCaseTag: string;
  useCaseTitle: string;
  useCases: SimpleBlock[];
  comparisonTag: string;
  comparisonTitle: string;
  comparisonRows: ComparisonRow[];
  resourcesTag: string;
  resourcesTitle: string;
  resourcesDescription: string;
  resources: ResourceLink[];
  faqTag: string;
  faqTitle: string;
  faqMore: {
    beforeLink: string;
    linkLabel: string;
    afterLink: string;
  };
  faqItems: FaqItem[];
  actionTag: string;
  actionTitle: string;
  actionDescription: string;
  actionPrimary: Cta;
  actionSecondary: Cta;
  breadcrumb: BreadcrumbLabels;
  article: {
    headline: string;
    description: string;
  };
};

const sharedStats: HeroStat[] = [
  { label: "Séances générées / mois", value: "12 000+" },
  { label: "Taux d’envoi Garmin", value: "98,5 %" },
  { label: "Temps moyen de génération", value: "< 30 s" },
];

const sharedBenefits: SimpleBlock[] = [
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

const sharedSteps: SimpleBlock[] = [
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

const sharedUseCases: SimpleBlock[] = [
  {
    title: "Triathlètes & multi-sportifs",
    description:
      "Planifie natation, vélo, course avec une charge maîtrisée et des séances croisées adaptées à ta semaine.",
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

const sharedComparison: ComparisonRow[] = [
  {
    criterion: "Analyse des données en temps réel",
    adapt2life: "Oui — connexion native Garmin + signaux IA",
    generic: "Non — séances statiques",
    coach: "Oui, mais revue manuelle hebdo",
  },
  {
    criterion: "Temps de réponse",
    adapt2life: "Instantané (quelques secondes)",
    generic: "Immédiat mais non personnalisé",
    coach: "24-72h selon disponibilité",
  },
  {
    criterion: "Coût mensuel",
    adapt2life: "Accessible (offre mensuelle/annuelle)",
    generic: "Variable, souvent gratuit mais limité",
    coach: "150€+ / mois",
  },
  {
    criterion: "Envoi automatique sur Garmin",
    adapt2life: "Oui, validé et suivi",
    generic: "Non, export manuel",
    coach: "Parfois (selon outils)",
  },
];

const sharedResources: ResourceLink[] = [
  { label: "Découvrir toutes les fonctionnalités", href: "/features" },
  { label: "Comprendre l’intégration Garmin", href: "/integrations/garmin" },
  { label: "Étapes du générateur IA", href: "/how-it-works" },
];

const sharedFaq: FaqItem[] = [
  {
    question: "Pourquoi relier Adapt2Life à Garmin plutôt qu’à une autre plateforme ?",
    answer:
      "Garmin fournit les métriques les plus complètes (charge, HRV, Body Battery). Adapt2Life se branche à ces signaux pour comprendre ta récupération et envoyer la séance directement dans ton calendrier Garmin Connect.",
  },
  {
    question: "Ai-je besoin d’un coach humain en plus de l’IA ?",
    answer:
      "Selon ton besoin d’accompagnement. Notre IA couvre la personnalisation quotidienne et l’envoi automatique. Tu peux partager les séances avec un coach humain si tu veux un suivi hybride.",
  },
  {
    question: "Que se passe-t-il si je n’ai pas mes capteurs (puissance, FC) ?",
    answer:
      "Tu précises dans le brief que tu t’entraînes à la sensation ou à l’allure. L’IA adapte les consignes en RPE ou en tempo pour que la séance reste exploitable sur ta montre.",
  },
];

const sharedCopy: Omit<SmartCoachCopy, "breadcrumb" | "article"> = {
  heroTag: "Présentation complète",
  heroTitle: "Smart Coach : la méthode Adapt2Life pour des entraînements toujours alignés sur ta réalité.",
  heroDescription:
    "Relie tes données, décris ton contexte et laisse l’IA composer, valider et envoyer tes séances directement sur ton calendrier Garmin. Pensé pour les athlètes connectés qui n’ont pas de temps à perdre.",
  heroImageAlt: "Interface Adapt2Life et données Garmin",
  heroStats: sharedStats,
  heroPrimaryAction: { label: "Tester gratuitement", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  heroSecondaryAction: { label: "Parler à un expert", href: "/contact" },
  whyTag: "Pourquoi Adapt2Life",
  whyTitle: "L’IA qui comprend vraiment tes données Garmin",
  whyDescription:
    "Au-delà des séances “standards”, on lit tes métriques quotidiennes pour générer des recommandations exploitables et prêtes à être synchronisées.",
  benefits: sharedBenefits,
  methodologyTag: "Méthodologie",
  methodologyTitle: "Comment fonctionne le coaching IA connecté à Garmin ?",
  methodologyDescription: "Chaque étape est automatisée mais contrôlée : diagnostic, brief, génération, conversion puis envoi.",
  steps: sharedSteps,
  useCaseTag: "Cas d’usage",
  useCaseTitle: "Pensé pour tous les profils connectés",
  useCases: sharedUseCases,
  comparisonTag: "Comparatif",
  comparisonTitle: "Pourquoi l’IA Adapt2Life fait la différence",
  comparisonRows: sharedComparison,
  resourcesTag: "Ressources",
  resourcesTitle: "Aller plus loin avec Adapt2Life",
  resourcesDescription: "Guide complet, fonctionnement détaillé et intégration Garmin sont à portée de clic.",
  resources: sharedResources,
  faqTag: "Questions fréquentes",
  faqTitle: "Tout savoir sur le coach IA Garmin",
  faqMore: {
    beforeLink: "Encore une question ? Consulte la",
    linkLabel: "FAQ complète",
    afterLink: "ou contacte-nous.",
  },
  faqItems: sharedFaq,
  actionTag: "Passe à l’action",
  actionTitle: "Prêt à connecter Adapt2Life et ta montre Garmin ?",
  actionDescription: "Lance le générateur IA, teste plusieurs séances gratuites et envoie-les dans Garmin en quelques secondes.",
  actionPrimary: { label: "Commencer", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  actionSecondary: { label: "Planifier une démo", href: "/contact" },
};

const SMART_COACH_COPY: Record<Locale, SmartCoachCopy> = {
  fr: {
    ...sharedCopy,
    breadcrumb: { home: "Accueil", features: "Fonctionnalités", current: "Smart Coach" },
    article: {
      headline: "Smart Coach — Guide complet Adapt2Life",
      description:
        "Comprendre comment Adapt2Life combine l’IA et les données Garmin pour générer des plans personnalisés envoyés automatiquement sur ta montre.",
    },
  },
  en: {
    ...sharedCopy,
    breadcrumb: { home: "Home", features: "Features", current: "Smart Coach" },
    article: {
      headline: "Smart Coach — Adapt2Life overview",
      description: "Discover how Adapt2Life blends AI with Garmin data to ship personalized workouts straight to your watch.",
    },
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const basePath = "/features/smart-coach";

const metadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Smart Coach — Guide complet Adapt2Life",
    description:
      "Comprends comment Adapt2Life combine l’IA et tes données Garmin pour générer des plans validés et envoyés automatiquement dans ton calendrier.",
    alternates: { canonical: `${siteUrl}${basePath}` },
    openGraph: {
      title: "Smart Coach — Adapt2Life",
      description: "Diagnostic quotidien, génération de séances et envoi automatique sur ta montre Garmin.",
      url: `${siteUrl}${basePath}`,
      type: "article",
      images: [{ url: `${siteUrl}/brand/og-image.jpg`, width: 1200, height: 630, alt: "Adapt2Life — Smart Coach" }],
    },
  },
  en: {
    title: "Smart Coach — Adapt2Life overview",
    description: "See how Adapt2Life reads Garmin signals, builds each workout, and pushes it to your watch in seconds.",
    alternates: { canonical: `${siteUrl}/en${basePath}` },
    openGraph: {
      title: "Smart Coach — Adapt2Life",
      description: "AI brief to Garmin-ready workout: understand the full pipeline.",
      url: `${siteUrl}/en${basePath}`,
      type: "article",
      images: [{ url: `${siteUrl}/brand/og-image.jpg`, width: 1200, height: 630, alt: "Adapt2Life — Smart Coach" }],
    },
  },
};

export const getSmartCoachMetadata = (locale: Locale): Metadata => metadataByLocale[locale] ?? metadataByLocale.fr;

type SmartCoachPageProps = {
  locale: Locale;
};

const isAbsoluteHref = (href: string) => /^(https?:)?\/\//.test(href);

const localizeHref = (locale: Locale, href: string) => {
  if (isAbsoluteHref(href)) return href;
  const [pathname, search] = href.split("?");
  if (pathname === "/handler/sign-in") {
    const redirectParam = search?.replace("redirect=", "") ?? "/";
    const localizedSignIn = buildLocalePath(locale, pathname);
    const localizedRedirect = buildLocalePath(locale, redirectParam);
    return `${localizedSignIn}?redirect=${encodeURIComponent(localizedRedirect)}`;
  }
  const localized = buildLocalePath(locale, pathname);
  return search ? `${localized}?${search}` : localized;
};

const buildArticleJsonLd = (locale: Locale, copy: SmartCoachCopy) => {
  const pagePath = locale === "fr" ? basePath : `/en${basePath}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy.article.headline,
    description: copy.article.description,
    datePublished: "2024-11-01",
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: "Adapt2Life" },
    publisher: {
      "@type": "Organization",
      name: "Adapt2Life",
      logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logo-main.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${pagePath}` },
    image: `${siteUrl}/brand/og-image.jpg`,
  };
};

const buildBreadcrumbJsonLd = (locale: Locale, copy: SmartCoachCopy) => {
  const localePath = locale === "fr" ? "" : `/en`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumb.home, item: `${siteUrl}${localePath || "/"}` },
      { "@type": "ListItem", position: 2, name: copy.breadcrumb.features, item: `${siteUrl}${localePath}/features` },
      { "@type": "ListItem", position: 3, name: copy.breadcrumb.current, item: `${siteUrl}${localePath}${basePath}` },
    ],
  };
};

const buildFaqJsonLd = (copy: SmartCoachCopy) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: copy.faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

export function SmartCoachPage({ locale }: SmartCoachPageProps) {
  const copy = SMART_COACH_COPY[locale] ?? SMART_COACH_COPY.fr;
  const articleJsonLd = buildArticleJsonLd(locale, copy);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, copy);
  const faqJsonLd = buildFaqJsonLd(copy);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 text-foreground">
      <section className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.5em] text-primary/80">{copy.heroTag}</p>
          <h1 className="text-4xl font-heading leading-tight md:text-5xl">{copy.heroTitle}</h1>
          <p className="text-base text-muted-foreground">{copy.heroDescription}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href={localizeHref(locale, copy.heroPrimaryAction.href)}>{copy.heroPrimaryAction.label}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href={localizeHref(locale, copy.heroSecondaryAction.href)}>{copy.heroSecondaryAction.label}</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <Image
            src="/brand/main-visual.jpg"
            alt={copy.heroImageAlt}
            width={640}
            height={420}
            priority
            className="w-full rounded-3xl border border-white/10 object-cover"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {copy.heroStats.map((stat) => (
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
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.whyTag}</p>
          <h2 className="mt-2 text-3xl font-heading">{copy.whyTitle}</h2>
          <p className="text-base text-muted-foreground">{copy.whyDescription}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {copy.benefits.map((benefit) => (
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
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.methodologyTag}</p>
          <h2 className="mt-2 text-3xl font-heading">{copy.methodologyTitle}</h2>
          <p className="text-base text-muted-foreground">{copy.methodologyDescription}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {copy.steps.map((step) => (
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
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.useCaseTag}</p>
          <h2 className="mt-2 text-3xl font-heading">{copy.useCaseTitle}</h2>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {copy.useCases.map((useCase) => (
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
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.comparisonTag}</p>
          <h2 className="text-3xl font-heading">{copy.comparisonTitle}</h2>
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
              {copy.comparisonRows.map((row) => (
                <tr key={row.criterion} className="border-t border-white/10">
                  <td className="p-3 font-semibold text-foreground">{row.criterion}</td>
                  <td className="p-3 text-primary">{row.adapt2life}</td>
                  <td className="p-3 text-muted-foreground">{row.generic}</td>
                  <td className="p-3 text-muted-foreground">{row.coach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.resourcesTag}</p>
          <h2 className="mt-2 text-3xl font-heading">{copy.resourcesTitle}</h2>
          <p className="text-base text-muted-foreground">{copy.resourcesDescription}</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {copy.resources.map((resource) => (
            <Card key={resource.href} className="border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle>{resource.label}</CardTitle>
                <CardDescription>
                  <Link href={localizeHref(locale, resource.href)} className="font-semibold text-primary hover:underline">
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
          <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.faqTag}</p>
          <h2 className="mt-2 text-3xl font-heading">{copy.faqTitle}</h2>
        </header>
        <div className="space-y-3">
          {copy.faqItems.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-white/10 bg-card/80 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading text-foreground">
                {faq.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {copy.faqMore.beforeLink}{" "}
          <Link href={localizeHref(locale, "/faq")} className="text-primary hover:underline">
            {copy.faqMore.linkLabel}
          </Link>{" "}
          {copy.faqMore.afterLink}
        </p>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.45em] text-primary/80">{copy.actionTag}</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-heading text-foreground">{copy.actionTitle}</h2>
            <p className="text-base text-muted-foreground">{copy.actionDescription}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href={localizeHref(locale, copy.actionPrimary.href)}>{copy.actionPrimary.label}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href={localizeHref(locale, copy.actionSecondary.href)}>{copy.actionSecondary.label}</Link>
            </Button>
          </div>
        </div>
      </section>

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
