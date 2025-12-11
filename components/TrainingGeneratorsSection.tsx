"use client";

import { TrainingPlanGeneratorForm } from "@/components/TrainingPlanGeneratorForm";
import { Locale } from "@/lib/i18n/locales";

type TrainingGeneratorsSectionProps = {
  locale: Locale;
};

export function TrainingGeneratorsSection({ locale }: TrainingGeneratorsSectionProps) {
  return <TrainingPlanGeneratorForm enableInlineSend locale={locale} />;
}
