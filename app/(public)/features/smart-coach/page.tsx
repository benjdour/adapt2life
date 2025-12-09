import type { Metadata } from "next";

import { SmartCoachPage, getSmartCoachMetadata } from "./SmartCoachPage";

export const metadata: Metadata = getSmartCoachMetadata("fr");

export default function SmartCoachRoute() {
  return <SmartCoachPage locale="fr" />;
}
