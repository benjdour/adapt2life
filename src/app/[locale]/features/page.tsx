import Image from "next/image";
import Link from "next/link";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type FeaturesPageProps = Readonly<{
  params: { locale: Locale };
}>;

type FeatureSection = {
  title: string;
  titleClass: string;
  description: string;
  bullets: string[];
  image: {
    src: string;
    alt: string;
  };
  reverse?: boolean;
  backgroundClass: string;
};

const featuresCopy: Record<
  Locale,
  {
    heroTitle: string;
    heroSubtitle: string;
    sections: FeatureSection[];
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  }
> = {
  en: {
    heroTitle: "Discover the Unique Features",
    heroSubtitle:
      "Adapt2Life revolutionizes your training with Artificial Intelligence that adapts to your life, not the other way around.",
    sections: [
      {
        title: "Real-time Adaptive Training",
        titleClass: "text-green-400",
        description:
          "Our AI analyzes your live Garmin data (heart rate, sleep, stress, Body Battery) to adjust your training plan second by second. No more rigid plans, welcome to maximum flexibility.",
        bullets: [
          "Dynamic adjustments based on fatigue and recovery.",
          "Optimized training load to avoid overtraining.",
          "Suggestions for alternative exercises based on your constraints.",
        ],
        image: {
          src: "/feature-adaptive.jpeg",
          alt: "Adaptive Training",
        },
        backgroundClass: "bg-gray-900",
      },
      {
        title: "Deep Integration with Garmin",
        titleClass: "text-blue-400",
        description:
          "Connect your Garmin account for precise analysis of all your health and performance metrics. Adapt2Life leverages the best of your devices.",
        bullets: [
          "Automatic synchronization of activities and vital data.",
          "Consideration of your VO2 Max, training status, and acute/chronic load.",
          "Visualization of your progress with clear and personalized graphs.",
        ],
        image: {
          src: "/feature-garmin.jpeg",
          alt: "Garmin Integration",
        },
        reverse: true,
        backgroundClass: "bg-gray-800",
      },
      {
        title: "Conversational and Personalized Coaching",
        titleClass: "text-orange-400",
        description:
          "Communicate with your AI coach as you would with a human coach. Express your preferences, pains, mindset, and get relevant advice.",
        bullets: [
          "Intelligent and contextual answers to all your questions.",
          "Adaptation of coaching tone and style to your personality.",
          "Goal setting and tracking with continuous support.",
        ],
        image: {
          src: "/feature-coach.jpeg",
          alt: "Conversational Coaching",
        },
        backgroundClass: "bg-gray-900",
      },
    ],
    ctaTitle: "Ready to Transform Your Training?",
    ctaDescription:
      "Join Adapt2Life and discover a new way to achieve your fitness goals.",
    ctaButton: "Get Started Now",
  },
  fr: {
    heroTitle: "Découvrez nos fonctionnalités uniques",
    heroSubtitle:
      "Adapt2Life révolutionne votre entraînement grâce à une intelligence artificielle qui s'adapte à votre vie, pas l'inverse.",
    sections: [
      {
        title: "Entraînement adaptatif en temps réel",
        titleClass: "text-green-400",
        description:
          "Notre IA analyse vos données Garmin en direct (rythme cardiaque, sommeil, stress, Body Battery) pour ajuster votre plan d'entraînement seconde après seconde. Fini les plans rigides : place à la flexibilité maximale.",
        bullets: [
          "Ajustements dynamiques selon votre fatigue et votre récupération.",
          "Charge d'entraînement optimisée pour éviter le surentraînement.",
          "Suggestions d'exercices alternatifs selon vos contraintes.",
        ],
        image: {
          src: "/feature-adaptive.jpeg",
          alt: "Entraînement adaptatif",
        },
        backgroundClass: "bg-gray-900",
      },
      {
        title: "Intégration avancée avec Garmin",
        titleClass: "text-blue-400",
        description:
          "Connectez votre compte Garmin pour une analyse précise de toutes vos données de santé et de performance. Adapt2Life tire le meilleur parti de vos appareils.",
        bullets: [
          "Synchronisation automatique des activités et des données vitales.",
          "Prise en compte de votre VO2 Max, de votre statut d'entraînement et de votre charge aiguë/chronique.",
          "Visualisation de vos progrès avec des graphiques clairs et personnalisés.",
        ],
        image: {
          src: "/feature-garmin.jpeg",
          alt: "Intégration Garmin",
        },
        reverse: true,
        backgroundClass: "bg-gray-800",
      },
      {
        title: "Coaching conversationnel et personnalisé",
        titleClass: "text-orange-400",
        description:
          "Discutez avec votre coach IA comme avec un coach humain. Partagez vos préférences, vos douleurs, votre état d'esprit et recevez des conseils pertinents.",
        bullets: [
          "Réponses intelligentes et contextualisées à toutes vos questions.",
          "Adaptation du ton et du style de coaching à votre personnalité.",
          "Définition et suivi des objectifs avec un accompagnement continu.",
        ],
        image: {
          src: "/feature-coach.jpeg",
          alt: "Coaching conversationnel",
        },
        backgroundClass: "bg-gray-900",
      },
    ],
    ctaTitle: "Prêt à transformer votre entraînement ?",
    ctaDescription:
      "Rejoignez Adapt2Life et découvrez une nouvelle manière d'atteindre vos objectifs.",
    ctaButton: "Commencez dès maintenant",
  },
};

export default function FeaturesPage({ params }: FeaturesPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = featuresCopy[locale];

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

      {copy.sections.map((section) => (
        <section
          key={section.title}
          className={`${section.backgroundClass} px-4 py-16`}
        >
          <div
            className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row ${
              section.reverse ? "md:flex-row-reverse" : ""
            }`}
          >
            <div className="md:w-1/2">
              <h2 className={`mb-4 text-4xl font-bold ${section.titleClass}`}>
                {section.title}
              </h2>
              <p className="mb-4 text-lg text-gray-300">{section.description}</p>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center md:w-1/2">
              <Image
                src={section.image.src}
                alt={section.image.alt}
                width={500}
                height={300}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
      ))}

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
