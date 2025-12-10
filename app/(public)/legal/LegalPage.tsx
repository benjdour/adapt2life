import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Locale } from "@/lib/i18n/locales";

const LEGAL_SLUGS = ["mentions-legales", "confidentialite", "conditions"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

type LegalSection = {
  title: string;
  content: string[];
};

type LegalPageContent = {
  slug: LegalSlug;
  heroTag: string;
  heroTitle: string;
  updatedAt: string;
  metadataTitle: string;
  metadataDescription: string;
  sections: LegalSection[];
};

type LegalContentByLocale = Record<Locale, Record<LegalSlug, LegalPageContent>>;

const frLegalContent: Record<LegalSlug, LegalPageContent> = {
  "mentions-legales": {
    slug: "mentions-legales",
    heroTag: "Mentions légales",
    heroTitle: "Informations officielles",
    updatedAt: "25 septembre 2025",
    metadataTitle: "Mentions légales — Adapt2Life",
    metadataDescription: "Informations légales officielles de la plateforme Adapt2Life.",
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
        content: [
          "Hébergeur : Vercel Inc.",
          "Adresse : 440 N Barranca Ave #4133, Covina, CA, 91723, États-Unis",
        ],
      },
      {
        title: "Propriété intellectuelle",
        content: [
          "L’ensemble du contenu présent sur ce site (graphiques, images, textes, vidéos, animations, sons, logos, icônes et leur mise en forme) est la propriété exclusive d’Adapt2Life Inc., sauf mention contraire appartenant à des partenaires ou auteurs.",
        ],
      },
    ],
  },
  confidentialite: {
    slug: "confidentialite",
    heroTag: "Politique de confidentialité",
    heroTitle: "Protéger vos données, notre priorité",
    updatedAt: "25 septembre 2025",
    metadataTitle: "Politique de confidentialité — Adapt2Life",
    metadataDescription: "Politique complète sur la collecte, l’utilisation et la protection des données personnelles sur Adapt2Life.",
    sections: [
      {
        title: "1. Introduction",
        content: [
          'Bienvenue sur Adapt2Life. Nous nous engageons à une transparence maximale concernant la protection de vos données personnelles. La présente politique explique la nature, la finalité et la base légale du traitement de vos données lorsque vous utilisez notre site et notre application (« le Service »), où que vous soyez. En accédant au Service, vous reconnaissez avoir lu et accepté cette politique.',
        ],
      },
      {
        title: "2. Données personnelles collectées",
        content: [
          "2.1 Données fournies directement :",
          "- Données de compte : adresse e-mail et nom lors de la création d’un compte ou à la prise de contact.",
          "- Données de communication : contenu des messages envoyés au support.",
          "- Données d’abonnement : type de plan choisi (Starter, Momentum, Peak, Elite, Ultra), quotas restants, identifiants techniques associés à votre plan.",
          "2.2 Données Garmin collectées via l’API :",
          "- Données d’activité : type d’activité (course, vélo, etc.), date/heure de début et fin, durée, distance, allure, calories, fréquence cardiaque, données GPS et altitude.",
          "- Données de santé et bien-être : sommeil, niveaux de stress, variabilité de la fréquence cardiaque (HRV), score Body Battery, suivi des cycles menstruels (si activé).",
          "2.3 Données collectées automatiquement :",
          "- Informations techniques : adresse IP, identifiants d’appareil, système d’exploitation, type de navigateur.",
          "- Informations d’usage : pages consultées, fréquence d’utilisation, fonctionnalités utilisées.",
        ],
      },
      {
        title: "3. Utilisation des données",
        content: [
          "Nous utilisons les données collectées pour :",
          "- Fournir le Service (connexion et génération de plans personnalisés).",
          "- Personnaliser les entraînements à partir des données Garmin.",
          "- Assurer la sécurité (détection d’activités frauduleuses).",
          "- Gérer les quotas d’utilisation (Starter ne se recharge pas ; Momentum/Peak/Elite/Ultra sont remis à zéro automatiquement chaque 1er du mois).",
          "- Améliorer le Service grâce à des données anonymisées.",
        ],
      },
      {
        title: "4. Partage et divulgation",
        content: [
          "Nous ne vendons ni ne louons vos données. Les partages se limitent à :",
          "- Garmin : envoi des entraînements générés pour synchronisation.",
          "- Fournisseurs IA (via OpenRouter) : transmission de données anonymisées pour générer les plans.",
          "- Prestataires tiers (Vercel, AWS, etc.) : hébergement et services cloud.",
        ],
      },
      {
        title: "5. Paiements & gestion d’abonnement",
        content: [
          "- Paiements : nous utilisons Stripe pour traiter les paiements (carte bancaire, Apple Pay, etc.). Stripe agit en tant que sous-traitant et collecte certaines données de paiement (numéro de carte, adresse, code postal) conformément à sa politique de confidentialité. Adapt2Life ne stocke jamais les informations complètes de carte ; seuls les identifiants techniques de client/abonnement Stripe (customerId, subscriptionId, priceId) sont conservés.",
          "- Gestion d’abonnement : les changements de plan (upgrade/downgrade) sont gérés via l’espace Profil (bouton « Gérer mon abonnement » qui ouvre le portail client Stripe) ou sur demande auprès du support. Les annulations prennent effet à la fin de la période de facturation.",
          "- Facturation & supports : les e-mails transactionnels (confirmation de paiement, alertes) sont envoyés via Resend. Ils contiennent uniquement les informations nécessaires au suivi de facturation.",
        ],
      },
      {
        title: "6. Transferts internationaux",
        content: [
          "Vos données peuvent être stockées sur des serveurs hors de votre juridiction. Des garanties appropriées sont mises en place.",
          "Utilisateurs du Québec : Adapt2Life effectue une Évaluation des facteurs relatifs à la vie privée (PIA) pour les transferts hors province.",
        ],
      },
      {
        title: "7. Vos droits",
        content: [
          "6.1 Droits pour tous : rectification des données inexactes.",
          "6.2 Droits EEE/UK (RGPD) : accès, portabilité, effacement, opposition.",
          "6.3 Droits Québec/Canada (Loi 64 / PIPEDA) : portabilité, retrait du consentement.",
          "6.4 Droits Californie (CCPA/CPRA) : droit de savoir, suppression, opposition à la vente des données.",
        ],
      },
      {
        title: "8. Conservation des données",
        content: ["Les données sont conservées tant que le compte est actif. En cas de suppression du compte, les données sont supprimées."],
      },
      {
        title: "9. Cookies et technologies similaires",
        content: [
          "Nous utilisons des cookies pour assurer le bon fonctionnement du site et analyser l’usage de façon anonyme. Vous pouvez configurer votre navigateur pour refuser les cookies.",
        ],
      },
      {
        title: "10. Confidentialité des mineurs",
        content: [
          "Le Service s’adresse aux personnes de 16 ans et plus. Nous ne collectons pas sciemment de données concernant des mineurs de moins de 16 ans.",
        ],
      },
      {
        title: "11. Nous contacter",
        content: ["Responsable de la protection des données : Benjamin Dour.", "Contact : contact@adapt2life.app"],
      },
    ],
  },
  conditions: {
    slug: "conditions",
    heroTag: "Conditions d’utilisation",
    heroTitle: "Utiliser Adapt2Life en toute confiance",
    updatedAt: "25 septembre 2025",
    metadataTitle: "Conditions d’utilisation — Adapt2Life",
    metadataDescription: "Conditions générales d’utilisation du service Adapt2Life.",
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
          "Les abonnements sont reconduits automatiquement jusqu’à annulation. Vous pouvez gérer ou annuler votre abonnement depuis la page Profil (lien « Gérer mon abonnement » qui ouvre le portail client Stripe) ou en contactant le support (contact@adapt2life.app). L’annulation prend effet à la fin de la période en cours. Aucune pénalité de résiliation anticipée n’est appliquée.",
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
};

