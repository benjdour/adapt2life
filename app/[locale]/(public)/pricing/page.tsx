import type { Metadata } from "next";

import { PricingPage, getPricingMetadata } from "@/app/(public)/pricing/PricingPage";
import { Locale } from "@/lib/i18n/locales";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";

export const dynamic = "force-dynamic";

type PageParams = { locale: string };
type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return getPricingMetadata(locale);
}

export default async function LocalePricingRoute({ params, searchParams }: PageProps) {
  const locale = (await resolveLocaleFromParams(params)) as Locale;
  return <PricingPage locale={locale} searchParams={searchParams} />;
}
