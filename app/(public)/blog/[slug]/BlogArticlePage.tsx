import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { Metadata } from "next";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

const copyByLocale: Record<
  Locale,
  {
    badge: string;
    backLabel: string;
    heroImageAlt: string;
    readingTime: (minutes: number) => string;
  }
> = {
  fr: {
    badge: "Blog · Entraînement & IA",
    backLabel: "⬅ Retour au blog",
    heroImageAlt: "Image d’illustration de l’article",
    readingTime: (minutes) => `~${minutes} min de lecture`,
  },
  en: {
    badge: "Blog · Training & AI",
    backLabel: "⬅ Back to the blog",
    heroImageAlt: "Article hero image",
    readingTime: (minutes) => `~${minutes} min read`,
  },
};

const markdownComponents: Components = {
  h1: ({ node: _node, ...props }) => <h1 className="text-3xl font-bold text-foreground" {...props} />,
  h2: ({ node: _node, ...props }) => <h2 className="mt-10 text-2xl font-semibold text-foreground" {...props} />,
  h3: ({ node: _node, ...props }) => <h3 className="mt-8 text-xl font-semibold text-foreground" {...props} />,
  p: ({ node: _node, ...props }) => <p className="text-base leading-relaxed text-muted-foreground" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="list-disc space-y-2 pl-6 text-muted-foreground" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="list-decimal space-y-2 pl-6 text-muted-foreground" {...props} />,
  li: ({ node: _node, ...props }) => <li {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="border-l-4 border-primary/60 pl-4 italic text-foreground" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a className="font-semibold text-primary underline decoration-primary/60 hover:decoration-primary" {...props} />
  ),
  code: ({ node: _node, inline, ...props }) =>
    inline ? (
      <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm text-foreground" {...props} />
    ) : (
      <code className="block w-full rounded-xl bg-black/40 p-4 text-sm leading-relaxed text-foreground" {...props} />
    ),
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

const estimateReadingTime = (markdown: string): number => {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
};

export async function getBlogArticleMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const lang = resolveLangFromLocale(locale);
  const article = await db
    .select({ title: posts.title, excerpt: posts.excerpt })
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.lang, lang)))
    .limit(1);

  if (!article[0]) {
    return {};
  }

  const base = siteUrlForLocale(locale);
  return {
    title: `${article[0].title} — Adapt2Life`,
    description: article[0].excerpt,
    alternates: {
      canonical: `${base}/blog/${slug}`,
    },
  };
}

const siteUrlForLocale = (locale: Locale) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
  if (locale === "fr") {
    return siteUrl;
  }
  return `${siteUrl}/${locale}`;
};

type BlogArticlePageProps = {
  locale: Locale;
  slug: string;
};

export async function BlogArticlePage({ locale, slug }: BlogArticlePageProps) {
  const lang = resolveLangFromLocale(locale);
  const copy = copyByLocale[locale] ?? copyByLocale.fr;

  const entry = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      heroImage: posts.heroImage,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.lang, lang)))
    .limit(1);

  const article = entry[0];
  if (!article) {
    notFound();
  }

  const publishedDate = formatPublishedDate(article.publishedAt ?? null, locale);
  const readingMinutes = estimateReadingTime(article.content);

  return (
    <article className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <Link
        href={buildLocalePath(locale, "/blog")}
        className="inline-flex items-center text-sm font-semibold text-primary transition hover:text-primary/80"
      >
        {copy.backLabel}
      </Link>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-card/40 p-8 shadow-[0_25px_45px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{copy.badge}</p>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">{article.title}</h1>
          <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {publishedDate ? <span>{publishedDate}</span> : null}
          <span>{copy.readingTime(readingMinutes)}</span>
        </div>
        {article.heroImage ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <Image
              src={article.heroImage}
              alt={copy.heroImageAlt}
              width={1280}
              height={640}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <ReactMarkdown components={markdownComponents}>{article.content}</ReactMarkdown>
      </section>
    </article>
  );
}
