import Link from "next/link";
import type { Metadata } from "next";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

type BlogCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  empty: string;
  badge: string;
  readMore: string;
};

const BLOG_COPY: Record<Locale, BlogCopy> = {
  fr: {
    heroTag: "Blog Adapt2Life",
    heroTitle: "Progresser avec une vie bien remplie",
    heroDescription:
      "Analyses, méthodes concrètes et retours d’expérience pour concilier entraînement exigeant, travail et vie de famille.",
    empty: "Aucun article disponible pour le moment.",
    badge: "Actualités & coaching",
    readMore: "Lire l’article",
  },
  en: {
    heroTag: "Adapt2Life Blog",
    heroTitle: "Train hard, live fully",
    heroDescription:
      "Actionable training advice, mindset shifts, and Garmin insights for athletes balancing performance with real life.",
    empty: "No article available yet.",
    badge: "Updates & coaching",
    readMore: "Read article",
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

const resolveLangFromLocale = (locale: Locale): Locale => (locale === "fr" ? "fr" : "en");

const formatPublishedDate = (value: Date | null, locale: Locale): string | null => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(value);
  } catch {
    return null;
  }
};

export async function BlogPage({ locale }: BlogPageProps) {
  const copy = BLOG_COPY[locale] ?? BLOG_COPY.fr;
  const lang = resolveLangFromLocale(locale);

  const articles = (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        heroImage: posts.heroImage,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.lang, lang))
      .orderBy(desc(posts.publishedAt))
  ).map((entry) => ({
    ...entry,
    publishedAt: entry.publishedAt ?? null,
  }));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">{copy.heroTitle}</h1>
        <p className="text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-card/80 px-6 py-12 text-center text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => {
            const formattedDate = formatPublishedDate(article.publishedAt, locale);
            const href = buildLocalePath(locale, `/blog/${article.slug}`);

            return (
              <article
                key={article.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] transition hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary/80">
                  <span>{copy.badge}</span>
                  {formattedDate ? (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="tracking-normal">{formattedDate}</span>
                    </>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-foreground">{article.title}</h2>
                  <p className="text-base text-muted-foreground">{article.excerpt}</p>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-primary">
                  <Link href={href} className="inline-flex items-center gap-2 transition hover:text-primary/80">
                    {copy.readMore} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
