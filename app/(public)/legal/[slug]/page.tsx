import type { Metadata } from "next";

import { LegalPage, ensureLegalSlug, getLegalMetadata, legalStaticParams } from "@/app/(public)/legal/LegalPage";

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return legalStaticParams;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = ensureLegalSlug(params.slug);
  return getLegalMetadata("fr", slug);
}

export default function LegalRoute({ params }: PageProps) {
  const slug = ensureLegalSlug(params.slug);
  return <LegalPage slug={slug} locale="fr" />;
}
