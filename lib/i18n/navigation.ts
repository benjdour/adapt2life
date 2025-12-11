import { DEFAULT_LOCALE, Locale } from "./locales";
import { buildLocalePath, buildSignInUrl } from "./routing";

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

const legalLinks = (locale: Locale): FooterLink[] => [
  {
    label: locale === "en" ? "Legal notice" : "Mentions légales",
    href: buildLocalePath(locale, "/legal/mentions-legales"),
  },
  {
    label: locale === "en" ? "Terms of use" : "Conditions d’utilisation",
    href: buildLocalePath(locale, "/legal/conditions"),
  },
  {
    label: locale === "en" ? "Privacy policy" : "Politique de confidentialité",
    href: buildLocalePath(locale, "/legal/confidentialite"),
  },
];

const buildLocaleAwareRedirect = (locale: Locale, targetPath: string) => buildSignInUrl(locale, targetPath);

const toggleFactory = (currentLocale: Locale, targetLocale: Locale): LanguageToggle => ({
  label: targetLocale.toUpperCase(),
  title: targetLocale === "en" ? "View this page in English" : "Voir cette page en français",
  targetLocale,
  fallbackHref: targetLocale === DEFAULT_LOCALE ? "/" : `/${targetLocale}`,
});

const buildFooterNavigationLinks = (locale: Locale): FooterLink[] => [
  { label: locale === "en" ? "Home" : "Accueil", href: buildLocalePath(locale, "/") },
  { label: locale === "en" ? "Features" : "Fonctionnalités", href: buildLocalePath(locale, "/features") },
  { label: "Smart Coach", href: buildLocalePath(locale, "/features/smart-coach") },
  { label: locale === "en" ? "Pricing" : "Tarifs", href: buildLocalePath(locale, "/pricing") },
  { label: locale === "en" ? "About" : "À propos", href: buildLocalePath(locale, "/about") },
  { label: locale === "en" ? "How it works" : "Comment ça marche", href: buildLocalePath(locale, "/how-it-works") },
  { label: "FAQ", href: buildLocalePath(locale, "/faq") },
  { label: "Contact", href: buildLocalePath(locale, "/contact") },
];

const buildFooter = (locale: Locale): NavigationFooter => ({
  navigationTitle: locale === "en" ? "Navigation" : "Navigation",
  legalTitle: locale === "en" ? "Legal" : "Mentions légales",
  socialTitle: locale === "en" ? "Follow us" : "Suivez-nous",
  navigationLinks: buildFooterNavigationLinks(locale),
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
    signInHref: buildLocaleAwareRedirect("fr", "/"),
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
    signInHref: buildLocaleAwareRedirect("en", "/"),
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
