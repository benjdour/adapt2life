import { MarketingLayout } from "@/components/layout/MarketingLayout";
import type { Locale } from "@/i18n/config";
import { getLayoutCopy } from "@/lib/layout";

type LegalNoticePageProps = Readonly<{
  params: { locale: Locale };
}>;

type LegalListItem = {
  label: string;
  value: string;
};

type LegalSection =
  | {
      type: "list";
      title: string;
      items: LegalListItem[];
    }
  | {
      type: "paragraphs";
      title: string;
      paragraphs: string[];
    };

type LegalNoticeCopy = {
  pageTitle: string;
  updatedAt: string;
  sections: LegalSection[];
};

const legalNoticeCopy: Record<Locale, LegalNoticeCopy> = {
  en: {
    pageTitle: "Legal Notice",
    updatedAt: "Last Updated: January 15, 2025",
    sections: [
      {
        type: "list",
        title: "Website Publisher Information",
        items: [
          { label: "Company Name", value: "Adapt2Life Inc." },
          { label: "Legal Form", value: "Corporation" },
          {
            label: "Registered Office Address",
            value: "115 rue Jean Lefevre, La Malbaie, QC, G5A 1V3, Canada",
          },
          { label: "Email Address", value: "contact@adapt2life.app" },
        ],
      },
      {
        type: "paragraphs",
        title: "Publication Director",
        paragraphs: ["Benjamin Dour"],
      },
      {
        type: "list",
        title: "Hosting Information",
        items: [
          { label: "Host Name", value: "Vercel Inc." },
          {
            label: "Host Address",
            value: "440 N Barranca Ave #4133, Covina, CA, 91723, United States",
          },
        ],
      },
      {
        type: "paragraphs",
        title: "Intellectual Property",
        paragraphs: [
          "All content on this website, including graphics, images, texts, videos, animations, sounds, logos, and icons, as well as their formatting, are the exclusive property of Adapt2Life Inc., with the exception of trademarks, logos, or content belonging to partner companies or authors.",
        ],
      },
    ],
  },
  fr: {
    pageTitle: "Mentions légales",
    updatedAt: "Mis à jour le : 15 janvier 2025",
    sections: [
      {
        type: "list",
        title: "Informations sur l'éditeur du site",
        items: [
          { label: "Raison sociale", value: "Adapt2Life Inc." },
          { label: "Forme juridique", value: "Corporation" },
          {
            label: "Siège social",
            value: "115 rue Jean Lefevre, La Malbaie, QC, G5A 1V3, Canada",
          },
          { label: "Adresse e-mail", value: "contact@adapt2life.app" },
        ],
      },
      {
        type: "paragraphs",
        title: "Directeur de la publication",
        paragraphs: ["Benjamin Dour"],
      },
      {
        type: "list",
        title: "Hébergement",
        items: [
          { label: "Hébergeur", value: "Vercel Inc." },
          {
            label: "Adresse de l'hébergeur",
            value: "440 N Barranca Ave #4133, Covina, CA, 91723, États-Unis",
          },
        ],
      },
      {
        type: "paragraphs",
        title: "Propriété intellectuelle",
        paragraphs: [
          "L'ensemble du contenu de ce site (graphismes, images, textes, vidéos, animations, sons, logos, icônes) ainsi que leur mise en forme sont la propriété exclusive d'Adapt2Life Inc., à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.",
        ],
      },
    ],
  },
};

export default async function LegalNoticePage({ params }: LegalNoticePageProps) {
  const locale = params.locale;
  const { common, navCta } = await getLayoutCopy(locale);
  const copy = legalNoticeCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: navCta }}
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
              {section.type === "list" ? (
                <ul className="space-y-2 pl-5 text-gray-300">
                  {section.items.map((item) => (
                    <li key={item.label} className="list-disc">
                      <span className="font-semibold text-white">{item.label}:</span>{" "}
                      {item.value}
                    </li>
                  ))}
                </ul>
              ) : (
                section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-2 text-gray-300">
                    {paragraph}
                  </p>
                ))
              )}
            </section>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
