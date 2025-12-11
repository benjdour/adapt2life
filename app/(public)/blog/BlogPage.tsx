import type { Metadata } from "next";

import { Locale } from "@/lib/i18n/locales";

type BlogArticle = {
  title: string;
  excerpt: string;
  badge: string;
  href: string;
};

type BlogCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  comingSoon: string;
  articlesTitle: string;
  articlesDescription: string;
  articles: BlogArticle[];
};

const BLOG_COPY: Record<Locale, BlogCopy> = {
  fr: {
    heroTag: "Blog Adapt2Life",
    heroTitle: "Progresser avec une vie bien remplie",
    heroDescription:
      "Analyses, méthodes concrètes et retours d’expérience pour concilier entraînement exigeant, travail et vie de famille. Un nouvel article est publié chaque semaine.",
    comingSoon: "Prochaines publications à découvrir dès maintenant 👇",
    articlesTitle: "Derniers articles",
    articlesDescription: "Sélection d’articles pour t’aider à structurer tes séances et préserver ton énergie.",
    articles: [
      {
        title: "Structurer une semaine d’entraînement quand on manque de temps",
        excerpt: "3 formats de micro-cycles conçus pour les athlètes qui jonglent entre déplacements, réunions et obligations familiales.",
        badge: "Planification",
        href: "/blog/manque-de-temps",
      },
      {
        title: "L’énergie avant tout : comment adapter ta séance à ton state of readiness",
        excerpt:
          "Un guide pratique pour traduire les métriques Garmin (Sommeil, Body Battery, HRV) en décisions immédiates sur ton entraînement du jour.",
        badge: "Garmin & récupération",
        href: "/blog/energie-state-of-readiness",
      },
      {
        title: "Préparer un Ironman 70.3 avec 6 à 8 heures par semaine",
        excerpt:
          "Retour d’expérience : plan type, blocs clés et marqueurs de progression pour viser un 70.3 sans dépasser 8h hebdomadaires.",
        badge: "Triathlon",
        href: "/blog/plan-70-3",
      },
    ],
  },
  en: {
    heroTag: "Adapt2Life Blog",
    heroTitle: "Train hard, live fully",
    heroDescription:
      "Actionable training advice, mindset shifts, and Garmin insights for athletes who balance performance with real life. New stories every week.",
    comingSoon: "A glimpse at what’s coming next 👇",
    articlesTitle: "Latest articles",
    articlesDescription: "Hand-picked stories to help you structure your sessions and protect your energy.",
    articles: [
      {
        title: "Designing a realistic training week when time is scarce",
        excerpt:
          "Three micro-cycle formats for athletes juggling commuting, meetings, parenting, and endurance ambitions.",
        badge: "Planning",
        href: "/en/blog/time-crunched-week",
      },
      {
        title: "Energy first: translating your readiness into smarter sessions",
        excerpt:
          "A practical framework to turn Garmin metrics (Sleep, Body Battery, HRV) into immediate decisions for today’s workout.",
        badge: "Garmin & recovery",
        href: "/en/blog/energy-first",
      },
      {
        title: "Chasing a 70.3 on 6–8 hours per week",
        excerpt:
          "Case study: sample block, key workouts, and progress markers for targeting a 70.3 without exceeding 8 hours weekly.",
        badge: "Triathlon",
        href: "/en/blog/70-3-blueprint",
      },
    ],
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

export const blogMetadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Blog — Adapt2Life",
    description: "Méthodes concrètes, analyses Garmin et retours d’expérience pour concilier entraînement et vie réelle.",
    alternates: { canonical: `${siteUrl}/blog` },
  },
  en: {
    title: "Blog — Adapt2Life",
    description: "Actionable insights and training stories for real-life endurance athletes.",
    alternates: { canonical: `${siteUrl}/en/blog` },
  },
};

export const getBlogMetadata = (locale: Locale): Metadata => blogMetadataByLocale[locale] ?? blogMetadataByLocale.fr;

type BlogPageProps = {
  locale: Locale;
};

export function BlogPage({ locale }: BlogPageProps) {
  const copy = BLOG_COPY[locale] ?? BLOG_COPY.fr;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <section className="space-y-3 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">{copy.heroTitle}</h1>
        <p className="text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
        <p className="text-sm text-primary/80">{copy.comingSoon}</p>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{copy.articlesTitle}</p>
            <h2 className="text-2xl font-heading">{copy.articlesDescription}</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {copy.articles.map((article) => (
            <article key={article.href} className="space-y-3 rounded-2xl border border-white/10 bg-background/40 p-5 shadow-sm">
              <span className="inline-flex items-center rounded-full border border-primary/30 px-3 py-1 text-xs uppercase tracking-wide text-primary">
                {article.badge}
              </span>
              <h3 className="text-xl font-semibold text-foreground">{article.title}</h3>
              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              <a href={article.href} className="text-sm font-semibold text-primary transition hover:underline">
                {locale === "en" ? "Read article" : "Lire l’article"}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
