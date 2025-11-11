"use client";

import { useEffect, useMemo, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();

  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      if (reason === "already_connected") {
        toast.info("Garmin déjà connecté.", {
          description: garminUserId ? `userId: ${garminUserId}` : undefined,
        });
      } else if (reason === "reassigned") {
        toast.success("Garmin relié à ce compte.", {
          description: garminUserId ? `userId: ${garminUserId}` : undefined,
        });
      } else {
        toast.success("Garmin connecté !", {
          description: garminUserId ? `userId: ${garminUserId}` : undefined,
        });
      }
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
        onClick={() =>
          startTransition(() => {
            window.location.href = "/api/garmin/oauth/start";
          })
        }
        className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending || isDisconnecting}
      >
        {isPending ? "Ouverture..." : nextActionLabel}
      </button>

      {isConnected ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              startDisconnect(async () => {
                try {
                  const response = await fetch("/api/garmin/disconnect", {
                    method: "POST",
                  });

                  if (!response.ok) {
                    const payload = await response.json().catch(() => ({}));
                    throw new Error(payload.error ?? "Impossible de se déconnecter de Garmin");
                  }

                  toast.success("Garmin déconnecté.");
                  router.refresh();
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Impossible de se déconnecter";
                  toast.error(message);
                }
              })
            }
            className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            disabled={isPending || isDisconnecting}
          >
            {isDisconnecting ? "Déconnexion..." : "Se déconnecter de Garmin"}
          </button>
          {garminUserId ? (
            <span className="inline-flex flex-1 items-center justify-center rounded-md border border-white/15 bg-black/30 px-4 py-2 text-xs font-mono text-white/80">
              userId&nbsp;: {garminUserId}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-white/70">Aucun compte Garmin lié. Cliquez sur le bouton pour démarrer l&apos;OAuth.</p>
      )}

      {isConnected && nextExpiryLabel ? (
        <p className="text-xs text-white/60">Token valide jusqu&apos;au : {nextExpiryLabel}</p>
      ) : null}
    </div>
  );
}
