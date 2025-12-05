"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEFAULT_USER_PLAN, USER_PLAN_OPTIONS, getUserPlanConfig } from "@/lib/constants/userPlans";

type AdminUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  pseudo: string | null;
  email: string | null;
  createdAt: string | null;
  trainingGenerationsRemaining: number | null;
  garminConversionsRemaining: number | null;
   trainingGenerationsUsedMonth: number | null;
   garminConversionsUsedMonth: number | null;
  planType: string | null;
};

type AdminUserTableProps = {
  users: AdminUser[];
};

export function AdminUserTable({ users }: AdminUserTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planUpdatingId, setPlanUpdatingId] = useState<number | null>(null);

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Supprimer définitivement cet utilisateur et toutes ses données ?")) {
      return;
    }
    setError(null);
    setDeletingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = typeof payload?.error === "string" ? payload.error : "Impossible de supprimer l’utilisateur.";
        setError(message);
        return;
      }
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erreur réseau.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) {
      return "—";
    }
    try {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoDate));
    } catch {
      return isoDate;
    }
  };

  const handlePlanChange = async (userId: number, planType: string) => {
    setError(null);
    setPlanUpdatingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = typeof payload?.error === "string" ? payload.error : "Impossible de mettre à jour le plan.";
        setError(message);
        return;
      }
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erreur réseau.");
    } finally {
      setPlanUpdatingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-4">Nom</th>
              <th className="py-2 pr-4">Prénom</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Plan</th>
              <th className="py-2 pr-4 text-center">G / C</th>
              <th className="py-2 pr-4">Inscription</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const lastName = user.lastName ?? "—";
              const firstName = user.firstName ?? user.pseudo ?? "—";
              const planConfig = getUserPlanConfig(user.planType ?? DEFAULT_USER_PLAN);
              const trainingCap = planConfig.trainingQuota;
              const conversionCap = planConfig.conversionQuota;
              const trainingUsageCounter =
                typeof user.trainingGenerationsUsedMonth === "number" ? Math.max(0, user.trainingGenerationsUsedMonth) : 0;
              const conversionUsageCounter =
                typeof user.garminConversionsUsedMonth === "number" ? Math.max(0, user.garminConversionsUsedMonth) : 0;
              const trainingUsed = trainingCap === null ? trainingUsageCounter : Math.min(trainingUsageCounter, trainingCap);
              const conversionsUsed =
                conversionCap === null ? conversionUsageCounter : Math.min(conversionUsageCounter, conversionCap);
              return (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">{lastName}</td>
                  <td className="py-2 pr-4">{firstName}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{user.email}</td>
                  <td className="py-2 pr-4">
                    <p className="text-xs font-semibold text-primary">{planConfig.label}</p>
                    <select
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      value={user.planType ?? DEFAULT_USER_PLAN}
                      disabled={planUpdatingId === user.id}
                      onChange={(event) => {
                        const nextPlan = event.target.value;
                        if (nextPlan === (user.planType ?? DEFAULT_USER_PLAN)) {
                          return;
                        }
                        handlePlanChange(user.id, nextPlan);
                      }}
                    >
                      {USER_PLAN_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4 text-center text-xs font-semibold">
                    <div className="text-primary">
                      G {trainingCap === null ? `${trainingUsed} / ∞` : `${trainingUsed}/${trainingCap}`}
                    </div>
                    <div className="text-secondary">
                      C {conversionCap === null ? `${conversionsUsed} / ∞` : `${conversionsUsed}/${conversionCap}`}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="py-2 pr-0 text-right">
                    <Button variant="error" size="sm" disabled={deletingId === user.id} onClick={() => handleDelete(user.id)}>
                      {deletingId === user.id ? "Suppression..." : "Supprimer"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 ? <p className="py-4 text-muted-foreground">Aucun utilisateur pour le moment.</p> : null}
      </div>
    </div>
  );
}
