"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildLocalePath } from "@/lib/i18n/routing";
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
  locale?: string;
};

const buildSignInHref = (locale: string | undefined, redirect: string) => {
  const targetLocale = locale ?? "fr";
  const signInPath = buildLocalePath(targetLocale as Locale, "/handler/sign-in");
  const redirectPath = buildLocalePath(targetLocale as Locale, redirect);
  return `${signInPath}?redirect=${encodeURIComponent(redirectPath)}`;
};

export function PlanCheckoutButtons({ planId, price, disabled, isAuthenticated, locale }: PlanCheckoutButtonsProps) {
  const [loading, setLoading] = useState<BillingCycle | null>(null);

  if (planId === "free") {
    return (
      <Button asChild variant="primary" className="w-full" disabled={disabled}>
        <Link href={buildSignInHref(locale, "/generateur-entrainement")}>Commencer maintenant</Link>
      </Button>
    );
  }

  const handleCheckout = async (billingCycle: BillingCycle) => {
    if (disabled) {
      return;
    }

    if (!isAuthenticated) {
      window.location.href = buildSignInHref(locale, "/pricing");
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
        throw new Error(data?.error ?? "Impossible de démarrer le paiement.");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de démarrer le paiement.");
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
        Mensuel — {price.monthly}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        isLoading={loading === "annual"}
        onClick={() => handleCheckout("annual")}
      >
        Annuel — {price.annual}
      </Button>
    </div>
  );
}
