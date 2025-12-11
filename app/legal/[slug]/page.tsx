import type { Metadata } from "next";

import { LegalPage, ensureLegalSlug, getLegalMetadata, legalStaticParams } from "@/app/(public)/legal/LegalPage";

type PageParams = { slug: string };

export function generateStaticParams() {
  return legalStaticParams;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const resolved = await params;
  const slug = ensureLegalSlug(resolved.slug);
  return getLegalMetadata("fr", slug);
}

export default async function LegalRoute({ params }: { params: Promise<PageParams> }) {
  const resolved = await params;
  const slug = ensureLegalSlug(resolved.slug);
  return <LegalPage slug={slug} locale="fr" />;
}
