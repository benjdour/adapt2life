import type { Metadata } from "next";

import { BlogPage, getBlogMetadata } from "@/app/(public)/blog/BlogPage";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return getBlogMetadata(locale);
}

export default async function LocaleBlogRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return <BlogPage locale={locale} />;
}
