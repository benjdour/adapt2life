import type { Metadata } from "next";

import { FaqPage, getFaqMetadata } from "./FaqPage";

export const metadata: Metadata = getFaqMetadata("fr");

export default function FaqRoute() {
  return <FaqPage locale="fr" />;
}
