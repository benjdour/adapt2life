import Image from "next/image";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type HowItWorksPageProps = Readonly<{
  params: { locale: Locale };
}>;

type Step = {
  label: string;
  labelClass: string;
  title: string;
  description: string;
  bullets: string[];
  image: {
    src: string;
    alt: string;
  };
  reverse?: boolean;
};

const howItWorksCopy: Record<
  Locale,
  {
    heroTitle: string;
    heroSubtitle: string;
    steps: Step[];
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  }
> = {
  en: {
    heroTitle: "How Adapt2Life Works",
    heroSubtitle:
      "Achieve your fitness goals with a personalized AI coach that understands your body and adapts to your life.",
    steps: [
      {
        label: "Step 1",
        labelClass: "text-green-400",
        title: "Connect Your Garmin",
        description:
          "Seamlessly link your Garmin account to Adapt2Life. This secure connection allows our AI to access your vital data: heart rate, sleep patterns, stress levels, Body Battery, and past activities.",
        bullets: [
          "Secure and private data synchronization.",
          "Comprehensive overview of your physiological metrics.",
          "Foundation for intelligent training recommendations.",
        ],
        image: {
          src: "/how-it-works-1.jpeg",
          alt: "Connect Garmin",
        },
      },
      {
        label: "Step 2",
        labelClass: "text-blue-400",
        title: "AI Analysis & Personalization",
        description:
          "Our advanced AI engine processes your Garmin data, learning your unique physiological responses, recovery needs, and performance trends. It's like having a sports scientist dedicated to you.",
        bullets: [
          "Real-time assessment of your readiness to train.",
          "Identification of strengths and areas for improvement.",
          "Personalized training zones and intensity recommendations.",
        ],
        image: {
          src: "/how-it-works-2.jpeg",
          alt: "AI Analysis",
        },
        reverse: true,
      },
      {
        label: "Step 3",
        labelClass: "text-orange-400",
        title: "Receive Your Adaptive Plan",
        description:
          "Based on the AI's insights, you receive a dynamic training plan. This plan isn't static; it adapts daily, even hourly, to your recovery, energy levels, and any new inputs from your Garmin device.",
        bullets: [
          "Daily workout suggestions perfectly tailored to your current state.",
          "Adjustments for unexpected changes in your day.",
          "Guidance to prevent injury and optimize performance.",
        ],
        image: {
          src: "/how-it-works-3.jpeg",
          alt: "Adaptive Plan",
        },
      },
      {
        label: "Step 4",
        labelClass: "text-green-400",
        title: "Chat with Your AI Coach",
        description:
          "Have direct conversations with your AI coach. Ask questions, provide feedback on your workouts, or discuss your goals. The coach learns from every interaction, becoming even more effective over time.",
        bullets: [
          "Interactive Q&A for all your training queries.",
          "Feedback loop to continuously refine your plan.",
          "Motivation and support tailored to your needs.",
        ],
        image: {
          src: "/how-it-works-4.jpeg",
          alt: "Chat with AI Coach",
        },
        reverse: true,
      },
    ],
    ctaTitle: "Experience Smarter Training",
    ctaDescription:
      "Adapt2Life is your partner in achieving peak physical condition with intelligence and flexibility.",
    ctaButton: "Start Your Journey",
  },
  fr: {
    heroTitle: "Comment fonctionne Adapt2Life",
    heroSubtitle:
      "Atteignez vos objectifs de forme avec un coach IA personnalisé qui comprend votre corps et s'adapte à votre vie.",
    steps: [
      {
        label: "Étape 1",
        labelClass: "text-green-400",
        title: "Connectez votre Garmin",
        description:
          "Connectez votre compte Garmin à Adapt2Life en toute simplicité. Cette connexion sécurisée permet à notre IA d'accéder à vos données vitales : fréquence cardiaque, sommeil, niveau de stress, Body Battery et activités passées.",
        bullets: [
          "Synchronisation des données sécurisée et privée.",
          "Vue d'ensemble complète de vos métriques physiologiques.",
          "Base solide pour des recommandations d'entraînement intelligentes.",
        ],
        image: {
          src: "/how-it-works-1.jpeg",
          alt: "Connexion Garmin",
        },
      },
      {
        label: "Étape 2",
        labelClass: "text-blue-400",
        title: "Analyse IA et personnalisation",
        description:
          "Notre moteur d'IA avancé traite vos données Garmin, apprend vos réponses physiologiques, vos besoins de récupération et vos tendances de performance. C'est comme avoir un scientifique du sport dédié à vos progrès.",
        bullets: [
          "Évaluation en temps réel de votre disponibilité à l'entraînement.",
          "Identification de vos points forts et axes d'amélioration.",
          "Zones et intensités d'entraînement personnalisées.",
        ],
        image: {
          src: "/how-it-works-2.jpeg",
          alt: "Analyse IA",
        },
        reverse: true,
      },
      {
        label: "Étape 3",
        labelClass: "text-orange-400",
        title: "Recevez votre plan adaptatif",
        description:
          "À partir des analyses de l'IA, vous recevez un plan d'entraînement dynamique. Ce plan n'est pas statique : il s'adapte chaque jour, voire chaque heure, à votre récupération, votre énergie et aux nouvelles données de votre appareil Garmin.",
        bullets: [
          "Propositions quotidiennes parfaitement adaptées à votre état du moment.",
          "Ajustements pour les imprévus de votre journée.",
          "Conseils pour prévenir les blessures et optimiser vos performances.",
        ],
        image: {
          src: "/how-it-works-3.jpeg",
          alt: "Plan adaptatif",
        },
      },
      {
        label: "Étape 4",
        labelClass: "text-green-400",
        title: "Discutez avec votre coach IA",
        description:
          "Parlez directement avec votre coach IA. Posez vos questions, partagez vos ressentis après vos séances ou discutez de vos objectifs. Le coach apprend de chaque interaction pour gagner en efficacité.",
        bullets: [
          "Questions-réponses interactives pour toutes vos interrogations.",
          "Boucle de retour pour affiner continuellement votre plan.",
          "Motivation et soutien adaptés à vos besoins.",
        ],
        image: {
          src: "/how-it-works-4.jpeg",
          alt: "Discussion avec le coach IA",
        },
        reverse: true,
      },
    ],
    ctaTitle: "Découvrez un entraînement plus intelligent",
    ctaDescription:
      "Adapt2Life est votre partenaire pour atteindre la forme optimale avec intelligence et flexibilité.",
    ctaButton: "Lancez-vous",
  },
};

