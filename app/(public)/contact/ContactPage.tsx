import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/ContactForm";
import { Locale } from "@/lib/i18n/locales";

type ContactCopy = {
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  faqTag: string;
  faqTitle: string;
  faqItems: Array<{ question: string; answer: string }>;
};

const frCopy: ContactCopy = {
  heroTag: "Contact",
  heroTitle: "Discutons de ton projet",
  heroSubtitle: "Écris-nous via le formulaire ou directement à contact@adapt2life.app",
  faqTag: "Questions fréquentes",
  faqTitle: "Tu te poses encore des questions ?",
  faqItems: [
    {
      question: "Puis-je planifier une démo personnalisée ?",
      answer:
        "Oui. Indique tes créneaux dans le formulaire ou écris-nous directement, nous organisons une démo adaptée à tes besoins.",
    },
    {
      question: "Proposez-vous des partenariats clubs ou coachs ?",
      answer: "Nous travaillons déjà avec des clubs et des coaches. Explique ton contexte et nous te recontactons rapidement.",
    },
    {
      question: "Comment contacter le support si j’ai un souci d’intégration Garmin ?",
      answer:
        "Utilise ce formulaire ou envoie un email à support@adapt2life.app, en précisant ton ID Garmin et le message d’erreur.",
    },
  ],
};

const CONTACT_COPY: Record<Locale, ContactCopy> = {
  fr: frCopy,
  en: frCopy,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

export const contactMetadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Contact — Adapt2Life",
    description: "Écris-nous pour une démo Smart Coach, une intégration Garmin ou une question sur les abonnements.",
    alternates: { canonical: `${siteUrl}/contact` },
    openGraph: {
      url: `${siteUrl}/contact`,
      title: "Contact Adapt2Life",
      description: "Planifie une démo Smart Coach ou pose tes questions à l’équipe Adapt2Life.",
      type: "website",
    },
  },
  en: {
    title: "Contact — Adapt2Life",
    description: "Reach out for a Smart Coach demo, Garmin integration help or billing questions.",
    alternates: { canonical: `${siteUrl}/en/contact` },
    openGraph: {
      url: `${siteUrl}/en/contact`,
      title: "Contact Adapt2Life",
      description: "Schedule a Smart Coach demo or ask the Adapt2Life team your questions.",
      type: "website",
    },
  },
};

export const getContactMetadata = (locale: Locale): Metadata => contactMetadataByLocale[locale] ?? contactMetadataByLocale.fr;

type ContactPageProps = {
  locale: Locale;
};

export function ContactPage({ locale }: ContactPageProps) {
  const copy = CONTACT_COPY[locale] ?? CONTACT_COPY.fr;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading">{copy.heroTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.heroSubtitle}</p>
      </header>

      <ContactForm />

      <section className="rounded-3xl border border-white/10 bg-card/80 p-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.faqTag}</p>
          <h2 className="text-3xl font-heading text-foreground">{copy.faqTitle}</h2>
        </header>
        <div className="space-y-3">
          {copy.faqItems.map((item) => (
            <details key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <summary className="cursor-pointer list-none text-lg font-heading">
                {item.question}
                <span className="ml-3 inline-block text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
