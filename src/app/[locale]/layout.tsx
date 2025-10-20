import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return children;
}
