import { ContactForm } from "@/components/contact/ContactForm";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import type { Locale } from "@/i18n/config";
import { getLayoutCopy } from "@/lib/layout";

type ContactPageProps = Readonly<{
  params: { locale: Locale };
}>;

type ContactCopy = {
  heroTitle: string;
  heroSubtitle: string;
  form: {
    heading: string;
    fields: {
      name: string;
      email: string;
      subject: string;
      message: string;
    };
    submitLabel: string;
    successMessage: string;
  };
  otherWaysTitle: string;
  emailLinkLabel: string;
  address: string;
};

const contactCopy: Record<Locale, ContactCopy> = {
  en: {
    heroTitle: "Contact Us",
    heroSubtitle:
      "Have questions or need support? We're here to help you get the most out of Adapt2Life.",
    form: {
      heading: "Send us a message",
      fields: {
        name: "Name",
        email: "Email",
        subject: "Subject",
        message: "Message",
      },
      submitLabel: "Send Message",
      successMessage: "Your message has been sent! We will get back to you shortly.",
    },
    otherWaysTitle: "Other Ways to Connect",
    emailLinkLabel: "support@adapt2life.com",
    address: "115 rue Jean Lefevre, La Malbaie, QC, G5A 1V3, Canada",
  },
  fr: {
    heroTitle: "Contactez-nous",
    heroSubtitle:
      "Des questions ou besoin d'aide ? Nous sommes là pour vous aider à tirer le meilleur parti d'Adapt2Life.",
    form: {
      heading: "Envoyez-nous un message",
      fields: {
        name: "Nom",
        email: "Adresse e-mail",
        subject: "Sujet",
        message: "Message",
      },
      submitLabel: "Envoyer le message",
      successMessage: "Votre message a été envoyé ! Nous vous répondrons rapidement.",
    },
    otherWaysTitle: "Autres moyens de nous joindre",
    emailLinkLabel: "support@adapt2life.com",
    address: "115 rue Jean Lefevre, La Malbaie, QC, G5A 1V3, Canada",
  },
};

export default async function ContactPage({ params }: ContactPageProps) {
  const locale = params.locale;
  const { common, navCta } = await getLayoutCopy(locale);
  const copy = contactCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: navCta }}
      footer={common.footer}
    >
      <section className="bg-gradient-to-br from-blue-700 to-green-700 py-20 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="mb-4 text-5xl font-extrabold">{copy.heroTitle}</h1>
          <p className="text-xl text-gray-200">{copy.heroSubtitle}</p>
        </div>
      </section>

      <ContactForm copy={copy.form} />

      <section className="bg-gray-800 px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-4xl font-bold text-blue-400">
            {copy.otherWaysTitle}
          </h2>
          <div className="flex flex-col items-center justify-center gap-8 text-lg md:flex-row">
            <div className="flex items-center space-x-3">
              <i className="fas fa-envelope text-2xl text-orange-400"></i>
              <a
                href="mailto:support@adapt2life.com"
                className="text-gray-200 hover:text-green-400"
              >
                {copy.emailLinkLabel}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-map-marker-alt text-2xl text-orange-400"></i>
              <span className="text-gray-200">{copy.address}</span>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
