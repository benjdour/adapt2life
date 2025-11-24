import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";

import { enforceRateLimit } from "@/lib/security/rateLimiter";

type RoutePolicy = {
  pattern: RegExp;
  allowedRoles?: string[];
};

const stackMiddlewareApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
    return NextResponse.next();
  }

  const user = await stackMiddlewareApp.getUser({ or: "return-null", tokenStore: request });

  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = buildRedirectUrl(request, "/handler/sign-in");
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("redirect", returnTo || "/");
    return NextResponse.redirect(signInUrl);
  }

  if (policy.allowedRoles && policy.allowedRoles.length > 0) {
    const userRoles = extractUserRoles(user);
    const isAuthorized = policy.allowedRoles.some((role) => userRoles.includes(role));
    if (!isAuthorized) {
      return NextResponse.redirect(buildRedirectUrl(request, FORBIDDEN_REDIRECT));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/secure/:path*", "/generateur-entrainement", "/garmin-trainer/:path*", "/integrations/garmin", "/api/:path*"],
};
