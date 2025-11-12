import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";

import { enforceRateLimit } from "@/lib/security/rateLimiter";

const stackMiddlewareApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});

const PROTECTED_PATHS = [/^\/secure(?:\/|$)/, /^\/generateur-entrainement(?:\/|$)/, /^\/garmin-trainer(?:\/|$)/, /^\/integrations\/garmin(?:\/|$)/];

const isProtected = (pathname: string) => PROTECTED_PATHS.some((pattern) => pattern.test(pathname));

const redirectToSignIn = (request: NextRequest) => {
  const signInUrl = new URL("/handler/sign-in", request.url);
  signInUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}` || "/");
  return NextResponse.redirect(signInUrl);
};

export async function proxy(request: NextRequest) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!isProtected(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const user = await stackMiddlewareApp.getUser({ or: "return-null", tokenStore: request });
  if (!user) {
    return redirectToSignIn(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/secure/:path*", "/generateur-entrainement", "/garmin-trainer/:path*", "/integrations/garmin", "/api/:path*"],
};
