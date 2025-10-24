import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";

type LocaleLayoutProps = Readonly<{
  children: ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}>;

function isThenable<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === "function";
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const resolvedParams = isThenable(params) ? await params : params;
  const { locale } = resolvedParams;

  if (!isLocale(locale)) {
    notFound();
  }

  return children;
}
