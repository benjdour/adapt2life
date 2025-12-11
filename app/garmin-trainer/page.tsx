import { redirect } from "next/navigation";

import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";

export default async function GarminTrainerPage() {
  const locale = await getRequestLocale();
  const generatorPath = buildLocalePath(locale, "/generateur-entrainement");
  redirect(`${generatorPath}#garmin`);
}
