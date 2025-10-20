import Image from "next/image";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type HomePageProps = Readonly<{
  params: { locale: Locale };
}>;

const homeCopy: Record<
  Locale,
  {
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroDescription: string;
    heroCta: string;
    heroImageAlt: string;
  }
> = {
  en: {
    heroTitleLine1: "Your AI Trainer",
    heroTitleLine2: "That Adapts To Your Life.",
    heroDescription:
      "Personalized workouts, designed in real-time based on your fitness, goals, and daily constraints.",
    heroCta: "Discover Your Potential",
    heroImageAlt: "Woman exercising",
  },
  fr: {
    heroTitleLine1: "Votre coach IA",
    heroTitleLine2: "qui s'adapte à votre vie.",
    heroDescription:
      "Des entraînements personnalisés, conçus en temps réel selon votre forme, vos objectifs et vos contraintes quotidiennes.",
    heroCta: "Découvrez votre potentiel",
    heroImageAlt: "Femme en train de s'entraîner",
  },
};

export default function HomePage({ params }: HomePageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = homeCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: common.navCta }}
      footer={common.footer}
    >
      <section className="flex flex-grow items-center justify-center bg-gradient-to-br from-blue-700 to-green-700 p-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center md:flex-row">
          <div className="flex justify-center p-4 md:w-1/2">
            <Image
              src="/main-visual.jpeg"
              alt={copy.heroImageAlt}
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="p-4 text-center md:w-1/2 md:text-left">
            <h1 className="mb-4 text-5xl font-extrabold leading-tight">
              {copy.heroTitleLine1}{" "}
              <br className="hidden md:block" />
              {copy.heroTitleLine2}
            </h1>
            <p className="mb-8 text-xl text-gray-200">{copy.heroDescription}</p>
            <Link
              href={`/${locale}/signup`}
              className="inline-block rounded-md bg-orange-500 px-8 py-4 font-semibold text-white transition duration-300 hover:bg-orange-600"
            >
              {copy.heroCta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
