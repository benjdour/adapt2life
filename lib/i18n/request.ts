import { headers } from "next/headers";

import { DEFAULT_LOCALE, Locale, isLocale } from "./locales";
import { LOCALE_HEADER_NAME } from "./constants";

export const getRequestLocale = async (): Promise<Locale> => {
  const headerList = await headers();
  const locale = headerList.get(LOCALE_HEADER_NAME);
  if (locale && isLocale(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
};
