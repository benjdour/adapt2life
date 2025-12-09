import type { Metadata } from "next";

import { HowItWorksPage, getHowItWorksMetadata } from "@/app/(public)/how-it-works/HowItWorksPage";
import { Locale } from "@/lib/i18n/locales";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";

type PageParams = { locale: string };

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return getHowItWorksMetadata(locale);
}

export default async function LocaleHowItWorksRoute({ params }: { params: Promise<PageParams> }) {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return <HowItWorksPage locale={locale} />;
}
