export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const isLocale = (value: string | undefined | null): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
