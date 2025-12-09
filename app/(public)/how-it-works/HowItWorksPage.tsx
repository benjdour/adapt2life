import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath } from "@/lib/i18n/routing";

type Step = {
  title: string;
  description: string;
  image: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type HowItWorksCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  steps: Step[];
  ctaTag: string;
  ctaTitle: string;
  ctaDescription: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  faqTag: string;
  faqTitle: string;
  faqItems: FaqItem[];
};

const sharedSteps: Step[] = [
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

const sharedFaqItems: FaqItem[] = [
  {
    question: "Combien de temps prend la génération d’un entraînement ?",
    answer:
      "Quelques secondes pour un plan standard. Les conversions Garmin plus complexes peuvent atteindre 1 à 2 minutes selon la charge.",
  },
  {
    question: "Puis-je regénérer ou modifier la séance avant envoi ?",
    answer:
      "Oui. Tu peux regénérer autant que nécessaire, ajuster les blocs ou les intensités avant d’envoyer la version finale dans Garmin Connect.",
  },
  {
    question: "Que se passe-t-il si ma montre ou Garmin n’est pas disponible ?",
    answer:
      "Tu peux conserver la séance en version texte, la reprendre plus tard et l’envoyer quand tu es prêt. L’IA gardera ton brief pour proposer une alternative.",
  },
];

const sharedCopy: HowItWorksCopy = {
  heroTag: "Comment ça marche",
  heroTitle: "Ton plan en 4 étapes simples",
  heroDescription: "Nous combinons ton ressenti, tes données Garmin (Body Battery, VFC, charge) et notre IA pour construire des séances ultra pertinentes.",
  steps: sharedSteps,
  ctaTag: "Passe à l’action",
  ctaTitle: "Envie d’essayer Adapt2Life ?",
  ctaDescription: "Connecte ton compte, génère un plan IA et synchronise-le directement avec Garmin Connect.",
  primaryAction: { label: "Commencer maintenant", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  secondaryAction: { label: "Parler à l’équipe", href: "/contact" },
  faqTag: "Questions fréquentes",
  faqTitle: "Avant de lancer ta première séance",
  faqItems: sharedFaqItems,
};

const HOW_IT_WORKS_COPY: Record<Locale, HowItWorksCopy> = {
  fr: sharedCopy,
  en: sharedCopy,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const basePath = "/how-it-works";

const metadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Comment ça marche — Entraînement personnalisé avec Garmin et IA",
    description:
      "Connecte ta montre Garmin, décris ta forme du jour et laisse l’IA Adapt2Life générer des entraînements personnalisés envoyés automatiquement sur ta montre.",
    alternates: { canonical: `${siteUrl}${basePath}` },
    openGraph: {
      url: `${siteUrl}${basePath}`,
      title: "Comment fonctionne Smart Coach Adapt2Life",
      description: "Découvre les 4 étapes pour connecter Garmin, briefer l’IA et envoyer tes séances personnalisées.",
      type: "website",
    },
  },
  en: {
    title: "How it works — Personalized Garmin + AI training",
    description: "Connect Garmin, describe your day, and let Adapt2Life ship structured workouts directly to your watch.",
    alternates: { canonical: `${siteUrl}/en${basePath}` },
    openGraph: {
      url: `${siteUrl}/en${basePath}`,
      title: "How Adapt2Life Smart Coach works",
      description: "Understand the four steps to plug Garmin data, brief the AI, and push workouts instantly.",
      type: "website",
    },
  },
};

export const getHowItWorksMetadata = (locale: Locale): Metadata => metadataByLocale[locale] ?? metadataByLocale.fr;

type HowItWorksPageProps = {
  locale: Locale;
};

const buildFaqJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

const isAbsolute = (href: string) => /^(https?:)?\/\//.test(href);

const localizeHref = (locale: Locale, href: string) => {
  if (isAbsolute(href)) return href;
  const [pathname, search] = href.split("?");
  const localized = buildLocalePath(locale, pathname);
  return search ? `${localized}?${search}` : localized;
};

export function HowItWorksPage({ locale }: HowItWorksPageProps) {
  const copy = HOW_IT_WORKS_COPY[locale] ?? HOW_IT_WORKS_COPY.fr;
  const faqJsonLd = buildFaqJsonLd(copy.faqItems);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading">{copy.heroTitle}</h1>
        <p className="text-base text-muted-foreground">{copy.heroDescription}</p>
      </header>

      <ol className="space-y-6">
        {copy.steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg md:flex-row">
            <div className="space-y-2 md:w-2/3">
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                Étape {index + 1}
              </p>
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
        <p className="text-sm uppercase tracking-[0.35em] text-primary/80">{copy.ctaTag}</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h2 className="text-3xl font-heading text-foreground">{copy.ctaTitle}</h2>
            <p className="text-base text-muted-foreground">{copy.ctaDescription}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Button asChild size="lg" className="px-8 text-base font-semibold">
              <Link href={localizeHref(locale, copy.primaryAction.href)}>{copy.primaryAction.label}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href={localizeHref(locale, copy.secondaryAction.href)}>{copy.secondaryAction.label}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <p className="text-sm uppercase tracking-[0.35em] text-primary/80">{copy.faqTag}</p>
          <h2 className="text-3xl font-heading">{copy.faqTitle}</h2>
        </header>
        <div className="space-y-3">
          {copy.faqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-white/10 bg-card/80 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading">
                {item.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
