import { unstable_cache } from "next/cache";

import { fetchGarminData } from "@/lib/garminData";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

const garminDataCache = unstable_cache(
  async (userId: number, gender: string | null, locale: Locale) =>
    fetchGarminData(userId, { gender, locale }),
  ["garmin-data-cache"],
  {
    revalidate: 120,
    tags: ["garmin-data"],
  },
);

type GarminDataCacheOptions = {
  gender?: string | null;
  locale?: Locale;
};

export const getCachedGarminData = async (userId: number, options: GarminDataCacheOptions = {}) => {
  const locale = options.locale ?? DEFAULT_LOCALE;
  return garminDataCache(userId, options.gender ?? null, locale);
};