const enLegalContent: Record<LegalSlug, LegalPageContent> = {
  "mentions-legales": {
    slug: "mentions-legales",
    heroTag: "Legal notice",
    heroTitle: "Official information",
    updatedAt: "September 25, 2025",
    metadataTitle: "Legal notice — Adapt2Life",
    metadataDescription: "Official legal information for the Adapt2Life platform.",
    sections: [
      {
        title: "Publisher",
        content: [
          "Company name: Adapt2Life Inc.",
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
        title: "Hosting",
        content: [
          "Host: Vercel Inc.",
          "Address: 440 N Barranca Ave #4133, Covina, CA, 91723, United States",
        ],
      },
      {
        title: "Intellectual property",
        content: [
          "All content on this site (graphics, images, text, videos, animations, sounds, logos, icons, layouts) is the exclusive property of Adapt2Life Inc., unless otherwise indicated for partners or authors.",
        ],
      },
    ],
  },
  confidentialite: {
    slug: "confidentialite",
    heroTag: "Privacy policy",
    heroTitle: "Protecting your data is our priority",
    updatedAt: "September 25, 2025",
    metadataTitle: "Privacy policy — Adapt2Life",
    metadataDescription: "Full details on how Adapt2Life collects, uses, and protects personal data.",
    sections: [
      {
        title: "1. Introduction",
        content: [
          "Welcome to Adapt2Life. We are fully transparent about how we protect your personal data. This policy explains the nature, purpose, and legal basis for processing your information when you use our site and app (the “Service”), wherever you are located. By accessing the Service, you acknowledge that you have read and accepted this policy.",
        ],
      },
      {
        title: "2. Personal data collected",
        content: [
          "2.1 Data you provide directly:",
          "- Account data: email address and name when creating an account or contacting the team.",
          "- Communications: content of the messages you send to support.",
          "- Subscription data: chosen plan (Starter, Momentum, Peak, Elite, Ultra), remaining quotas, technical identifiers tied to your plan.",
          "2.2 Garmin data collected via the API:",
          "- Activity data: activity type (run, bike, etc.), start/end date and time, duration, distance, pace, calories, heart rate, GPS and elevation.",
          "- Health and wellness data: sleep, stress levels, heart rate variability (HRV), Body Battery score, menstrual tracking (if enabled).",
          "2.3 Automatically collected data:",
          "- Technical info: IP address, device identifiers, operating system, browser type.",
          "- Usage info: pages visited, frequency of use, features accessed.",
        ],
      },
      {
        title: "3. How we use the data",
        content: [
          "We use the collected data to:",
          "- Provide the Service (login and generation of personalized plans).",
          "- Personalize workouts using Garmin signals.",
          "- Ensure security (detect fraudulent activity).",
          "- Manage usage quotas (Starter never refills; Momentum/Peak/Elite/Ultra reset automatically on the 1st of each month).",
          "- Improve the Service using anonymized insights.",
        ],
      },
      {
        title: "4. Sharing and disclosure",
        content: [
          "We never sell or rent your data. Sharing is limited to:",
          "- Garmin: sending generated workouts for synchronization.",
          "- AI providers (via OpenRouter): transmitting anonymized data to generate plans.",
          "- Third-party vendors (Vercel, AWS, etc.): hosting and cloud services.",
        ],
      },
      {
        title: "5. Payments & subscriptions",
        content: [
          "- Payments: Stripe processes all payments (credit card, Apple Pay, etc.). Stripe acts as a processor and collects certain payment data (card number, address, postal code) according to its own privacy policy. Adapt2Life never stores full card details; only the technical identifiers (customerId, subscriptionId, priceId) are kept.",
          "- Subscription management: plan upgrades/downgrades are handled from the Profile page (“Manage my subscription” opens the Stripe customer portal) or by contacting support. Cancellations take effect at the end of the billing period.",
          "- Billing & notifications: transactional emails (payment confirmation, alerts) are sent via Resend and contain only the information needed for billing.",
        ],
      },
      {
        title: "6. International transfers",
        content: [
          "Your data may be stored on servers outside your jurisdiction. Appropriate safeguards are implemented.",
          "Québec users: Adapt2Life performs a privacy impact assessment (PIA) for transfers outside the province.",
        ],
      },
      {
        title: "7. Your rights",
        content: [
          "6.1 Rights for everyone: rectify inaccurate data.",
          "6.2 EEA/UK (GDPR) rights: access, portability, deletion, objection.",
          "6.3 Québec/Canada (Law 64 / PIPEDA) rights: portability, withdraw consent.",
          "6.4 California (CCPA/CPRA) rights: right to know, deletion, opt out of data sales.",
        ],
      },
      {
        title: "8. Data retention",
        content: ["Data is stored as long as the account remains active. When an account is deleted, the associated data is removed."],
      },
      {
        title: "9. Cookies and similar technologies",
        content: [
          "We use cookies to ensure the site operates properly and to analyze usage anonymously. You can configure your browser to refuse cookies.",
        ],
      },
      {
        title: "10. Children’s privacy",
        content: [
          "The Service is intended for users aged 16 and above. We do not knowingly collect information from children under 16.",
        ],
      },
      {
        title: "11. Contact",
        content: ["Data protection lead: Benjamin Dour.", "Contact: contact@adapt2life.app"],
      },
    ],
  },
  conditions: {
    slug: "conditions",
    heroTag: "Terms of use",
    heroTitle: "Use Adapt2Life with confidence",
    updatedAt: "September 25, 2025",
    metadataTitle: "Terms of use — Adapt2Life",
    metadataDescription: "General terms and conditions governing the Adapt2Life service.",
    sections: [
      {
        title: "1. Acceptance",
        content: [
          "By accessing or using the Adapt2Life application (the “Service”), you agree to be bound by these terms (“Terms”). If you disagree with any part, you may not access the Service.",
        ],
      },
      {
        title: "2. User accounts",
        content: [
          "When creating an account, you must provide accurate, complete information. You are responsible for safeguarding your password and any activities performed under it.",
        ],
      },
      {
        title: "3. Intellectual property",
        content: [
          "The Service and its original content, features, and components remain the exclusive property of Adapt2Life Inc. and its licensors.",
        ],
      },
      {
        title: "4. User content",
        content: [
          "You are responsible for any content you submit through the Service. You grant Adapt2Life a non-exclusive, worldwide, royalty-free license to use, modify, and distribute any content you provide via the Service.",
        ],
      },
      {
        title: "5. Payments & subscriptions",
        content: [
          "Payments for Starter (one-time), Momentum, Peak, Elite, and Ultra (restricted access) plans are processed through Stripe. By subscribing, you authorize Adapt2Life and Stripe to charge the stored payment method according to your chosen cadence (monthly or annual).",
          "Starter grants 10 generations and 5 conversions once. Paid plans reset their quotas automatically on the 1st of each month—even if you pay annually.",
          "Subscriptions renew automatically until cancelled. You can manage or cancel from the Profile page (“Manage my subscription” opens the Stripe customer portal) or by contacting support (contact@adapt2life.app). Cancellation takes effect at the end of the current period—no early termination fees.",
          "In case of fraud, repeated payment failures, or clear misuse, Adapt2Life reserves the right to suspend or terminate access.",
        ],
      },
      {
        title: "6. Links to other sites",
        content: [
          "The Service may contain links to third-party websites or services not owned or controlled by Adapt2Life. We have no control over their content or privacy policies.",
        ],
      },
      {
        title: "7. Disclaimer",
        content: [
          "The Service is provided “as is” and “as available”. Adapt2Life makes no express or implied warranties regarding the Service. We do not guarantee it will be uninterrupted, secure, or error-free.",
        ],
      },
      {
        title: "8. Limitation of liability",
        content: [
          "Adapt2Life, its directors, employees, or partners shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, data, use, goodwill, or other intangible losses resulting from access to or use of the Service.",
        ],
      },
      {
        title: "9. Governing law",
        content: [
          "These Terms are governed by and construed in accordance with the laws of Québec, Canada, without regard to conflict-of-law provisions.",
        ],
      },
      {
        title: "10. Changes to the Terms",
        content: [
          "We reserve the right, at our sole discretion, to modify or replace these Terms at any time.",
        ],
      },
    ],
  },
};

const LEGAL_CONTENT: LegalContentByLocale = {
  fr: frLegalContent,
  en: enLegalContent,
};

export const getLegalMetadata = (locale: Locale, slug: LegalSlug): Metadata => {
  const localeContent = LEGAL_CONTENT[locale] ?? LEGAL_CONTENT.fr;
  const page = localeContent[slug];
  return {
    title: page.metadataTitle,
    description: page.metadataDescription,
    alternates: {
      canonical: `${siteUrlForLocale(locale)}${buildLegalPath(locale, slug)}`,
    },
  };
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

const siteUrlForLocale = (locale: Locale) => (locale === "fr" ? siteUrl : `${siteUrl}/en`);

const buildLegalPath = (locale: Locale, slug: LegalSlug) => {
  const base = `/legal/${slug}`;
  if (locale === "fr") return base;
  return `/en${base}`;
};

const isLegalSlug = (value: string | undefined | null): value is LegalSlug =>
  !!value && (LEGAL_SLUGS as readonly string[]).includes(value);

type LegalPageProps = {
  slug: string;
  locale: Locale;
};

export function LegalPage({ slug, locale }: LegalPageProps) {
  if (!isLegalSlug(slug)) {
    notFound();
  }
  const localeContent = LEGAL_CONTENT[locale] ?? LEGAL_CONTENT.fr;
  const page = localeContent[slug];
  const updatedLabel = locale === "fr" ? "Dernière mise à jour" : "Last updated";

  if (!page) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{page.heroTag}</p>
        <h1 className="text-4xl font-heading">{page.heroTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {updatedLabel}: {page.updatedAt}
        </p>
      </header>

      {page.sections.map((section) => (
        <section key={section.title} className="space-y-3 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {section.content.map((line, index) => (
              <li key={`${section.title}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

export const legalStaticParams = LEGAL_SLUGS.map((slug) => ({ slug }));

export const localeLegalStaticParams = (locales: readonly Locale[]) =>
  locales.flatMap((locale) => LEGAL_SLUGS.map((slug) => ({ locale, slug })));

export const ensureLegalSlug = (slug: string | undefined): LegalSlug => {
  if (!isLegalSlug(slug)) {
    notFound();
  }
  return slug;
};
