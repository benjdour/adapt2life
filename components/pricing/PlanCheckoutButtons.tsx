"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type PublicPlanId = "free" | "paid_light" | "paid" | "paid_full";

type Props = {
  planId: PublicPlanId;
  price: { monthly: string; annual: string };
  disabled: boolean;
  isAuthenticated: boolean;
};

type BillingCycle = "monthly" | "annual";

export function PlanCheckoutButtons({ planId, price, disabled, isAuthenticated }: Props) {
  const [loading, setLoading] = useState<BillingCycle | null>(null);

  if (planId === "free") {
    return (
      <Button asChild variant="primary" className="w-full" disabled={disabled}>
        <Link href="/handler/sign-in?redirect=/generateur-entrainement">Commencer maintenant</Link>
      </Button>
    );
  }

  const handleCheckout = async (billingCycle: BillingCycle) => {
    if (disabled) {
      return;
    }

    if (!isAuthenticated) {
      window.location.href = "/handler/sign-in?redirect=/pricing";
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
