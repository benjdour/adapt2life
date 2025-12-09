import { DEFAULT_LOCALE, Locale } from "./locales";
import { buildLocalePath } from "./routing";

export type NavLink = {
  label: string;
  href: string;
};

export type LanguageToggle = {
  label: string;
  title: string;
  targetLocale: Locale;
  fallbackHref: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

type NavigationFooter = {
  navigationTitle: string;
  legalTitle: string;
  socialTitle: string;
  navigationLinks: FooterLink[];
  legalLinks: FooterLink[];
  socialLinks: FooterLink[];
  copyright: string;
};

export type NavigationConfig = {
  guestLinks: NavLink[];
  authenticatedLinks: NavLink[];
  signInLabel: string;
  signOutLabel: string;
  signInHref: string;
  signOutRedirect: string;
  languageToggle: LanguageToggle;
  logoHref: string;
  menuToggleAriaLabel: string;
  menuLabel: string;
  footer: NavigationFooter;
};

const buildGuestLinks = (locale: Locale): NavLink[] => [
  { label: locale === "en" ? "Home" : "Accueil", href: buildLocalePath(locale, "/") },
  { label: locale === "en" ? "Features" : "Fonctionnalités", href: buildLocalePath(locale, "/features") },
  { label: "Smart Coach", href: buildLocalePath(locale, "/features/smart-coach") },
  { label: locale === "en" ? "How it works" : "Comment ça marche", href: buildLocalePath(locale, "/how-it-works") },
  { label: "FAQ", href: buildLocalePath(locale, "/faq") },
  { label: "Contact", href: buildLocalePath(locale, "/contact") },
];

const buildAuthenticatedLinks = (locale: Locale): NavLink[] => [
  { label: "Dashboard", href: buildLocalePath(locale, "/") },
  { label: locale === "en" ? "Generator" : "Générateur", href: buildLocalePath(locale, "/generateur-entrainement") },
  { label: locale === "en" ? "Garmin data" : "Données Garmin", href: buildLocalePath(locale, "/secure/garmin-data") },
  { label: locale === "en" ? "Profile" : "Profil", href: buildLocalePath(locale, "/secure/user-information") },
  { label: locale === "en" ? "Garmin integration" : "Intégration Garmin", href: buildLocalePath(locale, "/integrations/garmin") },
];

const socials: FooterLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/adapt2life" },
  { label: "Instagram", href: "https://www.instagram.com/adapt2life.app" },
];

const legalLinks = (locale: Locale): FooterLink[] => {
  if (locale === "en") {
    return [
      { label: "Legal notice", href: buildLocalePath("en", "/legal/legal-notice") },
      { label: "Terms of use", href: buildLocalePath("en", "/legal/terms") },
      { label: "Privacy policy", href: buildLocalePath("en", "/legal/privacy") },
    ];
  }

  return [
    { label: "Mentions légales", href: buildLocalePath("fr", "/legal/mentions-legales") },
    { label: "Conditions d’utilisation", href: buildLocalePath("fr", "/legal/conditions") },
    { label: "Politique de confidentialité", href: buildLocalePath("fr", "/legal/confidentialite") },
  ];
};

const buildLocaleAwareRedirect = (locale: Locale, targetPath: string) => {
  const redirectTarget = buildLocalePath(locale, targetPath);
  return `${buildLocalePath(locale, "/handler/sign-in")}?redirect=${encodeURIComponent(redirectTarget)}`;
};

const toggleFactory = (currentLocale: Locale, targetLocale: Locale): LanguageToggle => ({
  label: targetLocale.toUpperCase(),
  title: targetLocale === "en" ? "View this page in English" : "Voir cette page en français",
  targetLocale,
  fallbackHref: targetLocale === DEFAULT_LOCALE ? "/" : `/${targetLocale}`,
});

const buildFooter = (locale: Locale): NavigationFooter => ({
  navigationTitle: locale === "en" ? "Navigation" : "Navigation",
  legalTitle: locale === "en" ? "Legal" : "Mentions légales",
  socialTitle: locale === "en" ? "Follow us" : "Suivez-nous",
  navigationLinks: [
    ...buildGuestLinks(locale),
    { label: locale === "en" ? "About" : "À propos", href: buildLocalePath(locale, "/about") },
    { label: locale === "en" ? "Pricing" : "Tarifs", href: buildLocalePath(locale, "/pricing") },
  ],
  legalLinks: legalLinks(locale),
  socialLinks: socials,
  copyright:
    locale === "en"
      ? `© ${new Date().getFullYear()} Adapt2Life — All rights reserved.`
      : `© ${new Date().getFullYear()} Adapt2Life — Tous droits réservés.`,
});

const navigationByLocale: Record<Locale, NavigationConfig> = {
  fr: {
    guestLinks: buildGuestLinks("fr"),
    authenticatedLinks: buildAuthenticatedLinks("fr"),
    signInLabel: "Se connecter",
    signOutLabel: "Se déconnecter",
    signInHref: buildLocaleAwareRedirect("fr", "/integrations/garmin"),
    signOutRedirect: buildLocalePath("fr", "/"),
    languageToggle: toggleFactory("fr", "en"),
    logoHref: buildLocalePath("fr", "/"),
    menuToggleAriaLabel: "Basculer la navigation",
    menuLabel: "Menu",
    footer: buildFooter("fr"),
  },
  en: {
    guestLinks: buildGuestLinks("en"),
    authenticatedLinks: buildAuthenticatedLinks("en"),
    signInLabel: "Sign in",
    signOutLabel: "Sign out",
    signInHref: buildLocaleAwareRedirect("en", "/integrations/garmin"),
    signOutRedirect: buildLocalePath("en", "/"),
    languageToggle: toggleFactory("en", "fr"),
    logoHref: buildLocalePath("en", "/"),
    menuToggleAriaLabel: "Toggle navigation",
    menuLabel: "Menu",
    footer: buildFooter("en"),
  },
};

export const getNavigationConfig = (locale: Locale): NavigationConfig =>
  navigationByLocale[locale] ?? navigationByLocale[DEFAULT_LOCALE];
