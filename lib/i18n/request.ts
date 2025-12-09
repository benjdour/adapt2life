import { headers } from "next/headers";

import { DEFAULT_LOCALE, Locale, isLocale } from "./locales";

export const LOCALE_HEADER_NAME = "x-adapt2life-locale";

export const getRequestLocale = async (): Promise<Locale> => {
  const headerList = await headers();
  const locale = headerList.get(LOCALE_HEADER_NAME);
  if (locale && isLocale(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
};
