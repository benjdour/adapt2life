import { DEFAULT_LOCALE, LOCALES, Locale, isLocale } from "./locales";

const ensureLeadingSlash = (value: string): string => {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
};

export const normalizePath = (path: string): string => {
  if (!path) return "/";
  const normalized = ensureLeadingSlash(path);
  return normalized === "//" ? "/" : normalized;
};

export const stripLocaleFromPath = (path: string): string => {
  const normalized = normalizePath(path);
  const localePattern = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);
  const stripped = normalized.replace(localePattern, "") || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
};

export const buildLocalePath = (locale: Locale, path = "/"): string => {
  const normalized = normalizePath(path);
  if (locale === DEFAULT_LOCALE) {
    return normalized;
  }
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
};

export const resolveLocale = (value: string | undefined | null): Locale =>
  value && isLocale(value) ? value : DEFAULT_LOCALE;

export const deriveLocaleFromPathname = (pathname?: string | null): Locale => {
  if (!pathname) return DEFAULT_LOCALE;
  const normalized = normalizePath(pathname);
  for (const locale of LOCALES) {
    if (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
};

export type AwaitableLocaleParam = Promise<{ locale: string }>;

export const resolveLocaleFromParams = async (params: AwaitableLocaleParam): Promise<Locale> => {
  const resolved = await params;
  return resolveLocale(resolved.locale);
};

export type LocaleParam = { locale: Locale };

export const buildStaticLocaleParams = (): LocaleParam[] =>
  LOCALES.map((locale) => ({ locale }));

const ensureLocaleSearchParam = (path: string, locale: Locale): string => {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }

  try {
    const url = new URL(path, "https://adapt2life.local");

    if (!url.searchParams.has("locale")) {
      url.searchParams.set("locale", locale);
    }

    const pathname = url.pathname || "/";
    const search = url.search ? `?${url.searchParams.toString()}` : "";
    const hash = url.hash ?? "";
    return `${pathname}${search}${hash}`;
  } catch {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}locale=${locale}`;
  }
};

export const buildSignInUrl = (locale: Locale, redirectPath = "/"): string => {
  const redirectTarget = ensureLocaleSearchParam(buildLocalePath(locale, redirectPath), locale);
  return `/handler/sign-in?locale=${locale}&redirect=${encodeURIComponent(redirectTarget)}`;
};
