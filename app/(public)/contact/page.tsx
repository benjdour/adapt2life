import type { Metadata } from "next";

import { ContactPage, getContactMetadata } from "./ContactPage";

export const metadata: Metadata = getContactMetadata("fr");

export default function ContactRoute() {
  return <ContactPage locale="fr" />;
}
