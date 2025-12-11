"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildSignInUrl } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

export type PublicPlanId = "free" | "paid_light" | "paid" | "paid_full";

type Props = {
  planId: PublicPlanId;
  price: { monthly: string; annual: string };
  disabled: boolean;
  isAuthenticated: boolean;
};

type BillingCycle = "monthly" | "annual";

type PlanCheckoutButtonsProps = Props & {
  locale?: Locale;
};

const BUTTON_COPY: Record<
  Locale,
  {
    startNow: string;
    monthlyLabel: string;
    annualLabel: string;
    checkoutError: string;
    genericError: string;
  }
> = {
  fr: {
    startNow: "Commencer maintenant",
    monthlyLabel: "Mensuel",
    annualLabel: "Annuel",
    checkoutError: "Impossible de démarrer le paiement.",
    genericError: "Impossible de démarrer le paiement.",
  },
  en: {
    startNow: "Start now",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    checkoutError: "Unable to start checkout.",
    genericError: "Unable to start checkout.",
  },
};

const buildSignInHref = (locale: Locale, redirect: string) => buildSignInUrl(locale, redirect);

export function PlanCheckoutButtons({ planId, price, disabled, isAuthenticated, locale }: PlanCheckoutButtonsProps) {
  const resolvedLocale: Locale = locale ?? "fr";
  const copy = BUTTON_COPY[resolvedLocale] ?? BUTTON_COPY.fr;
  const [loading, setLoading] = useState<BillingCycle | null>(null);

  if (planId === "free") {
    return (
      <Button asChild variant="primary" className="w-full" disabled={disabled}>
        <Link href={buildSignInHref(resolvedLocale, "/generateur-entrainement")}>{copy.startNow}</Link>
      </Button>
    );
  }

  const handleCheckout = async (billingCycle: BillingCycle) => {
    if (disabled) {
      return;
    }

    if (!isAuthenticated) {
      window.location.href = buildSignInHref(resolvedLocale, "/pricing");
      return;
    }

    setLoading(billingCycle);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? copy.checkoutError);
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.genericError);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={disabled}
        isLoading={loading === "monthly"}
        onClick={() => handleCheckout("monthly")}
      >
        {copy.monthlyLabel} — {price.monthly}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        isLoading={loading === "annual"}
        onClick={() => handleCheckout("annual")}
      >
        {copy.annualLabel} — {price.annual}
      </Button>
    </div>
  );
}
