import type { Locale } from "./config";

type NavItem = {
  slug: string;
  label: string;
};

export type CommonCopy = {
  navItems: NavItem[];
  navCta: NavItem;
  navLogoutLabel: string;
  footer: {
    tagline: string;
    navigationTitle: string;
    legalTitle: string;
    followUsTitle: string;
    rights: string;
    legalLinks: NavItem[];
  };
};

const copy: Record<Locale, CommonCopy> = {
  en: {
    navItems: [
      { slug: "", label: "Home" },
      { slug: "features", label: "Features" },
      { slug: "how-it-works", label: "How It Works" },
      { slug: "contact", label: "Contact" },
    ],
    navCta: {
      slug: "login",
      label: "Login",
    },
    navLogoutLabel: "Logout",
    footer: {
      tagline: "Your AI trainer for a balanced life.",
      navigationTitle: "Navigation",
      legalTitle: "Legal Info",
      followUsTitle: "Follow Us",
      rights: "© 2025 Adapt2Life. All rights reserved.",
      legalLinks: [
        { slug: "legal-notice", label: "Legal Notice" },
        { slug: "terms-of-use", label: "Terms of Use" },
        { slug: "privacy-policy", label: "Privacy Policy" },
      ],
    },
  },
  fr: {
    navItems: [
      { slug: "", label: "Accueil" },
      { slug: "features", label: "Fonctionnalités" },
      { slug: "how-it-works", label: "Comment ça marche" },
      { slug: "contact", label: "Contact" },
    ],
    navCta: {
      slug: "login",
      label: "Connexion",
    },
    navLogoutLabel: "Déconnexion",
    footer: {
      tagline: "Votre coach IA pour une vie équilibrée.",
      navigationTitle: "Navigation",
      legalTitle: "Informations légales",
      followUsTitle: "Suivez-nous",
      rights: "© 2025 Adapt2Life. Tous droits réservés.",
      legalLinks: [
        { slug: "legal-notice", label: "Mentions légales" },
        { slug: "terms-of-use", label: "Conditions d'utilisation" },
        { slug: "privacy-policy", label: "Politique de confidentialité" },
      ],
    },
  },
};

export function getCommonCopy(locale: Locale): CommonCopy {
  return copy[locale];
}
