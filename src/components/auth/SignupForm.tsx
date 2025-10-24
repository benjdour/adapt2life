"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type SignupCopy = {
  fields: {
    firstNameLabel: string;
    firstNamePlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    goalLabel: string;
    goalPlaceholder: string;
  };
  goalOptions: Array<{ value: string; label: string }>;
  newsletterLabel: string;
  terms: {
    prefix: string;
    termsLabel: string;
    privacyLabel: string;
    suffix: string;
  };
  submitCta: string;
  successMessage: string;
  errorMessages: {
    missingFields: string;
    emailExists: string;
    generic: string;
  };
};

type SignupFormProps = {
  locale: string;
  copy: SignupCopy;
};

export function SignupForm({ locale, copy }: SignupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const formElement = event.currentTarget as HTMLFormElement;
        const form = new FormData(formElement);
        const firstName = (form.get("firstName") as string | null)?.trim();
        const lastName = (form.get("lastName") as string | null)?.trim();
        const email = (form.get("email") as string | null)?.trim();
        const password = form.get("password") as string | null;
        const goal = form.get("goal") as string | null;
        const newsletter = form.get("newsletter") === "on";

        startTransition(async () => {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              password,
              goal,
              newsletter,
              locale,
            }),
          });

          const result = await response.json().catch(() => ({
            success: false,
            error: "generic",
          }));

          if (!result.success) {
            if (result.error === "missing_fields") {
              const message = copy.errorMessages.missingFields;
              setError(message);
              toast.error(message);
              return;
            }
            if (result.error === "email_exists") {
              const message = copy.errorMessages.emailExists;
              setError(message);
              toast.error(message);
              return;
            }
            const message = copy.errorMessages.generic;
            setError(message);
            toast.error(message);
            return;
          }

          toast.success(copy.successMessage);
          formElement.reset();
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
        <div className="flex flex-col">
          <label
            htmlFor="firstName"
            className="mb-2 text-sm font-semibold text-gray-100"
          >
            {copy.fields.firstNameLabel}
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder={copy.fields.firstNamePlaceholder}
            className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="lastName"
            className="mb-2 text-sm font-semibold text-gray-100"
          >
            {copy.fields.lastNameLabel}
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            placeholder={copy.fields.lastNamePlaceholder}
            className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="email"
          className="mb-2 text-sm font-semibold text-gray-100"
        >
          {copy.fields.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={copy.fields.emailPlaceholder}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="password"
          className="mb-2 text-sm font-semibold text-gray-100"
        >
          {copy.fields.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder={copy.fields.passwordPlaceholder}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="goal"
          className="mb-2 text-sm font-semibold text-gray-100"
        >
          {copy.fields.goalLabel}
        </label>
        <select
          id="goal"
          name="goal"
          defaultValue=""
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        >
          <option value="" disabled>
            {copy.fields.goalPlaceholder}
          </option>
          {copy.goalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 text-sm text-gray-300">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="newsletter"
            className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
          />
          <span>{copy.newsletterLabel}</span>
        </label>
        <p className="text-xs text-gray-400">
          {copy.terms.prefix}{" "}
          <Link
            href={`/${locale}/terms-of-use`}
            className="font-semibold text-green-300 hover:text-green-200"
          >
            {copy.terms.termsLabel}
          </Link>{" "}
          &amp;{" "}
          <Link
            href={`/${locale}/privacy-policy`}
            className="font-semibold text-green-300 hover:text-green-200"
          >
            {copy.terms.privacyLabel}
          </Link>
          {copy.terms.suffix}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
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
