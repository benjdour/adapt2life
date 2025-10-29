"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  isConnected: boolean;
  garminUserId?: string;
  status?: "success" | "error";
  reason?: string;
  accessTokenExpiresAt?: string;
};

const statusMessages: Record<string, { title: string; description?: string }> = {
  authorization_declined: {
    title: "Connexion annulée.",
    description: "Vous avez refusé l'accès dans Garmin Connect.",
  },
  missing_parameters: {
    title: "Réponse invalide.",
    description: "Certains paramètres de retour sont manquants.",
  },
  invalid_session: {
    title: "Session expirée.",
    description: "Relancez la connexion depuis Adapt2Life.",
  },
  invalid_state: {
    title: "Protection anti-CSRF invalide.",
    description: "Relancez la connexion pour générer un nouvel état sécurisé.",
  },
  unauthorized: {
    title: "Session utilisateur absente.",
    description: "Reconnectez-vous à Adapt2Life avant d'autoriser Garmin.",
  },
  user_not_found: {
    title: "Profil Adapt2Life introuvable.",
  },
  already_linked: {
    title: "Compte Garmin déjà lié.",
    description: "Ce compte Garmin est déjà associé à un autre utilisateur.",
  },
  oauth_failed: {
    title: "Erreur OAuth Garmin.",
    description: "Impossible d'échanger le code contre des tokens.",
  },
  unexpected_error: {
    title: "Erreur inattendue.",
    description: "Merci de réessayer ou de contacter le support.",
  },
};

export function GarminIntegrationActions({
  isConnected,
  garminUserId,
  status,
  reason,
  accessTokenExpiresAt,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      toast.success("Garmin connecté !", {
        description: garminUserId ? `userId: ${garminUserId}` : undefined,
      });
    } else {
      const message = reason ? statusMessages[reason] : undefined;
      toast.error(message?.title ?? "Connexion Garmin échouée.", {
        description: message?.description,
      });
    }

    const timeout = setTimeout(() => {
      router.replace("/integrations/garmin");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [garminUserId, reason, router, status]);

  const nextActionLabel = useMemo(() => {
    if (isConnected) {
      return "Reconnecter Garmin";
    }
    return "Connecter Garmin";
  }, [isConnected]);

  const nextExpiryLabel = useMemo(() => {
    if (!accessTokenExpiresAt) return null;
    const date = new Date(accessTokenExpiresAt);
    return date.toLocaleString();
  }, [accessTokenExpiresAt]);

  return (
    <div className="mt-6 space-y-4">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/api/garmin/oauth/start";
        }}
        className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        {nextActionLabel}
      </button>

      {isConnected ? (
        <div className="rounded-md border border-emerald-700/40 bg-emerald-900/30 p-4 text-sm text-emerald-50">
          <p className="font-medium">Statut : Connecté</p>
          {garminUserId ? <p className="mt-1 text-emerald-100/90">Garmin userId : {garminUserId}</p> : null}
          {nextExpiryLabel ? (
            <p className="mt-1 text-emerald-100/80">Token valide jusqu&apos;au : {nextExpiryLabel}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-white/70">Aucun compte Garmin lié. Cliquez sur le bouton pour démarrer l&apos;OAuth.</p>
      )}
    </div>
  );
}
