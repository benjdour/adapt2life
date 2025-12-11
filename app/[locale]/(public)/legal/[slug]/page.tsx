import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveLocale } from "@/lib/i18n/routing";
import { buildLegalCanonical, buildLegalStaticParams, findLegalPage } from "@/lib/legal/content";

export function generateStaticParams() {
  return buildLegalStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolveLocale(resolvedParams.locale);
  const page = findLegalPage(locale, resolvedParams.slug);
  if (!page) {
    return {};
  }
  const copy = page.copy[locale];
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: buildLegalCanonical(locale, page.slugs[locale]),
    },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolveLocale(resolvedParams.locale);
  const page = findLegalPage(locale, resolvedParams.slug);
  if (!page) {
    notFound();
  }
  const copy = page.copy[locale];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.headerTag}</p>
        <h1 className="text-4xl font-heading">{copy.headerTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.updatedAt}</p>
      </header>

      {copy.sections.map((section) => (
        <section key={`${page.id}-${section.title}`} className="space-y-3 rounded-2xl border border-white/10 bg-card/80 p-6 shadow-lg">
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
