import type { Metadata } from "next";

import { BlogArticlePage, getBlogArticleMetadata } from "@/app/(public)/blog/[slug]/BlogArticlePage";
import { resolveLocale } from "@/lib/i18n/routing";

type PageParams = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved.locale);
  return getBlogArticleMetadata(locale, resolved.slug);
}

export default async function LocaleBlogArticleRoute({ params }: { params: Promise<PageParams> }) {
  const resolved = await params;
  const locale = resolveLocale(resolved.locale);
  return <BlogArticlePage locale={locale} slug={resolved.slug} />;
}
