import type { Metadata } from "next";

import { HowItWorksPage, getHowItWorksMetadata } from "./HowItWorksPage";

export const metadata: Metadata = getHowItWorksMetadata("fr");

export default function HowItWorksRoute() {
  return <HowItWorksPage locale="fr" />;
}
