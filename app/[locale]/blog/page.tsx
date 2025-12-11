import Link from "next/link";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { buildLocalePath, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

const copyByLocale: Record<Locale, { title: string; description: string; empty: string; badge: string; readMore: string }> =
  {
    fr: {
      title: "Blog Adapt2Life",
      description: "Nos analyses sur l’entraînement, l’IA et les intégrations sportives.",
      empty: "Aucun article disponible pour le moment.",
      badge: "Actualités & coaching",
      readMore: "Lire l’article",
    },
    en: {
      title: "Adapt2Life Blog",
      description: "Insights about training, AI, and our integrations.",
      empty: "No article available yet.",
      badge: "Updates & coaching",
      readMore: "Read article",
    },
  };

const resolveLangFromLocale = (locale: Locale): Locale => locale === "fr" ? "fr" : "en";

const formatPublishedDate = (value: Date | null, locale: Locale): string | null => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(value);
  } catch {
    return null;
  }
};

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  const lang = resolveLangFromLocale(locale);
  const copy = copyByLocale[locale];

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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.badge}</p>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{copy.title}</h1>
        <p className="text-base text-muted-foreground">{copy.description}</p>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => {
            const formattedDate = formatPublishedDate(article.publishedAt, locale);
            return (
              <Link
                key={article.id}
                href={buildLocalePath(locale, `/blog/${article.slug}`)}
                className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/40 p-6 transition hover:-translate-y-1 hover:bg-card/70"
              >
                <div className="space-y-2">
                  {formattedDate ? <p className="text-xs uppercase tracking-wide text-muted-foreground">{formattedDate}</p> : null}
                  <h2 className="text-2xl font-semibold text-foreground transition group-hover:text-primary">{article.title}</h2>
                  <p className="text-base text-muted-foreground">{article.excerpt}</p>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-primary">
                  <span>{copy.readMore}</span>
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
