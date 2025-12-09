import type { Metadata } from "next";

import { SmartCoachPage, getSmartCoachMetadata } from "@/app/(public)/features/smart-coach/SmartCoachPage";
import { Locale } from "@/lib/i18n/locales";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";

type PageParams = { locale: string };

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return getSmartCoachMetadata(locale);
}

export default async function LocaleSmartCoachRoute({ params }: { params: Promise<PageParams> }) {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return <SmartCoachPage locale={locale} />;
}
