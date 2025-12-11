"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { NavigationConfig, getNavigationConfig } from "@/lib/i18n/navigation";
import { deriveLocaleFromPathname } from "@/lib/i18n/routing";
import { DEFAULT_LOCALE, Locale, isLocale } from "@/lib/i18n/locales";
import { buildLanguageToggleHref } from "@/lib/i18n/languageToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? null;
  const [currentLocale, setCurrentLocale] = useState<Locale>(() =>
    pathname ? deriveLocaleFromPathname(pathname) : DEFAULT_LOCALE,
  );
  const [currentNavigation, setCurrentNavigation] = useState<NavigationConfig>(navigation);

  useEffect(() => {
    setCurrentNavigation(navigation);
  }, [navigation]);

  useEffect(() => {
    const derived = pathname ? deriveLocaleFromPathname(pathname) : null;
    const searchLocale = searchParams?.get("locale");
    const nextLocale = (searchLocale && isLocale(searchLocale) ? searchLocale : derived) ?? currentLocale;
    if (nextLocale !== currentLocale) {
      setCurrentLocale(nextLocale);
      setCurrentNavigation(getNavigationConfig(nextLocale));
    }
  }, [pathname, currentLocale, navigation, searchParams]);

  const languageToggleHref = buildLanguageToggleHref(
    currentNavigation.languageToggle.targetLocale,
    currentNavigation.languageToggle.fallbackHref,
    pathname,
    searchString,
  );

  const footer = currentNavigation.footer;
  const languageOptions = useMemo(
    () =>
      [
        { locale: "fr" as Locale, label: "Français", flag: "🇫🇷" },
        { locale: "en" as Locale, label: "English", flag: "🇺🇸" },
      ] satisfies Array<{ locale: Locale; label: string; flag: string }>,
    [],
  );
  const selectedLanguage = languageOptions.find((option) => option.locale === currentLocale) ?? languageOptions[0];
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
          <div className="pt-4">
            <Select
              value={selectedLanguage.locale}
              onValueChange={(value) => {
                const target = languageOptions.find((option) => option.locale === value);
                if (!target) return;
                window.location.href = buildLanguageToggleHref(
                  target.locale,
                  currentNavigation.languageToggle.fallbackHref,
                  pathname,
                  searchString,
                );
              }}
            >
              <SelectTrigger className="w-auto border-white/15 bg-card/40 text-foreground">
                <SelectValue
                  aria-label={currentNavigation.languageToggle.title}
                  placeholder={selectedLanguage.label}
                  className="flex items-center gap-2"
                >
                  <span className="mr-2 text-lg">{selectedLanguage.flag}</span>
                  {selectedLanguage.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.locale} value={option.locale}>
                    <span className="mr-2 text-lg">{option.flag}</span>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground/70">{footer.copyright}</div>
    </footer>
  );
};
