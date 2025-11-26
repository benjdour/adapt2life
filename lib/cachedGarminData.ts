import { unstable_cache } from "next/cache";

import { fetchGarminData } from "@/lib/garminData";

const garminDataCache = unstable_cache(
  async (userId: number, gender: string | null) => fetchGarminData(userId, { gender }),
  ["garmin-data-cache"],
  {
    revalidate: 120,
    tags: ["garmin-data"],
  },
);

type GarminDataCacheOptions = {
  gender?: string | null;
};

export const getCachedGarminData = async (userId: number, options: GarminDataCacheOptions = {}) => {
  return garminDataCache(userId, options.gender ?? null);
};
