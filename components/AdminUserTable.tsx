"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  pseudo: string | null;
  email: string | null;
  createdAt: string | null;
  trainingGenerationsRemaining: number | null;
  garminConversionsRemaining: number | null;
};

type AdminUserTableProps = {
  users: AdminUser[];
};

export function AdminUserTable({ users }: AdminUserTableProps) {
  const TRAINING_FREE_CREDITS = 10;
  const CONVERSION_FREE_CREDITS = 5;

  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              <th className="py-2 pr-4 text-center">G / C</th>
              <th className="py-2 pr-4">Inscription</th>
              <th className="py-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const lastName = user.lastName ?? "—";
              const firstName = user.firstName ?? user.pseudo ?? "—";
              const trainingRemaining =
                typeof user.trainingGenerationsRemaining === "number"
                  ? user.trainingGenerationsRemaining
                  : TRAINING_FREE_CREDITS;
              const conversionRemaining =
                typeof user.garminConversionsRemaining === "number"
                  ? user.garminConversionsRemaining
                  : CONVERSION_FREE_CREDITS;
              const trainingUsed = Math.max(0, TRAINING_FREE_CREDITS - trainingRemaining);
              const conversionsUsed = Math.max(0, CONVERSION_FREE_CREDITS - conversionRemaining);
              return (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">{lastName}</td>
                  <td className="py-2 pr-4">{firstName}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{user.email}</td>
                  <td className="py-2 pr-4 text-center text-xs font-semibold">
                    <div className="text-primary">G {trainingUsed}</div>
                    <div className="text-secondary">C {conversionsUsed}</div>
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
