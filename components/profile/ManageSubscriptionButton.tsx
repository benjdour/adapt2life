"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ManageSubscriptionButtonProps = {
  canManage: boolean;
};

export function ManageSubscriptionButton({ canManage }: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!canManage) {
    return null;
  }

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Impossible d’ouvrir le portail de facturation.");
      }
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’ouvrir le portail de facturation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} isLoading={isLoading} className="w-full sm:w-auto">
      Gérer mon abonnement
    </Button>
  );
}
