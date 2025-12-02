"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopNavProps = {
  isAuthenticated: boolean;
  showAdminLink?: boolean;
};

const buildAuthenticatedLinks = (showAdminLink: boolean) => {
  const links = [
    { label: "Dashboard", href: "/" },
    { label: "Générateur", href: "/generateur-entrainement" },
    { label: "Données Garmin", href: "/secure/garmin-data" },
    { label: "Profil", href: "/secure/user-information" },
    { label: "Intégration Garmin", href: "/integrations/garmin" },
  ];

  if (showAdminLink) {
    links.push({ label: "Admin", href: "/admin" });
  }

  return links;
};

const guestLinks = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/features" },
  { label: "Smart Coach", href: "/features/coach-ia-garmin" },
  { label: "Comment ça marche", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const TopNav = ({ isAuthenticated, showAdminLink = false }: TopNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const links = isAuthenticated ? buildAuthenticatedLinks(showAdminLink) : guestLinks;

  const handleSignOut = () => {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/handler/sign-out";

    const redirectInput = document.createElement("input");
    redirectInput.type = "hidden";
    redirectInput.name = "redirect";
    redirectInput.value = "/";
    form.appendChild(redirectInput);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/handler/sign-in?redirect=/integrations/garmin">Se connecter</Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Basculer la navigation"
        >
          <span className="sr-only">Menu</span>
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

      <div className={cn("border-t border-white/10 bg-background/95 md:hidden", isOpen ? "block" : "hidden")}>
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
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
              >
                Se déconnecter
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
                <Link href="/handler/sign-in?redirect=/integrations/garmin">Se connecter</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
