import type { Metadata } from "next";

import { FeaturesPage, getFeaturesMetadata } from "./FeaturesPage";

export const metadata: Metadata = getFeaturesMetadata("fr");

export default function FeaturesRoute() {
  return <FeaturesPage locale="fr" />;
}
