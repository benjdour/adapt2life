import { buildLocalePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import { translateLegalPath } from "@/lib/legal/content";
import type { Locale } from "@/lib/i18n/locales";

export const buildLanguageToggleHref = (
  targetLocale: Locale,
  fallbackHref: string,
  pathname: string | null,
  search: string | null,
) => {
  if (!pathname) return fallbackHref;
  const basePath = stripLocaleFromPath(pathname) || "/";
  const params = new URLSearchParams(search ?? "");
  let localizedPath: string;
  if (basePath === "/handler/sign-in") {
    localizedPath = "/handler/sign-in";
    params.set("locale", targetLocale);
  } else {
    const translated = translateLegalPath(basePath, targetLocale);
    const effectivePath = translated ?? basePath;
    localizedPath = buildLocalePath(targetLocale, effectivePath);
    params.delete("locale");
  }
  const queryString = params.toString();
  return queryString ? `${localizedPath}?${queryString}` : localizedPath;
};
