import { HomeRoute } from "@/app/(app)/home/HomeRoute";
import { buildStaticLocaleParams, resolveLocaleFromParams } from "@/lib/i18n/routing";

type PageParams = { locale: string };

export function generateStaticParams() {
  return buildStaticLocaleParams();
}

export default async function LocaleHomePage({ params }: { params: Promise<PageParams> }) {
  const locale = await resolveLocaleFromParams(params);
  return <HomeRoute locale={locale} />;
}
