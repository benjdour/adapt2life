import type { Metadata } from "next";

import { FaqPage, getFaqMetadata } from "@/app/(public)/faq/FaqPage";
import { Locale } from "@/lib/i18n/locales";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";

type PageParams = { locale: string };

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return getFaqMetadata(locale);
}

export default async function LocaleFaqRoute({ params }: { params: Promise<PageParams> }) {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return <FaqPage locale={locale} />;
}
