import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath, buildSignInUrl } from "@/lib/i18n/routing";

type HomeCta = {
  label: string;
  href: string;
};

type HomeCopy = {
  tag: string;
  title: string;
  description: string;
  heroAlt: string;
  primaryCta: HomeCta;
  secondaryCta: HomeCta;
};

const HOME_COPY: Record<Locale, HomeCopy> = {
  fr: {
    tag: "Ton coach IA",
    title: "Qui s’adapte à ta vie.",
    description: "Des séances personnalisées, générées en temps réel selon ta forme, tes objectifs et tes contraintes quotidiennes.",
    heroAlt: "Interface Adapt2Life et athlètes connectés",
    primaryCta: { label: "Découvrir ton potentiel", href: "/handler/sign-in?redirect=/generateur-entrainement" },
    secondaryCta: { label: "Voir les tarifs", href: "/pricing" },
  },
  en: {
    tag: "Your AI coach",
    title: "Built around your reality.",
    description: "Personalized sessions generated in real time from your form, goals, and daily constraints.",
    heroAlt: "Adapt2Life interface and connected athletes",
    primaryCta: { label: "Start for free", href: "/handler/sign-in?redirect=/generateur-entrainement" },
    secondaryCta: { label: "See pricing", href: "/pricing" },
  },
};

type HomePageProps = {
  locale: Locale;
};

const isAbsoluteHref = (href: string) => /^(https?:)?\/\//.test(href);

const localizeHref = (locale: Locale, href: string) => {
  if (isAbsoluteHref(href)) return href;
  const [pathname, search] = href.split("?");
  if (pathname === "/handler/sign-in") {
    const redirectPart =
      search && search.startsWith("redirect=") ? search.replace("redirect=", "") : null;
    const target = redirectPart && redirectPart.length > 0 ? redirectPart : "/";
    return buildSignInUrl(locale, target);
  }
  const localized = buildLocalePath(locale, pathname);
  return search ? `${localized}?${search}` : localized;
};

export function HomePage({ locale }: HomePageProps) {
  const copy = HOME_COPY[locale] ?? HOME_COPY.fr;

  return (
    <main className="mx-auto flex h-full w-full max-w-6xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="flex flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="space-y-6 md:w-1/2">
          <p className="text-sm uppercase tracking-[0.4em] text-primary/80">{copy.tag}</p>
          <h1 className="text-4xl font-heading md:text-5xl">{copy.title}</h1>
          <p className="text-base text-muted-foreground">{copy.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button asChild className="px-8 py-6 text-base font-semibold">
              <Link href={localizeHref(locale, copy.primaryCta.href)}>{copy.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-base">
              <Link href={localizeHref(locale, copy.secondaryCta.href)}>{copy.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/brand/main-visual.jpg"
            alt={copy.heroAlt}
            width={800}
            height={600}
            priority
            className="rounded-3xl border border-white/10 object-cover shadow-2xl"
          />
        </div>
      </section>
    </main>
  );
}
