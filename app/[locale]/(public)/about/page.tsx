import type { Metadata } from "next";

import { AboutPage, getAboutMetadata } from "@/app/(public)/about/AboutPage";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocaleFromParams(params);
  return getAboutMetadata(locale as Locale);
}

export default async function LocaleAboutRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  return <AboutPage locale={locale} />;
}
