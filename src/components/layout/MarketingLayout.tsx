"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

type NavItem = {
  slug: string;
  label: string;
};

type MarketingLayoutProps = {
  locale: Locale;
  nav: {
    items: NavItem[];
    cta: NavItem;
  };
  footer: {
    tagline: string;
    navigationTitle: string;
    legalTitle: string;
    followUsTitle: string;
    rights: string;
    legalLinks: NavItem[];
  };
  children: React.ReactNode;
};

function buildHref(locale: Locale, slug: string): string {
  if (slug.startsWith("http")) {
    return slug;
  }

  const normalizedSlug = slug.replace(/^\/+/, "");

  if (!normalizedSlug.length) {
    return `/${locale}`;
  }

  return `/${locale}/${normalizedSlug}`;
}

export function MarketingLayout({
  locale,
  nav,
  footer,
  children,
}: MarketingLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = nav.items.map((item) => ({
    ...item,
    href: buildHref(locale, item.slug),
  }));

  const ctaLink = {
    ...nav.cta,
    href: buildHref(locale, nav.cta.slug),
  };

  const legalLinks = footer.legalLinks.map((item) => ({
    ...item,
    href: buildHref(locale, item.slug),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <header className="flex items-center justify-between bg-gray-800 p-4">
        <Link href={`/${locale}`} className="flex items-center hover:text-green-400">
          <Image
            src="/logo.png"
            alt="Adapt2Life Logo"
            width={40}
            height={40}
            className="mr-2"
          />
          <span className="text-xl font-bold">Adapt2Life</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none md:hidden"
            aria-label="Toggle navigation"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>

        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.slug} href={item.href} className="hover:text-green-400">
              {item.label}
            </Link>
          ))}
          <Link
            href={ctaLink.href}
            className="rounded-md bg-gradient-to-r from-blue-500 to-green-500 px-4 py-2 text-white hover:from-blue-600 hover:to-green-600"
          >
            {ctaLink.label}
          </Link>
        </nav>
      </header>

      {isMenuOpen && (
        <nav className="flex w-full flex-col items-center space-y-4 bg-gray-800 p-4 md:hidden">
          {navItems.map((item) => (
            <Link key={item.slug} href={item.href} className="hover:text-green-400" onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link
            href={ctaLink.href}
            className="rounded-md bg-gradient-to-r from-blue-500 to-green-500 px-4 py-2 text-white hover:from-blue-600 hover:to-green-600"
            onClick={() => setIsMenuOpen(false)}
          >
            {ctaLink.label}
          </Link>
        </nav>
      )}

      <main className="flex flex-grow flex-col">{children}</main>

      <footer className="bg-gray-800 p-8 text-gray-400 flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="mb-2 flex items-center justify-center md:justify-start">
            <Image
              src="/logo.png"
              alt="Adapt2Life Logo"
              width={30}
              height={30}
              className="mr-2"
            />
            <span className="text-lg font-bold text-white">Adapt2Life</span>
          </div>
          <p className="text-sm">{footer.tagline}</p>
        </div>

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12 text-center md:text-left">
          <div>
            <h3 className="mb-2 font-semibold text-white">{footer.navigationTitle}</h3>
            <ul>
              {navItems.map((item) => (
                <li key={item.slug}>
                  <Link href={item.href} className="hover:text-green-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-white">{footer.legalTitle}</h3>
            <ul>
              {legalLinks.map((item) => (
                <li key={item.slug}>
                  <Link href={item.href} className="hover:text-green-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="mb-2 font-semibold text-white">{footer.followUsTitle}</h3>
            <div className="flex space-x-4 justify-center md:justify-start">
              <Link href="#" className="hover:text-green-400" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </Link>
              <Link href="#" className="hover:text-green-400" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </Link>
              <Link href="#" className="hover:text-green-400" aria-label="LinkedIn">
                <i className="fab fa-linkedin"></i>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-0 text-center md:text-right w-full md:w-auto">
          <p className="text-sm">{footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
