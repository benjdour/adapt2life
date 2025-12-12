import { buildLocalePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import { translateLegalPath } from "@/lib/legal/content";
import type { Locale } from "@/lib/i18n/locales";

const resolveBlogTargetPath = (basePath: string, targetLocale: Locale) => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!basePath.startsWith("/blog/")) {
    return null;
  }
  const translations = window.__A2L_BLOG_TRANSLATIONS;
  if (!translations) {
    return null;
  }
  const nextSlug = translations.slugs?.[targetLocale];
  if (!nextSlug) {
    return null;
  }
  return `/blog/${nextSlug}`;
};

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
    const blogOverride = resolveBlogTargetPath(basePath, targetLocale);
    const effectivePath = translated ?? blogOverride ?? basePath;
    localizedPath = buildLocalePath(targetLocale, effectivePath);
    params.delete("locale");
  }
  const queryString = params.toString();
  return queryString ? `${localizedPath}?${queryString}` : localizedPath;
};
