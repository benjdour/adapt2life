import { unstable_cache } from "next/cache";

import { fetchGarminData } from "@/lib/garminData";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

const GARMIN_CACHE_BASE_KEY = "garmin-data-cache";
const GARMIN_CACHE_TAG = "garmin-data";

type GarminDataCacheOptions = {
  gender?: string | null;
  locale?: Locale;
};

const buildCacheKey = (userId: number, gender: string | null, locale: Locale) => [
  GARMIN_CACHE_BASE_KEY,
  String(userId),
  gender ?? "unknown",
  locale,
];

export const getCachedGarminData = async (userId: number, options: GarminDataCacheOptions = {}) => {
  const gender = options.gender ?? null;
  const locale = options.locale ?? DEFAULT_LOCALE;

  const cachedFetcher = unstable_cache(
    async () => fetchGarminData(userId, { gender, locale }),
    buildCacheKey(userId, gender, locale),
    {
      revalidate: 120,
      tags: [GARMIN_CACHE_TAG, `${GARMIN_CACHE_TAG}-${userId}`],
    },
  );

  return cachedFetcher();
};
