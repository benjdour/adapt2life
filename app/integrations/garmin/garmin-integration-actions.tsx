"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/locales";

type ActionStatusMessage = {
  title: string;
  description?: string;
};

type GarminIntegrationActionsCopy = {
  connectLabel: string;
  reconnectLabel: string;
  disconnectLabel: string;
  alreadyConnectedToast: string;
  reassignToast: string;
  successToast: string;
  disconnectSuccess: string;
  disconnectError: string;
  genericError: string;
  maskedUserLabel: string;
  tokenValidUntilLabel: string;
  statusMessages: Record<string, ActionStatusMessage>;
};

type Props = {
  isConnected: boolean;
  garminUserId?: string;
  status?: "success" | "error";
  reason?: string;
  accessTokenExpiresAt?: string;
  copy: GarminIntegrationActionsCopy;
  locale: Locale;
  redirectPath: string;
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
  copy,
  locale,
  redirectPath,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const maskedGarminUserId = useMemo(() => obfuscateGarminUserId(garminUserId), [garminUserId]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      if (reason === "already_connected") {
        toast.info(copy.alreadyConnectedToast, {
          description: maskedGarminUserId ? `${copy.maskedUserLabel} ${maskedGarminUserId}` : undefined,
        });
      } else if (reason === "reassigned") {
        toast.success(copy.reassignToast, {
          description: maskedGarminUserId ? `${copy.maskedUserLabel} ${maskedGarminUserId}` : undefined,
        });
      } else {
        toast.success(copy.successToast, {
          description: maskedGarminUserId ? `${copy.maskedUserLabel} ${maskedGarminUserId}` : undefined,
        });
      }
    } else {
      const message = reason ? copy.statusMessages[reason] : undefined;
      toast.error(message?.title ?? copy.genericError, {
        description: message?.description,
      });
    }

    const timeout = setTimeout(() => {
      router.replace(redirectPath);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [copy, maskedGarminUserId, reason, redirectPath, router, status]);

  const nextActionLabel = useMemo(() => {
    if (isConnected) {
      return copy.reconnectLabel;
    }
    return copy.connectLabel;
  }, [copy.connectLabel, copy.reconnectLabel, isConnected]);

  const nextExpiryLabel = useMemo(() => {
    if (!accessTokenExpiresAt) return null;
    const date = new Date(accessTokenExpiresAt);
    return `${copy.tokenValidUntilLabel} ${dateFormatter.format(date)}`;
  }, [accessTokenExpiresAt, copy, dateFormatter]);

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
                    throw new Error(payload.error ?? copy.disconnectError);
                  }

                  toast.success(copy.disconnectSuccess);
                  router.refresh();
                } catch (error) {
                  const message = error instanceof Error ? error.message : copy.disconnectError;
                  toast.error(copy.disconnectError, { description: message !== copy.disconnectError ? message : undefined });
                }
              })
            }
            className="w-full sm:w-auto"
            disabled={isPending || isDisconnecting}
            isLoading={isDisconnecting}
          >
            {copy.disconnectLabel}
          </Button>
          {maskedGarminUserId ? (
            <span className="inline-flex flex-1 items-center justify-center break-all rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-mono text-muted-foreground">
              {copy.maskedUserLabel}&nbsp;{maskedGarminUserId}
            </span>
          ) : null}
        </div>
      ) : null}

      {isConnected && nextExpiryLabel ? (
        <p className="text-xs text-muted-foreground">{nextExpiryLabel}</p>
      ) : null}
    </div>
  );
}
