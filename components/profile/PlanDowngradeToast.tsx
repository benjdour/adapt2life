"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type PlanDowngradeToastProps = {
  downgradeAt: string | null;
};

export function PlanDowngradeToast({ downgradeAt }: PlanDowngradeToastProps) {
  useEffect(() => {
    if (!downgradeAt) {
      return;
    }
    const parsed = new Date(downgradeAt);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return;
    }
    const formatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    toast.info("Annulation programmée", {
      description: `Ton abonnement restera actif jusqu’au ${formatter.format(parsed)}. Tu repasseras ensuite sur Starter automatiquement.`,
      duration: 8000,
    });
  }, [downgradeAt]);

  return null;
}
