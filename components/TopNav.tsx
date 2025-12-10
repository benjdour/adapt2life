"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { NavigationConfig, getNavigationConfig } from "@/lib/i18n/navigation";
import { buildLocalePath, deriveLocaleFromPathname, stripLocaleFromPath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

type TopNavProps = {
  isAuthenticated: boolean;
  showAdminLink?: boolean;
  navigation: NavigationConfig;
  locale: Locale;
};

const buildAuthenticatedLinks = (navigation: NavigationConfig, locale: Locale, showAdminLink: boolean) => {
  const links = [...navigation.authenticatedLinks];
  if (showAdminLink) {
    links.push({ label: "Admin", href: buildLocalePath(locale, "/admin") });
  }
  return links;
};

const buildLanguageToggleHref = (
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
    localizedPath = buildLocalePath(targetLocale, basePath);
    params.delete("locale");
  }
  const queryString = params.toString();
  return queryString ? `${localizedPath}?${queryString}` : localizedPath;
};

export const TopNav = ({ isAuthenticated, showAdminLink = false, navigation, locale }: TopNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? null;
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [currentNavigation, setCurrentNavigation] = useState<NavigationConfig>(navigation);

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  useEffect(() => {
    setCurrentNavigation(navigation);
  }, [navigation]);

  useEffect(() => {
    const derivedLocale = pathname ? deriveLocaleFromPathname(pathname) : locale;
    if (!derivedLocale) {
      return;
    }
    if (derivedLocale !== currentLocale) {
      setCurrentLocale(derivedLocale);
      setCurrentNavigation(getNavigationConfig(derivedLocale));
    }
  }, [pathname, currentLocale, locale, searchString]);

  const links = useMemo(() => {
    return isAuthenticated ? buildAuthenticatedLinks(currentNavigation, currentLocale, showAdminLink) : currentNavigation.guestLinks;
  }, [isAuthenticated, currentNavigation, currentLocale, showAdminLink]);

  const languageToggleHref = buildLanguageToggleHref(
    currentNavigation.languageToggle.targetLocale,
    currentNavigation.languageToggle.fallbackHref,
    pathname,
    searchString,
  );

  const handleSignOut = () => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/handler/sign-out";

    const redirectInput = document.createElement("input");
    redirectInput.type = "hidden";
    redirectInput.name = "redirect";
    redirectInput.value = currentNavigation.signOutRedirect;
    form.appendChild(redirectInput);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={currentNavigation.logoHref} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Image src="/brand/logo-main.png" alt="Adapt2Life" width={36} height={36} className="h-9 w-9 rounded-full" />
          <span>Adapt2Life</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 transition hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" className="border border-white/10">
            <Link href={languageToggleHref} title={currentNavigation.languageToggle.title} aria-label={currentNavigation.languageToggle.title}>
              {currentNavigation.languageToggle.label}
            </Link>
          </Button>
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleSignOut}>
              {currentNavigation.signOutLabel}
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href={currentNavigation.signInHref}>{currentNavigation.signInLabel}</Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={navigation.menuToggleAriaLabel}
        >
          <span className="sr-only">{navigation.menuLabel}</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={cn("border-t border-white/10 bg-background/95 md:hidden", isOpen ? "block" : "hidden")}
      >
        <div className="space-y-4 px-4 py-6 text-sm text-muted-foreground">
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
          <Button
            asChild
            variant="ghost"
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            <Link href={languageToggleHref} title={currentNavigation.languageToggle.title}>
              {currentNavigation.languageToggle.label}
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
              >
                {currentNavigation.signOutLabel}
              </Button>
            ) : (
              <Button
                asChild
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                <Link href={currentNavigation.signInHref}>{currentNavigation.signInLabel}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
