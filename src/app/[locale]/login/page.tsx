import { MarketingLayout } from "@/components/layout/MarketingLayout";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { redirect } from "next/navigation";
import { getLayoutCopy } from "@/lib/layout";

type LoginPageProps = Readonly<{
  params: { locale: Locale };
}>;

type LoginCopy = {
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  submitCta: string;
  helperText: string;
  helperLink: string;
  successMessage: string;
  errorMessages: {
    missingFields: string;
    invalidCredentials: string;
    generic: string;
  };
};

const loginCopy: Record<Locale, LoginCopy> = {
  en: {
    title: "Welcome back",
    subtitle: "Log in to access your adaptive coaching dashboard.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    submitCta: "Login",
    helperText: "Need an account?",
    helperLink: "Create one now",
    successMessage: "You're signed in. Redirecting to your dashboard…",
    errorMessages: {
      missingFields: "Enter your email and password to continue.",
      invalidCredentials: "We couldn't find an account with those credentials.",
      generic: "Something went wrong. Please try again.",
    },
  },
  fr: {
    title: "Ravi de vous revoir",
    subtitle: "Connectez-vous pour accéder à votre coach adaptatif.",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    emailPlaceholder: "vous@example.com",
    passwordPlaceholder: "••••••••",
    submitCta: "Connexion",
    helperText: "Besoin d'un compte ?",
    helperLink: "Créez-en un maintenant",
    successMessage: "Connexion réussie. Redirection vers votre tableau de bord…",
    errorMessages: {
      missingFields: "Saisissez votre e-mail et votre mot de passe.",
      invalidCredentials: "Impossible de trouver un compte avec ces identifiants.",
      generic: "Une erreur est survenue. Veuillez réessayer.",
    },
  },
};

export default async function LoginPage({ params }: LoginPageProps) {
  const locale = params.locale;
  const { session, common, navCta } = await getLayoutCopy(locale);

  if (session?.userId) {
    const targetLocale = session.locale ?? locale;
    redirect(`/${targetLocale}/dashboard`);
  }

  const copy = loginCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: navCta }}
      footer={common.footer}
    >
      <section className="flex flex-grow items-center justify-center bg-gradient-to-br from-blue-700 to-green-700 py-16">
        <div className="w-full max-w-md rounded-3xl border border-green-500/30 bg-gray-900/80 p-10 shadow-2xl backdrop-blur">
          <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">
            {copy.title}
          </h1>
          <p className="mb-8 text-gray-300">{copy.subtitle}</p>

          <LoginForm
            locale={locale}
            copy={{
              emailLabel: copy.emailLabel,
              emailPlaceholder: copy.emailPlaceholder,
              passwordLabel: copy.passwordLabel,
              passwordPlaceholder: copy.passwordPlaceholder,
              submitCta: copy.submitCta,
              errorMessages: copy.errorMessages,
              successMessage: copy.successMessage,
            }}
          />

          <p className="mt-6 text-center text-sm text-gray-400">
            {copy.helperText}{" "}
            <Link
              href={`/${locale}/signup`}
              className="font-semibold text-green-300 hover:text-green-200"
            >
              {copy.helperLink}
            </Link>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
