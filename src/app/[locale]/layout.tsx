import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout(props: LocaleLayoutProps) {
  // 🔹 Force la résolution de params (même si c’est une Promise)
  const resolvedParams =
    "then" in props.params ? undefined : props.params;
  const locale = resolvedParams?.locale ?? "en";

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>{props.children}</body>
    </html>
  );
}