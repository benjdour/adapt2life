import type { Metadata } from "next";

import { ContactPage, getContactMetadata } from "@/app/(public)/contact/ContactPage";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocaleFromParams(params);
  return getContactMetadata(locale as Locale);
}

export default async function LocaleContactRoute({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  return <ContactPage locale={locale} />;
}
