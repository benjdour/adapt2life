"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { NavigationConfig, getNavigationConfig } from "@/lib/i18n/navigation";
import { deriveLocaleFromPathname } from "@/lib/i18n/routing";
import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/locales";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="font-heading text-base text-foreground">{title}</p>
    <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
  </div>
);

type FooterProps = {
  navigation: NavigationConfig;
};

export const Footer = ({ navigation }: FooterProps) => {
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<Locale>(() =>
    pathname ? deriveLocaleFromPathname(pathname) : DEFAULT_LOCALE,
  );
  const [currentNavigation, setCurrentNavigation] = useState<NavigationConfig>(navigation);

  useEffect(() => {
    setCurrentNavigation(navigation);
  }, [navigation]);

  useEffect(() => {
    const derived = pathname ? deriveLocaleFromPathname(pathname) : currentLocale;
    if (derived && derived !== currentLocale) {
      setCurrentLocale(derived);
      setCurrentNavigation(getNavigationConfig(derived));
    }
  }, [pathname, currentLocale, navigation]);

  const footer = currentNavigation.footer;
  return (
    <footer className="border-t border-white/10 bg-background/70 py-12 text-sm text-muted-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 md:grid-cols-3">
        <Section title={footer.navigationTitle}>
          <ul className="space-y-2">
            {footer.navigationLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={footer.legalTitle}>
          <ul className="space-y-2">
            {footer.legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={footer.socialTitle}>
          <ul className="space-y-2">
            {footer.socialLinks.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer" className="transition hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground/70">{footer.copyright}</div>
    </footer>
  );
};
