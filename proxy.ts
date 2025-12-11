import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { stackServerApp } from "@/stack/server";
import { AFTER_AUTH_RETURN_QUERY_PARAM, deriveLocaleFromPathname, stripLocaleFromPath } from "@/lib/i18n/routing";
import { LOCALE_HEADER_NAME } from "@/lib/i18n/constants";
import { DEFAULT_LOCALE, type Locale, isLocale } from "@/lib/i18n/locales";

type RoutePolicy = {
  pattern: RegExp;
  allowedRoles?: string[];
};

const PROTECTED_ROUTE_POLICIES: RoutePolicy[] = [
  { pattern: /^\/secure(?:\/|$)/ },
  { pattern: /^\/generateur-entrainement(?:\/|$)/ },
  { pattern: /^\/garmin-trainer(?:\/|$)/ },
  { pattern: /^\/integrations\/garmin(?:\/|$)/ },
];

const PUBLIC_API_PATTERNS = [
  /^\/api\/contact(?:\/|$)/,
  /^\/api\/garmin\/webhooks(?:\/|$)/,
  /^\/api\/garmin\/callback(?:\/|$)/,
  /^\/api\/cron\/garmin\/women-health\/pull(?:\/|$)/,
];

const FORBIDDEN_REDIRECT = "/?auth=unauthorized";
const LOCALE_COOKIE_NAME = "adapt2life-locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const coerceRoleList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

const extractUserRoles = (user: unknown): string[] => {
  if (!user || typeof user !== "object") return [];
  const record = user as Record<string, unknown>;
  const sources: unknown[] = [
    record.roles,
    record.role,
    record.clientMetadata && typeof record.clientMetadata === "object"
      ? (record.clientMetadata as Record<string, unknown>).roles
      : undefined,
    record.clientReadOnlyMetadata && typeof record.clientReadOnlyMetadata === "object"
      ? (record.clientReadOnlyMetadata as Record<string, unknown>).roles
      : undefined,
    record.serverMetadata && typeof record.serverMetadata === "object"
      ? (record.serverMetadata as Record<string, unknown>).roles
      : undefined,
  ];

  const uniqueRoles = new Set<string>();
  for (const source of sources) {
    for (const role of coerceRoleList(source)) {
      uniqueRoles.add(role);
    }
  }
  return [...uniqueRoles];
};

const findRoutePolicy = (pathname: string): RoutePolicy | undefined =>
  PROTECTED_ROUTE_POLICIES.find((policy) => policy.pattern.test(pathname));

const buildRedirectUrl = (request: NextRequest, basePath: string) => new URL(basePath, request.url);

const isPublicApiRoute = (pathname: string) => PUBLIC_API_PATTERNS.some((pattern) => pattern.test(pathname));

const decodeRedirectLocale = (raw: string | null): Locale | null => {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const locale = deriveLocaleFromPathname(decoded);
    return locale !== DEFAULT_LOCALE ? locale : null;
  } catch {
    const locale = deriveLocaleFromPathname(raw);
    return locale !== DEFAULT_LOCALE ? locale : null;
  }
};

const resolveRequestLocale = (request: NextRequest, pathname: string): Locale => {
  const localeFromPath = deriveLocaleFromPathname(pathname);
  if (localeFromPath !== DEFAULT_LOCALE) {
    return localeFromPath;
  }
  const queryLocale = request.nextUrl.searchParams.get("locale");
  if (queryLocale && isLocale(queryLocale)) {
    return queryLocale;
  }
  const redirectLocale = decodeRedirectLocale(request.nextUrl.searchParams.get("redirect"));
  if (redirectLocale) {
    return redirectLocale;
  }
  return DEFAULT_LOCALE;
};

const applyLocaleHeaders = (request: NextRequest, locale: Locale) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, locale);
  requestHeaders.set("accept-language", locale);
  return requestHeaders;
};

const forwardWithLocale = (request: NextRequest, locale: Locale) => {
  const response = NextResponse.next({ request: { headers: applyLocaleHeaders(request, locale) } });
  response.headers.set(LOCALE_HEADER_NAME, locale);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE });
  return response;
};

const attachLocale = (response: NextResponse, locale: Locale) => {
  response.headers.set(LOCALE_HEADER_NAME, locale);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE });
  return response;
};

export default async function proxy(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const locale = resolveRequestLocale(request, originalPathname);
  const pathname = stripLocaleFromPath(originalPathname);
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) {
    const rateLimitResponse = await enforceRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  let policy = findRoutePolicy(pathname);
  if (!policy && isApiRoute && !isPublicApiRoute(pathname)) {
    policy = { pattern: /^\/api\// };
  }

  if (!policy) {
    return forwardWithLocale(request, locale);
  }

  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: request });

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = buildRedirectUrl(request, "/handler/sign-in");
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("locale", locale);
    signInUrl.searchParams.set(AFTER_AUTH_RETURN_QUERY_PARAM, returnTo || "/");
    const response = NextResponse.redirect(signInUrl);
    return attachLocale(response, locale);
  }

  if (policy.allowedRoles && policy.allowedRoles.length > 0) {
    const userRoles = extractUserRoles(user);
    const isAuthorized = policy.allowedRoles.some((role) => userRoles.includes(role));
    if (!isAuthorized) {
      const redirectResponse = NextResponse.redirect(buildRedirectUrl(request, FORBIDDEN_REDIRECT));
      return attachLocale(redirectResponse, locale);
    }
  }

  return forwardWithLocale(request, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
