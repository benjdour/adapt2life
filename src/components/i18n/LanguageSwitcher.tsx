"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
};

function buildHref(pathname: string | null, target: Locale): string {
  if (!pathname) {
    return `/${target}`;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return `/${target}`;
  }

  const [, ...rest] = segments;

  return rest.length ? `/${target}/${rest.join("/")}` : `/${target}`;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase text-gray-300 md:text-sm">
      {locales.map((code) => {
        const href = buildHref(pathname, code);
        const isActive = code === locale;

        return isActive ? (
          <span
            key={code}
            className="rounded-md border border-green-500/60 bg-green-500/20 px-2 py-1 text-green-200"
          >
            {code.toUpperCase()}
          </span>
        ) : (
          <Link
            key={code}
            href={href}
            className="rounded-md border border-transparent px-2 py-1 text-gray-300 transition hover:border-green-400 hover:text-green-300"
          >
            {code.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
