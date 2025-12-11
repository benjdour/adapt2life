"use client";

import { useEffect, useMemo, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildLocalePath, deriveLocaleFromPathname } from "@/lib/i18n/routing";

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

const obfuscateGarminUserId = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  const maskLength = Math.max(trimmed.length - 8, 3);
  return `${prefix}${"*".repeat(maskLength)}${suffix}`;
};

export function GarminIntegrationActions({
  isConnected,
  garminUserId,
  status,
  reason,
  accessTokenExpiresAt,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = deriveLocaleFromPathname(pathname);
  const integrationPath = buildLocalePath(locale, "/integrations/garmin");
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const maskedGarminUserId = useMemo(() => obfuscateGarminUserId(garminUserId), [garminUserId]);

  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      if (reason === "already_connected") {
        toast.info("Garmin déjà connecté.", {
          description: maskedGarminUserId ? `userId: ${maskedGarminUserId}` : undefined,
        });
      } else if (reason === "reassigned") {
        toast.success("Garmin relié à ce compte.", {
          description: maskedGarminUserId ? `userId: ${maskedGarminUserId}` : undefined,
        });
      } else {
        toast.success("Garmin connecté !", {
          description: maskedGarminUserId ? `userId: ${maskedGarminUserId}` : undefined,
        });
      }
    } else {
      const message = reason ? statusMessages[reason] : undefined;
      toast.error(message?.title ?? "Connexion Garmin échouée.", {
        description: message?.description,
      });
    }

    const timeout = setTimeout(() => {
      router.replace(integrationPath);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [integrationPath, maskedGarminUserId, reason, router, status]);

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
      <Button
        type="button"
        onClick={() =>
          startTransition(() => {
            window.location.href = "/api/garmin/oauth/start";
          })
        }
        variant="primary"
        className="w-full"
        disabled={isPending || isDisconnecting}
        isLoading={isPending}
      >
        {nextActionLabel}
      </Button>

      {isConnected ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
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
            className="w-full sm:w-auto"
            disabled={isPending || isDisconnecting}
            isLoading={isDisconnecting}
          >
            Déconnecter Garmin
          </Button>
          {maskedGarminUserId ? (
            <span className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-muted-foreground">
              userId&nbsp;: {maskedGarminUserId}
            </span>
          ) : null}
        </div>
      ) : null}

      {isConnected && nextExpiryLabel ? (
        <p className="text-xs text-muted-foreground">Token valide jusqu&apos;au : {nextExpiryLabel}</p>
      ) : null}
    </div>
  );
}
