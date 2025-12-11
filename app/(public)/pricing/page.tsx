import type { Metadata } from "next";

import { PricingPage, getPricingMetadata } from "./PricingPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = getPricingMetadata("fr");

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PricingRoute({ searchParams }: PageProps) {
  return <PricingPage locale="fr" searchParams={searchParams} />;
}
