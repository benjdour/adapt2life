import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type PrivacyPolicyPageProps = Readonly<{
  params: { locale: Locale };
}>;

type ListItem = {
  label?: string;
  text: string;
};

type SubSection = {
  heading: string;
  paragraphs?: string[];
  list?: ListItem[];
};

type Section = {
  title: string;
  paragraphs?: string[];
  list?: ListItem[];
  subSections?: SubSection[];
};

type PrivacyCopy = {
  pageTitle: string;
  updatedAt: string;
  sections: Section[];
};

const privacyCopy: Record<Locale, PrivacyCopy> = {
  en: {
    pageTitle: "Adapt2Life Privacy Policy",
    updatedAt: "Last Updated: September 25, 2025",
    sections: [
      {
        title: "1. Introduction",
        paragraphs: [
          "Welcome to Adapt2Life. We are committed to the highest level of transparency when it comes to protecting your personal information. This privacy policy explains in detail the nature, purpose, and legal basis for processing your personal data when you use our website and application (the \"Service\"), no matter where you are located. By accessing or using our Service, you acknowledge that you have read and agreed to the terms of this policy.",
        ],
      },
      {
        title: "2. Personal Information We Collect",
        subSections: [
          {
            heading: "2.1 Information You Provide Directly:",
            list: [
              {
                label: "Account Data",
                text: "When you create an account or contact us, we collect your email address and name.",
              },
              {
                label: "Communication Data",
                text: "If you contact us for support or with questions, we collect the content of your communication.",
              },
            ],
          },
          {
            heading: "2.2 Garmin Data Collected via the API:",
            paragraphs: [
              "When you connect your Garmin account, you authorize us to access specific categories of health and activity data to provide you with a customized workout.",
            ],
            list: [
              {
                label: "Activity Data",
                text: "Activity type (running, cycling, walking, etc.), start/end date and time, duration, distance, pace, calories burned, heart rate, GPS data, and altitude.",
              },
              {
                label: "Health and Wellness Data",
                text: "Sleep data (duration, sleep stages), stress score, heart rate variability (HRV), \"Body Battery\" score, and menstrual cycle tracking data if enabled in your Garmin account.",
              },
            ],
          },
          {
            heading: "2.3 Automatically Collected Data:",
            list: [
              {
                label: "Technical Information",
                text: "Your IP address, unique device identifiers, operating system, and browser type.",
              },
              {
                label: "Usage Information",
                text: "The pages you visit, the frequency of your use, and the features you click on.",
              },
            ],
          },
        ],
      },
      {
        title: "3. Use of Your Personal Information",
        paragraphs: ["We use the information we collect for the following purposes:"],
        list: [
          {
            label: "To Provide the Service",
            text: "To allow you to log in and to generate personalized workouts.",
          },
          {
            label: "For Personalization",
            text: "To analyze your Garmin data and create a workout plan that adapts to your fitness level.",
          },
          {
            label: "For Security",
            text: "To protect our Service from fraudulent activity.",
          },
          {
            label: "For Service Improvement",
            text: "We use anonymized data to improve the app's features.",
          },
        ],
      },
      {
        title: "4. Sharing and Disclosure of Information",
        paragraphs: ["We do not sell or rent your personal information. We share it only in the following cases:"],
        list: [
          {
            label: "With Garmin",
            text: "We only share the generated workouts so they can be synced with your Garmin Connect account.",
          },
          {
            label: "With AI Providers (via OpenRouter)",
            text: "To generate a workout, we send anonymized data to the AI models.",
          },
          {
            label: "With Third-Party Providers",
            text: "We use hosting services (Vercel, AWS) and other cloud services to maintain the Service online.",
          },
        ],
      },
      {
        title: "5. International Data Transfers",
        paragraphs: [
          "Your data may be transferred to and stored on servers outside of your jurisdiction. We put in place adequate safeguards to protect your data.",
          "For users in Quebec: We conduct a Privacy Impact Assessment (PIA) to ensure transfers outside the province comply with the law.",
        ],
      },
      {
        title: "6. Your Privacy Rights",
        paragraphs: ["Your rights depend on your location."],
        subSections: [
          {
            heading: "6.1 Rights for all users:",
            list: [
              {
                label: "Right to rectification",
                text: "You can ask for your inaccurate information to be corrected.",
              },
            ],
          },
          {
            heading: "6.2 Specific Rights for EEA/UK Residents (GDPR):",
            list: [
              {
                label: "Right to access and portability",
                text: "You can request a copy of your data.",
              },
              {
                label: "Right to erasure",
                text: "You can request the deletion of your personal data.",
              },
              {
                label: "Right to object to processing",
                text: "You can object to the processing of your data.",
              },
            ],
          },
          {
            heading: "6.3 Specific Rights for Quebec Residents:",
            list: [
              {
                label: "Right to understand data usage",
                text: "You can ask how your personal information is used.",
              },
              {
                label: "Right to withdraw consent",
                text: "You can withdraw your consent at any time.",
              },
            ],
          },
          {
            heading: "6.4 Specific Rights for California Residents (CCPA/CPRA):",
            list: [
              {
                label: "Right to know",
                text: "You can request to know the categories of information we collect.",
              },
              {
                label: "Right to delete",
                text: "You can request the deletion of your personal information.",
              },
              {
                label: "Right to opt-out of sale",
                text: "You have the right to opt-out of any future sale of your data.",
              },
            ],
          },
        ],
      },
      {
        title: "7. Data Retention",
        paragraphs: ["We will retain your personal information as long as your account is active. If you delete your account, we will delete your data."],
      },
      {
        title: "8. Cookies and Tracking Technologies",
        paragraphs: ["We use cookies to maintain the site's proper functioning and to analyze usage anonymously. You can configure your browser to refuse cookies."],
      },
      {
        title: "9. Privacy of Minors",
        paragraphs: ["Our Service is for individuals 16 and over, and we do not knowingly collect data from individuals under 16."],
      },
      {
        title: "10. Contact Us",
        list: [
          {
            label: "Responsible for data protection",
            text: "Benjamin Dour.",
          },
          {
            label: "Contact",
            text: "For questions or to exercise your rights, please contact us at: contact@adapt2life.app.",
          },
        ],
      },
    ],
  },
  fr: {
    pageTitle: "Politique de confidentialité Adapt2Life",
    updatedAt: "Mis à jour le : 25 septembre 2025",
    sections: [
      {
        title: "1. Introduction",
        paragraphs: [
          "Bienvenue sur Adapt2Life. Nous sommes pleinement engagés en faveur de la transparence dans la protection de vos renseignements personnels. La présente politique de confidentialité explique en détail la nature, la finalité et la base légale du traitement de vos données personnelles lorsque vous utilisez notre site web et notre application (le \"Service\"), où que vous soyez. En accédant au Service ou en l'utilisant, vous reconnaissez avoir lu et accepté les modalités de cette politique.",
        ],
      },
      {
        title: "2. Données personnelles que nous recueillons",
        subSections: [
          {
            heading: "2.1 Renseignements que vous fournissez directement :",
            list: [
              {
                label: "Données de compte",
                text: "Lorsque vous créez un compte ou nous contactez, nous recueillons votre adresse e-mail et votre nom.",
              },
              {
                label: "Données de communication",
                text: "Si vous nous contactez pour du soutien ou des questions, nous recueillons le contenu de vos échanges.",
              },
            ],
          },
          {
            heading: "2.2 Données Garmin collectées via l'API :",
            paragraphs: [
              "Lorsque vous connectez votre compte Garmin, vous nous autorisez à accéder à certaines catégories de données de santé et d'activité afin de vous proposer un programme d'entraînement personnalisé.",
            ],
            list: [
              {
                label: "Données d'activité",
                text: "Type d'activité (course, vélo, marche, etc.), date et heure de début/fin, durée, distance, allure, calories brûlées, fréquence cardiaque, données GPS et altitude.",
              },
              {
                label: "Données de santé et de bien-être",
                text: "Sommeil (durée, phases de sommeil), score de stress, variabilité de la fréquence cardiaque (VFC), score \"Body Battery\" et suivi du cycle menstruel si activé dans votre compte Garmin.",
              },
            ],
          },
          {
            heading: "2.3 Données collectées automatiquement :",
            list: [
              {
                label: "Informations techniques",
                text: "Votre adresse IP, les identifiants uniques de l'appareil, le système d'exploitation et le type de navigateur.",
              },
              {
                label: "Informations d'utilisation",
                text: "Les pages que vous consultez, la fréquence d'utilisation et les fonctionnalités sur lesquelles vous cliquez.",
              },
            ],
          },
        ],
      },
      {
        title: "3. Utilisation de vos renseignements personnels",
        paragraphs: ["Nous utilisons les données recueillies aux fins suivantes :"],
        list: [
          {
            label: "Fournir le Service",
            text: "Vous permettre de vous connecter et de générer des entraînements personnalisés.",
          },
          {
            label: "Personnalisation",
            text: "Analyser vos données Garmin et créer un plan d'entraînement adapté à votre niveau de forme.",
          },
          {
            label: "Sécurité",
            text: "Protéger notre Service contre les activités frauduleuses.",
          },
          {
            label: "Amélioration du service",
            text: "Utiliser des données anonymisées pour améliorer les fonctionnalités de l'application.",
          },
        ],
      },
      {
        title: "4. Partage et divulgation des renseignements",
        paragraphs: ["Nous ne vendons ni ne louons vos renseignements personnels. Nous les partageons uniquement dans les cas suivants :"],
        list: [
          {
            label: "Avec Garmin",
            text: "Nous partageons uniquement les entraînements générés afin qu'ils puissent être synchronisés avec votre compte Garmin Connect.",
          },
          {
            label: "Avec les fournisseurs d'IA (via OpenRouter)",
            text: "Pour générer un entraînement, nous envoyons des données anonymisées aux modèles d'IA.",
          },
          {
            label: "Avec des fournisseurs tiers",
            text: "Nous utilisons des services d'hébergement (Vercel, AWS) et d'autres services infonuagiques pour maintenir le Service en ligne.",
          },
        ],
      },
      {
        title: "5. Transferts internationaux de données",
        paragraphs: [
          "Vos données peuvent être transférées et stockées sur des serveurs situés à l'extérieur de votre juridiction. Nous mettons en place des mesures adéquates pour protéger vos données.",
          "Pour les utilisateurs situés au Québec : nous réalisons une analyse d'impact relative à la vie privée (AIVP) afin de garantir que les transferts hors province respectent la loi.",
        ],
      },
      {
        title: "6. Vos droits en matière de confidentialité",
        paragraphs: ["Vos droits varient selon votre lieu de résidence."],
        subSections: [
          {
            heading: "6.1 Droits applicables à tous les utilisateurs :",
            list: [
              {
                label: "Droit de rectification",
                text: "Vous pouvez demander la correction de toute information inexacte.",
              },
            ],
          },
          {
            heading: "6.2 Droits spécifiques aux résidents de l'EEE/Royaume-Uni (RGPD) :",
            list: [
              {
                label: "Droit d'accès et de portabilité",
                text: "Vous pouvez demander une copie de vos données.",
              },
              {
                label: "Droit à l'effacement",
                text: "Vous pouvez demander la suppression de vos données personnelles.",
              },
              {
                label: "Droit d'opposition",
                text: "Vous pouvez vous opposer au traitement de vos données.",
              },
            ],
          },
          {
            heading: "6.3 Droits spécifiques aux résidents du Québec :",
            list: [
              {
                label: "Droit à l'information",
                text: "Vous pouvez demander comment vos renseignements personnels sont utilisés.",
              },
              {
                label: "Droit de retirer votre consentement",
                text: "Vous pouvez retirer votre consentement à tout moment.",
              },
            ],
          },
          {
            heading: "6.4 Droits spécifiques aux résidents de Californie (CCPA/CPRA) :",
            list: [
              {
                label: "Droit de savoir",
                text: "Vous pouvez demander de connaître les catégories d'informations que nous recueillons.",
              },
              {
                label: "Droit à l'effacement",
                text: "Vous pouvez demander la suppression de vos renseignements personnels.",
              },
              {
                label: "Droit de refus de vente",
                text: "Vous pouvez refuser toute vente future de vos données.",
              },
            ],
          },
        ],
      },
      {
        title: "7. Conservation des données",
        paragraphs: ["Nous conservons vos renseignements personnels tant que votre compte est actif. Si vous supprimez votre compte, nous supprimons vos données."],
      },
      {
        title: "8. Témoins et technologies de suivi",
        paragraphs: ["Nous utilisons des témoins (cookies) pour assurer le bon fonctionnement du site et analyser l'utilisation de manière anonyme. Vous pouvez configurer votre navigateur pour refuser les témoins."],
      },
      {
        title: "9. Confidentialité des mineurs",
        paragraphs: ["Notre Service s'adresse aux personnes de 16 ans et plus et nous ne recueillons pas sciemment de données sur des personnes de moins de 16 ans."],
      },
      {
        title: "10. Nous contacter",
        list: [
          {
            label: "Responsable de la protection des données",
            text: "Benjamin Dour.",
          },
          {
            label: "Contact",
            text: "Pour toute question ou pour exercer vos droits, veuillez nous écrire à : contact@adapt2life.app.",
          },
        ],
      },
    ],
  },
};

function renderList(items: ListItem[]) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-gray-300">
      {items.map((item, index) => (
        <li key={`${item.label ?? "item"}-${index}`}>
          {item.label ? (
            <>
              <span className="font-semibold text-white">{item.label}:</span> {item.text}
            </>
          ) : (
            item.text
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = privacyCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: common.navCta }}
      footer={common.footer}
    >
      <section className="bg-gray-900 px-4 py-16 text-gray-200">
        <div className="mx-auto max-w-4xl rounded-lg bg-gray-800 p-8 shadow-lg">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-white">{copy.pageTitle}</h1>
            <p className="mt-2 text-sm">{copy.updatedAt}</p>
          </header>

          {copy.sections.map((section) => (
            <section key={section.title} className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-white">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mb-2 text-gray-300">
                  {paragraph}
                </p>
              ))}
              {section.list ? renderList(section.list) : null}
              {section.subSections?.map((subSection) => (
                <div key={subSection.heading} className="mt-6">
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    {subSection.heading}
                  </h3>
                  {subSection.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mb-2 text-gray-300">
                      {paragraph}
                    </p>
                  ))}
                  {subSection.list ? renderList(subSection.list) : null}
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
