import { Locale, LOCALES } from "@/lib/i18n/locales";
import { buildLocalePath } from "@/lib/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

type Section = { title: string; content: string[] };

export type LegalCopy = {
  metaTitle: string;
  metaDescription: string;
  headerTag: string;
  headerTitle: string;
  updatedAt: string;
  sections: Section[];
};

export type LegalPageConfig = {
  id: string;
  slugs: Record<Locale, string>;
  copy: Record<Locale, LegalCopy>;
};

export const LEGAL_PAGES: LegalPageConfig[] = [
  {
    id: "legal-notice",
    slugs: {
      fr: "mentions-legales",
      en: "legal-notice",
    },
    copy: {
      fr: {
        metaTitle: "Mentions légales — Adapt2Life",
        metaDescription: "Informations légales officielles de la plateforme Adapt2Life.",
        headerTag: "Mentions légales",
        headerTitle: "Informations officielles",
        updatedAt: "Dernière mise à jour : 25 septembre 2025",
        sections: [
          {
            title: "Éditeur du site",
            content: [
              "Raison sociale : Adapt2Life Inc.",
              "Forme juridique : Corporation",
              "Siège social : 115 rue Jean Lefèvre, La Malbaie, QC, G5A 1V3, Canada",
              "Adresse e-mail : contact@adapt2life.app",
            ],
          },
          {
            title: "Directeur de la publication",
            content: ["Benjamin Dour"],
          },
          {
            title: "Hébergement",
            content: ["Hébergeur : Vercel Inc.", "Adresse : 440 N Barranca Ave #4133, Covina, CA, 91723, États-Unis"],
          },
          {
            title: "Propriété intellectuelle",
            content: [
              "L’ensemble du contenu présent sur ce site (graphiques, images, textes, vidéos, animations, sons, logos, icônes et leur mise en forme) est la propriété exclusive d’Adapt2Life Inc., sauf mention contraire appartenant à des partenaires ou auteurs.",
            ],
          },
        ],
      },
      en: {
        metaTitle: "Legal notice — Adapt2Life",
        metaDescription: "Official legal information about the Adapt2Life platform.",
        headerTag: "Legal notice",
        headerTitle: "Official information",
        updatedAt: "Last update: September 25, 2025",
        sections: [
          {
            title: "Publisher",
            content: [
              "Company: Adapt2Life Inc.",
              "Legal form: Corporation",
              "Head office: 115 rue Jean Lefèvre, La Malbaie, QC, G5A 1V3, Canada",
              "Email: contact@adapt2life.app",
            ],
          },
          {
            title: "Publication director",
            content: ["Benjamin Dour"],
          },
          {
            title: "Hosting provider",
            content: ["Provider: Vercel Inc.", "Address: 440 N Barranca Ave #4133, Covina, CA, 91723, United States"],
          },
          {
            title: "Intellectual property",
            content: [
              "All content on this site (graphics, images, text, videos, animations, audio, logos, icons and layout) is the exclusive property of Adapt2Life Inc., unless otherwise stated.",
            ],
          },
        ],
      },
    },
  },
  {
    id: "terms",
    slugs: {
      fr: "conditions",
      en: "terms",
    },
    copy: {
      fr: {
        metaTitle: "Conditions d’utilisation — Adapt2Life",
        metaDescription: "Conditions générales d’utilisation du service Adapt2Life.",
        headerTag: "Conditions d’utilisation",
        headerTitle: "Utiliser Adapt2Life en toute confiance",
        updatedAt: "Dernière mise à jour : 25 septembre 2025",
        sections: [
          {
            title: "1. Acceptation des conditions",
            content: [
              "En accédant ou en utilisant l’application Adapt2Life (« le Service »), vous acceptez d’être lié par les présentes conditions d’utilisation (« Conditions »). Si vous n’êtes pas d’accord avec une partie quelconque de ces conditions, vous ne pouvez pas accéder au Service.",
            ],
          },
          {
            title: "2. Comptes utilisateurs",
            content: [
              "Lorsque vous créez un compte, vous devez fournir des informations exactes et complètes. Vous êtes responsable de la protection de votre mot de passe ainsi que de toute activité effectuée avec ce mot de passe.",
            ],
          },
          {
            title: "3. Propriété intellectuelle",
            content: [
              "Le Service et son contenu original, ses fonctionnalités et ses composants demeurent la propriété exclusive d’Adapt2Life Inc. et de ses concédants.",
            ],
          },
          {
            title: "4. Contenu utilisateur",
            content: [
              "Vous êtes responsable de tout contenu que vous publiez via le Service. Vous accordez à Adapt2Life une licence non exclusive, mondiale et libre de redevance pour utiliser, modifier et distribuer tout contenu que vous fournissez via le Service.",
            ],
          },
          {
            title: "5. Paiements & abonnements",
            content: [
              "Les paiements des plans Starter (usage unique), Momentum, Peak, Elite et Ultra (accès restreint) sont traités via Stripe. En souscrivant, vous autorisez Adapt2Life et Stripe à débiter le moyen de paiement enregistré selon la périodicité choisie (mensuelle ou annuelle).",
              "Starter offre 10 générations et 5 conversions gratuites une seule fois. Les plans payants mensuels ou annuels voient leurs quotas remis à zéro automatiquement chaque 1er du mois — même en cas de facturation annuelle.",
              "Les abonnements sont reconduits automatiquement jusqu’à annulation. Vous pouvez gérer ou annuler votre abonnement depuis la page Profil (lien « Gérer mon abonnement » qui ouvre le portail client Stripe) ou en contactant le support (contact@adapt2life.app). L’annulation prend effet à la fin de la période en cours.",
              "En cas de fraude, de non-respect des présentes conditions, d’échec répété de paiement ou de violation manifeste de la politique d’utilisation, Adapt2Life se réserve le droit de suspendre ou résilier l’accès.",
            ],
          },
          {
            title: "6. Liens vers d’autres sites",
            content: [
              "Le Service peut contenir des liens vers des sites web ou services tiers qui ne sont pas détenus ou contrôlés par Adapt2Life. Nous n’avons aucun contrôle sur le contenu ni sur les politiques de confidentialité de ces sites tiers.",
            ],
          },
          {
            title: "7. Exclusion de garanties",
            content: [
              "Le Service est fourni « tel quel » et « selon disponibilité ». Adapt2Life n’émet aucune garantie, expresse ou implicite, relative au Service. Nous ne garantissons pas que le Service sera ininterrompu, sécurisé ou exempt d’erreurs.",
            ],
          },
          {
            title: "8. Limitation de responsabilité",
            content: [
              "Adapt2Life, ses dirigeants, employés ou partenaires ne pourront en aucun cas être tenus responsables des dommages indirects, accidentels, spéciaux ou consécutifs, y compris notamment les pertes de profits, de données, d’usage, de clientèle ou autres pertes intangibles résultant de votre accès ou utilisation du Service.",
            ],
          },
          {
            title: "9. Loi applicable",
            content: [
              "Les présentes Conditions sont régies et interprétées conformément aux lois du Québec, Canada, sans égard aux principes de conflits de lois.",
            ],
          },
          {
            title: "10. Modifications des Conditions",
            content: [
              "Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Conditions à tout moment.",
            ],
          },
        ],
      },
      en: {
        metaTitle: "Terms of use — Adapt2Life",
        metaDescription: "Terms and conditions that govern access to the Adapt2Life service.",
        headerTag: "Terms of use",
        headerTitle: "Use Adapt2Life with confidence",
        updatedAt: "Last update: September 25, 2025",
        sections: [
          {
            title: "1. Acceptance",
            content: [
              "By accessing or using the Adapt2Life application (the “Service”), you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not use the Service.",
            ],
          },
          {
            title: "2. Accounts",
            content: [
              "When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activity under your credentials.",
            ],
          },
          {
            title: "3. Intellectual property",
            content: [
              "The Service and its original content, features and components remain the exclusive property of Adapt2Life Inc. and its licensors.",
            ],
          },
          {
            title: "4. User content",
            content: [
              "You are responsible for any content you publish through the Service. You grant Adapt2Life a non-exclusive, worldwide, royalty-free license to use, modify and distribute content you provide through the Service.",
            ],
          },
          {
            title: "5. Payments & subscriptions",
            content: [
              "Payments for Starter (one-time), Momentum, Peak, Elite and Ultra (restricted access) are processed via Stripe. By subscribing you authorize Adapt2Life and Stripe to charge the stored payment method on the chosen billing cycle (monthly or yearly).",
              "Starter offers 10 generations and 5 conversions once. Paid plans reset their quotas automatically on the 1st of every month, even for annual billing.",
              "Plans renew automatically until cancelled. Manage or cancel from your Profile page (“Manage my subscription” opens the Stripe customer portal) or by contacting support (contact@adapt2life.app). Cancellation takes effect at the end of the current period.",
              "Adapt2Life may suspend or terminate access in case of fraud, repeated payment failures or violation of these Terms.",
            ],
          },
          {
            title: "6. Links to other sites",
            content: [
              "The Service may contain links to third-party websites or services not owned or controlled by Adapt2Life. We are not responsible for their content or privacy policies.",
            ],
          },
          {
            title: "7. Disclaimer",
            content: [
              "The Service is provided on an “as is” and “as available” basis. Adapt2Life makes no express or implied warranties regarding the Service and does not guarantee uninterrupted or error-free access.",
            ],
          },
          {
            title: "8. Limitation of liability",
            content: [
              "Adapt2Life, its directors, employees or partners shall not be liable for any indirect, incidental, special or consequential damages, including loss of profits, data, use, goodwill or other intangible losses resulting from your use of the Service.",
            ],
          },
          {
            title: "9. Governing law",
            content: ["These Terms are governed by the laws of Québec, Canada, without regard to conflict of law provisions."],
          },
          {
            title: "10. Changes",
            content: ["We reserve the right, at our sole discretion, to modify or replace these Terms at any time."],
          },
        ],
      },
    },
  },
  {
    id: "privacy",
    slugs: {
      fr: "confidentialite",
      en: "privacy",
    },
    copy: {
      fr: {
        metaTitle: "Politique de confidentialité — Adapt2Life",
        metaDescription: "Politique complète sur la collecte, l’utilisation et la protection des données personnelles sur Adapt2Life.",
        headerTag: "Politique de confidentialité",
        headerTitle: "Protéger vos données, notre priorité",
        updatedAt: "Dernière mise à jour : 25 septembre 2025",
        sections: [
          {
            title: "1. Introduction",
            content: [
              "Bienvenue sur Adapt2Life. Nous nous engageons à une transparence maximale concernant la protection de vos données personnelles. En accédant au Service, vous reconnaissez avoir lu et accepté cette politique.",
            ],
          },
          {
            title: "2. Données collectées",
            content: [
              "Données fournies directement : e-mail, nom, messages envoyés au support, plan choisi et quotas restants.",
              "Données Garmin (via API) : type d’activité, durée, distance, fréquence cardiaque, Body Battery, HRV, sommeil, stress, etc.",
              "Données techniques : adresse IP, identifiants d’appareil, pages consultées, fréquence d’utilisation.",
            ],
          },
          {
            title: "3. Utilisation des données",
            content: [
              "Fournir le Service et personnaliser les entraînements.",
              "Assurer la sécurité et prévenir les abus.",
              "Gérer les quotas (Starter ne se recharge pas ; Momentum/Peak/Elite/Ultra sont remis à zéro chaque 1er du mois).",
              "Améliorer le Service grâce à des données anonymisées.",
            ],
          },
          {
            title: "4. Partage",
            content: [
              "Garmin : synchronisation des entraînements générés.",
              "Fournisseurs IA via OpenRouter : données anonymisées pour générer les plans.",
              "Prestataires (Vercel, AWS, Resend) : hébergement, envoi d’e-mails transactionnels.",
            ],
          },
          {
            title: "5. Paiements & abonnement",
            content: [
              "Stripe traite les paiements. Adapt2Life ne stocke pas vos numéros de carte, uniquement les identifiants clients/abonnements.",
              "Les changements de plan ou annulations se font via le portail Stripe ou avec le support, avec prise d’effet à la fin de la période en cours.",
            ],
          },
          {
            title: "6. Transferts internationaux",
            content: [
              "Vos données peuvent être stockées hors de votre juridiction. Nous appliquons des garanties et, pour le Québec, des évaluations d’impact (PIA).",
            ],
          },
          {
            title: "7. Vos droits",
            content: [
              "Rectification, accès, portabilité, effacement selon les réglementations applicables (RGPD, Loi 64, CCPA/CPRA).",
            ],
          },
          {
            title: "8. Conservation",
            content: ["Les données sont conservées tant que le compte est actif. Elles sont supprimées en cas de clôture."],
          },
          {
            title: "9. Cookies",
            content: ["Nous utilisons des cookies nécessaires et des mesures anonymisées d’usage. Vous pouvez configurer votre navigateur pour les refuser."],
          },
          {
            title: "10. Mineurs",
            content: ["Le Service s’adresse aux personnes de 16 ans et plus. Nous ne collectons pas sciemment de données sur des mineurs de moins de 16 ans."],
          },
          {
            title: "11. Contact",
            content: ["Responsable : Benjamin Dour", "E-mail : contact@adapt2life.app"],
          },
        ],
      },
      en: {
        metaTitle: "Privacy policy — Adapt2Life",
        metaDescription: "Full policy describing how Adapt2Life collects, uses and protects personal data.",
        headerTag: "Privacy policy",
        headerTitle: "Protecting your data is our priority",
        updatedAt: "Last update: September 25, 2025",
        sections: [
          {
            title: "1. Introduction",
            content: [
              "Welcome to Adapt2Life. We are committed to full transparency regarding personal data protection. By using the Service you acknowledge this policy.",
            ],
          },
          {
            title: "2. Data we collect",
            content: [
              "2.1 Direct data:",
              "- Account data: email address and name when creating an account or getting in touch with us.",
              "- Communication data: content of messages sent to customer support.",
              "- Subscription data: plan type (Starter, Momentum, Peak, Elite, Ultra), remaining quotas and technical identifiers tied to your subscription.",
              "2.2 Garmin data collected via the API:",
              "- Activity data: activity type (run, ride, etc.), start/end date and time, duration, distance, pace, calories, heart rate, GPS traces and elevation.",
              "- Health & wellness data: sleep, stress levels, heart rate variability (HRV), Body Battery score, menstrual cycle tracking (if enabled).",
              "2.3 Automatically collected data:",
              "- Technical information: IP address, device identifiers, operating system, browser type.",
              "- Usage information: visited pages, frequency of use, features accessed.",
            ],
          },
          {
            title: "3. How we use data",
            content: [
              "Deliver the Service and personalize workouts.",
              "Ensure security and prevent abuse.",
              "Manage quotas (Starter does not refill; Momentum/Peak/Elite/Ultra reset on the 1st of each month).",
              "Improve the Service using anonymized insights.",
            ],
          },
          {
            title: "4. Sharing",
            content: [
              "Garmin: syncing generated workouts.",
              "AI providers via OpenRouter: anonymized data to generate plans.",
              "Vendors (Vercel, AWS, Resend): hosting and transactional emails.",
            ],
          },
          {
            title: "5. Payments & subscriptions",
            content: [
              "Stripe processes payments. Adapt2Life never stores full card numbers, only Stripe customer/subscription identifiers.",
              "Plan changes or cancellations go through the Stripe portal or support and take effect at the end of the current period.",
            ],
          },
          {
            title: "6. International transfers",
            content: [
              "Data may be stored outside your jurisdiction. Safeguards are applied and, for Québec users, privacy impact assessments are performed.",
            ],
          },
          {
            title: "7. Your rights",
            content: [
              "Rights to correction, access, portability or deletion depending on applicable regulations (GDPR, Law 64, CCPA/CPRA).",
            ],
          },
          {
            title: "8. Retention",
            content: ["Data is kept while the account is active and deleted when the account is closed."],
          },
          {
            title: "9. Cookies",
            content: ["We use essential cookies and anonymous usage analytics. You can configure your browser to decline them."],
          },
          {
            title: "10. Minors",
            content: ["The Service targets users aged 16 and above. We do not knowingly collect data from children under 16."],
          },
          {
            title: "11. Contact",
            content: ["Data protection lead: Benjamin Dour", "Email: contact@adapt2life.app"],
          },
        ],
      },
    },
  },
];

const pagePath = "/legal";

export const buildLegalStaticParams = () => {
  const params: Array<{ locale: Locale; slug: string }> = [];
  for (const locale of LOCALES) {
    for (const page of LEGAL_PAGES) {
      params.push({ locale, slug: page.slugs[locale] });
    }
  }
  return params;
};

export const findLegalPage = (locale: Locale, slug: string) =>
  LEGAL_PAGES.find((page) => page.slugs[locale] === slug);

export const buildLegalCanonical = (locale: Locale, slug: string) =>
  `${siteUrl}${buildLocalePath(locale, `${pagePath}/${slug}`)}`;

export const translateLegalPath = (pathname: string, targetLocale: Locale): string | null => {
  if (!pathname.startsWith(`${pagePath}/`)) {
    return null;
  }
  const slug = pathname.slice(pagePath.length + 1);
  if (!slug) return null;
  const page = LEGAL_PAGES.find((entry) => LOCALES.some((locale) => entry.slugs[locale] === slug));
  if (!page) {
    return null;
  }
  return `${pagePath}/${page.slugs[targetLocale]}`;
};
