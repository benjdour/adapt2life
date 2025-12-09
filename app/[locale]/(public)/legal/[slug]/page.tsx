import type { Metadata } from "next";

import {
  LegalPage,
  ensureLegalSlug,
  getLegalMetadata,
  localeLegalStaticParams,
} from "@/app/(public)/legal/LegalPage";
import { LOCALES, Locale } from "@/lib/i18n/locales";
import { resolveLocale } from "@/lib/i18n/routing";

type PageParams = { locale: string; slug: string };

export function generateStaticParams() {
  return localeLegalStaticParams(LOCALES);
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved.locale);
  const slug = ensureLegalSlug(resolved.slug);
  return getLegalMetadata(locale as Locale, slug);
}

export default async function LocaleLegalRoute({ params }: { params: Promise<PageParams> }) {
  const resolved = await params;
  const locale = resolveLocale(resolved.locale);
  const slug = ensureLegalSlug(resolved.slug);
  return <LegalPage locale={locale as Locale} slug={slug} />;
}
