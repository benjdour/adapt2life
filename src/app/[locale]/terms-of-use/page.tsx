import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";

type TermsPageProps = Readonly<{
  params: { locale: Locale };
}>;

type TermsSection = {
  title: string;
  paragraphs: string[];
};

type TermsCopy = {
  pageTitle: string;
  updatedAt: string;
  sections: TermsSection[];
};

const termsCopy: Record<Locale, TermsCopy> = {
  en: {
    pageTitle: "Terms of Use",
    updatedAt: "Last Updated: September 25, 2025",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: [
          'By accessing or using the Adapt2Life application ("the Service"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of the terms, then you may not access the Service.',
        ],
      },
      {
        title: "2. User Accounts",
        paragraphs: [
          "When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for any activities or actions under your password.",
        ],
      },
      {
        title: "3. Intellectual Property",
        paragraphs: [
          "The Service and its original content, features, and functionality are and will remain the exclusive property of Adapt2Life Inc and its licensors.",
        ],
      },
      {
        title: "4. User Content",
        paragraphs: [
          "You are responsible for any content you post to the Service. You grant Adapt2Life a non-exclusive, worldwide, royalty-free license to use, modify, and distribute any content you provide through the Service.",
        ],
      },
      {
        title: "5. Links to Other Websites",
        paragraphs: [
          "The Service may contain links to third-party websites or services that are not owned or controlled by Adapt2Life. We have no control over and assume no responsibility for the content or privacy policies of any third-party websites.",
        ],
      },
      {
        title: "6. Disclaimer of Warranties",
        paragraphs: [
          'The Service is provided on an "as is" and "as available" basis. Adapt2Life makes no warranties, expressed or implied, regarding the Service. We do not warrant that the Service will be uninterrupted, secure, or error-free.',
        ],
      },
      {
        title: "7. Limitation of Liability",
        paragraphs: [
          "In no event shall Adapt2Life, nor its directors, employees, or partners, be liable for any indirect, incidental, special, or consequential damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the Service.",
        ],
      },
      {
        title: "8. Governing Law",
        paragraphs: [
          "These Terms shall be governed and construed in accordance with the laws of Quebec, Canada, without regard to its conflict of law provisions.",
        ],
      },
      {
        title: "9. Changes to Terms",
        paragraphs: [
          "We reserve the right, at our sole discretion, to modify or replace these Terms at any time.",
        ],
      },
    ],
  },
  fr: {
    pageTitle: "Conditions d'utilisation",
    updatedAt: "Mis à jour le : 25 septembre 2025",
    sections: [
      {
        title: "1. Acceptation des conditions",
        paragraphs: [
          "En accédant à l'application Adapt2Life (le « Service ») ou en l'utilisant, vous acceptez d'être lié par les présentes conditions d'utilisation (les « Conditions »). Si vous n'êtes pas d'accord avec une partie des Conditions, vous ne pouvez pas accéder au Service.",
        ],
      },
      {
        title: "2. Comptes utilisateur",
        paragraphs: [
          "Lorsque vous créez un compte, vous devez fournir des informations exactes et complètes. Vous êtes responsable de la protection de votre mot de passe et de toutes les activités effectuées sous ce mot de passe.",
        ],
      },
      {
        title: "3. Propriété intellectuelle",
        paragraphs: [
          "Le Service ainsi que son contenu original, ses fonctionnalités et ses caractéristiques sont et resteront la propriété exclusive d'Adapt2Life Inc. et de ses concédants.",
        ],
      },
      {
        title: "4. Contenu utilisateur",
        paragraphs: [
          "Vous êtes responsable de tout contenu que vous publiez sur le Service. Vous accordez à Adapt2Life une licence non exclusive, mondiale et libre de redevances pour utiliser, modifier et distribuer tout contenu que vous fournissez via le Service.",
        ],
      },
      {
        title: "5. Liens vers d'autres sites web",
        paragraphs: [
          "Le Service peut contenir des liens vers des sites web ou services tiers qui ne sont ni détenus ni contrôlés par Adapt2Life. Nous n'avons aucun contrôle sur ces sites et déclinons toute responsabilité quant à leur contenu ou leurs politiques de confidentialité.",
        ],
      },
      {
        title: "6. Absence de garanties",
        paragraphs: [
          "Le Service est fourni « en l'état » et « selon disponibilité ». Adapt2Life n'offre aucune garantie, expresse ou implicite, concernant le Service. Nous ne garantissons pas que le Service sera ininterrompu, sécurisé ou exempt d'erreurs.",
        ],
      },
      {
        title: "7. Limitation de responsabilité",
        paragraphs: [
          "En aucun cas Adapt2Life, ni ses administrateurs, employés ou partenaires, ne pourra être tenu responsable de dommages indirects, accessoires, spéciaux ou consécutifs, y compris sans limitation la perte de bénéfices, de données, d'usage, de clientèle ou d'autres pertes immatérielles résultant de votre accès au Service ou de son utilisation.",
        ],
      },
      {
        title: "8. Droit applicable",
        paragraphs: [
          "Les présentes Conditions sont régies et interprétées conformément aux lois du Québec, Canada, sans égard aux dispositions en matière de conflit de lois.",
        ],
      },
      {
        title: "9. Modifications des conditions",
        paragraphs: [
          "Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Conditions à tout moment.",
        ],
      },
    ],
  },
};

export default function TermsOfUsePage({ params }: TermsPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = termsCopy[locale];

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
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mb-2 text-gray-300">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
