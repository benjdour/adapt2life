"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LoginCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitCta: string;
  errorMessages: {
    missingFields: string;
    invalidCredentials: string;
    generic: string;
  };
  successMessage: string;
};

type LoginFormProps = {
  locale: string;
  copy: LoginCopy;
};

export function LoginForm({ locale, copy }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const email = (form.get("email") as string | null)?.trim();
        const password = form.get("password") as string | null;

        startTransition(async () => {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json().catch(() => ({
            success: false,
            error: "generic",
          }));

          if (!result.success) {
            if (result.error === "missing_fields") {
              setError(copy.errorMessages.missingFields);
              return;
            }
            if (result.error === "invalid_credentials") {
              setError(copy.errorMessages.invalidCredentials);
              return;
            }
            setError(copy.errorMessages.generic);
            return;
          }

          setSuccess(copy.successMessage);
          formElement.reset();
          router.replace(`/${locale}/dashboard`);
        });
      }}
    >
      <div className="flex flex-col">
        <label
          htmlFor="email"
          className="mb-2 text-sm font-semibold text-gray-200"
        >
          {copy.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={copy.emailPlaceholder}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="password"
          className="mb-2 text-sm font-semibold text-gray-200"
        >
          {copy.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder={copy.passwordPlaceholder}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-gradient-to-r from-blue-500 to-green-500 px-6 py-3 font-semibold text-white transition duration-300 hover:from-blue-600 hover:to-green-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? `${copy.submitCta}…` : copy.submitCta}
      </button>
    </form>
  );
}
