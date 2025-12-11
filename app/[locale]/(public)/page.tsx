import { HomePage } from "@/app/(public)/home/HomePage";
import { buildStaticLocaleParams, LocaleParam, resolveLocaleFromParams } from "@/lib/i18n/routing";

export function generateStaticParams(): LocaleParam[] {
  return buildStaticLocaleParams();
}

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  return <HomePage locale={locale} />;
}
