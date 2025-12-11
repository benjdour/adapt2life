import { HomeRoute } from "@/app/(app)/home/HomeRoute";
import { getRequestLocale } from "@/lib/i18n/request";

export default async function RootHomePage() {
  const locale = await getRequestLocale();
  return <HomeRoute locale={locale} />;
}