export default function HowItWorksPage({ params }: HowItWorksPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = howItWorksCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: common.navCta }}
      footer={common.footer}
    >
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="mb-4 text-5xl font-extrabold">{copy.heroTitle}</h1>
          <p className="text-xl text-gray-200">{copy.heroSubtitle}</p>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          {copy.steps.map((step) => (
            <div
              key={step.title}
              className={`mb-16 flex flex-col items-center justify-between gap-8 md:flex-row ${
                step.reverse ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="md:w-1/2">
                <span className={`text-sm font-semibold uppercase ${step.labelClass}`}>
                  {step.label}
                </span>
                <h2 className="mb-4 text-4xl font-bold">{step.title}</h2>
                <p className="mb-4 text-lg text-gray-300">{step.description}</p>
                <ul className="list-inside list-disc space-y-2 text-gray-400">
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center md:w-1/2">
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  width={500}
                  height={300}
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-green-600 py-16 text-center">
        <h2 className="mb-4 text-4xl font-bold">{copy.ctaTitle}</h2>
        <p className="mb-8 text-xl text-gray-200">{copy.ctaDescription}</p>
        <Link
          href={`/${locale}/signup`}
          className="rounded-md bg-orange-500 px-8 py-4 font-semibold text-white transition duration-300 hover:bg-orange-600"
        >
          {copy.ctaButton}
        </Link>
      </section>
    </MarketingLayout>
  );
}
