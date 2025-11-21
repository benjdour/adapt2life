"use client";

import Link from "next/link";

const navigationLinks = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/features" },
  { label: "Comment ça marche", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Mentions légales", href: "/legal/mentions-legales" },
  { label: "Conditions d’utilisation", href: "/legal/conditions" },
  { label: "Politique de confidentialité", href: "/legal/confidentialite" },
];

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  { label: "Instagram", href: "https://www.instagram.com" },
  { label: "YouTube", href: "https://www.youtube.com" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="font-heading text-base text-foreground">{title}</p>
    <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
  </div>
);

export const Footer = () => (
  <footer className="border-t border-white/10 bg-background/70 py-12 text-sm text-muted-foreground">
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 md:grid-cols-3">
      <Section title="Navigation">
        <ul className="space-y-2">
          {navigationLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Mentions légales">
        <ul className="space-y-2">
          {legalLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Suivez-nous">
        <ul className="space-y-2">
          {socials.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer" className="transition hover:text-foreground">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>

    <div className="mt-8 text-center text-xs text-muted-foreground/70">
      © {new Date().getFullYear()} Adapt2Life — Tous droits réservés.
    </div>
  </footer>
);
