import { MarketingLayout } from "@/components/layout/MarketingLayout";
import type { Locale } from "@/i18n/config";
import { getLayoutCopy } from "@/lib/layout";
import { redirect } from "next/navigation";

type DashboardPageProps = Readonly<{
  params: { locale: Locale };
}>;

type DashboardCopy = {
  greeting: string;
  message: string;
  highlightsTitle: string;
  highlights: Array<{ title: string; description: string }>;
  cta: string;
};

const dashboardCopy: Record<Locale, DashboardCopy> = {
  en: {
    greeting: "Welcome back!",
    message:
      "Your adaptive plan is warming up. While we finish connecting your data sources, here's a quick preview of what Adapt2Life will surface for you each day.",
    highlightsTitle: "Today's focus preview",
    highlights: [
      {
        title: "Smart session suggestions",
        description:
          "Planned workouts will automatically adjust to your availability and recovery level.",
      },
      {
        title: "Lifestyle balance tips",
        description:
          "Receive guidance on nutrition, sleep, and stress to keep long-term goals on track.",
      },
      {
        title: "Weekly progress check-ins",
        description:
          "Review momentum highlights and collaborate with the AI coach to fine-tune your plan.",
      },
    ],
    cta: "Stay tuned — your personalized dashboard is on its way.",
  },
  fr: {
    greeting: "Ravi de vous revoir !",
    message:
      "Votre programme adaptatif se prépare. En attendant la connexion finale de vos données, voici un aperçu de ce que Adapt2Life vous proposera chaque jour.",
    highlightsTitle: "Aperçu du focus du jour",
    highlights: [
      {
        title: "Suggestions d'entraînement intelligentes",
        description:
          "Les séances prévues s'ajusteront automatiquement à votre disponibilité et à votre récupération.",
      },
      {
        title: "Conseils d'équilibre de vie",
        description:
          "Recevez des recommandations sur la nutrition, le sommeil et la gestion du stress pour rester aligné sur vos objectifs.",
      },
      {
        title: "Bilans de progression hebdomadaires",
        description:
          "Analysez vos progrès et collaborez avec le coach IA pour ajuster votre programme.",
      },
    ],
    cta: "Restez à l'écoute — votre tableau de bord personnalisé arrive bientôt.",
  },
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const locale = params.locale;
  const { session, common, navCta } = await getLayoutCopy(locale);

  if (!session?.userId) {
    redirect(`/${locale}/login`);
  }

  const copy = dashboardCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: navCta }}
      footer={common.footer}
    >
      <section className="flex flex-grow items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-green-700 py-16">
        <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-gray-900/80 p-10 shadow-2xl backdrop-blur">
          <div className="mb-10 text-center md:text-left">
            <p className="text-sm uppercase tracking-wide text-green-300">
              {copy.greeting}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Adapt2Life Dashboard (beta)
            </h1>
            <p className="mt-4 text-base text-gray-300 md:text-lg">
              {copy.message}
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">
              {copy.highlightsTitle}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {copy.highlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-green-500/40 bg-white/5 p-6 text-sm text-gray-200"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {highlight.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-300">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 rounded-2xl border border-dashed border-green-400/60 bg-green-500/10 px-6 py-4 text-center text-sm font-semibold text-green-200">
            {copy.cta}
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
