import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type SignupPageProps = Readonly<{
  params: { locale: Locale };
}>;

type SignupCopy = {
  badge: string;
  title: string;
  description: string;
  comingSoon: string;
  note: string;
};

const signupCopy: Record<Locale, SignupCopy> = {
  en: {
    badge: "🚧",
    title: "Sign Up",
    description:
      "We are finalizing the Garmin connection and our AI models to provide you with the best personalized experience.",
    comingSoon: "🚀 Coming Soon!",
    note: "Check back soon or follow us on social media for launch updates.",
  },
  fr: {
    badge: "🚧",
    title: "Inscription",
    description:
      "Nous terminons l'intégration Garmin et nos modèles d'IA pour vous offrir la meilleure expérience personnalisée possible.",
    comingSoon: "🚀 Bientôt disponible !",
    note: "Revenez vite ou suivez-nous sur les réseaux sociaux pour être informé du lancement.",
  },
};

export default function SignupPage({ params }: SignupPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = signupCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: common.navCta }}
      footer={common.footer}
    >
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl border border-green-500/30 bg-gray-800 p-10 shadow-2xl">
          <h1 className="mb-4 text-6xl font-extrabold text-transparent md:text-8xl bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            {copy.badge}
          </h1>
          <h2 className="mb-6 text-4xl font-bold text-white">{copy.title}</h2>
          <p className="mb-8 text-xl text-gray-300">{copy.description}</p>
          <div className="inline-block rounded-full border border-orange-500 bg-orange-500/20 px-6 py-3 text-lg font-semibold text-orange-400 transition duration-300">
            {copy.comingSoon}
          </div>
          <p className="mt-8 text-sm text-gray-500">{copy.note}</p>
        </div>
      </section>
    </MarketingLayout>
  );
}
