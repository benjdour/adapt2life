import type { Metadata } from "next";

import { FeaturesPage, getFeaturesMetadata } from "@/app/(public)/features/FeaturesPage";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocaleFromParams(params);
  return getFeaturesMetadata(locale as Locale);
}

export default async function LocaleFeaturesRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  return <FeaturesPage locale={locale} />;
}
