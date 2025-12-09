import type { Metadata } from "next";

import { AboutPage, getAboutMetadata } from "./AboutPage";

export const metadata: Metadata = getAboutMetadata("fr");

export default function AboutRoute() {
  return <AboutPage locale="fr" />;
}
