import Link from "next/link";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { getCommonCopy } from "@/i18n/common";
import type { Locale } from "@/i18n/config";
import { SignupForm } from "@/components/auth/SignupForm";

type SignupPageProps = Readonly<{
  params: { locale: Locale };
}>;

type SignupCopy = {
  title: string;
  subtitle: string;
  description: string;
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
  submitCta: string;
  newsletterLabel: string;
  terms: {
    prefix: string;
    termsLabel: string;
    privacyLabel: string;
    suffix: string;
  };
  loginPrompt: string;
  loginLinkLabel: string;
  successMessage: string;
  errorMessages: {
    missingFields: string;
    emailExists: string;
    generic: string;
  };
  sidebar: {
    title: string;
    items: string[];
  };
};

const signupCopy: Record<Locale, SignupCopy> = {
  en: {
    title: "Create your Adapt2Life account",
    subtitle: "Step inside your adaptive coaching experience.",
    description:
      "Tell us a little about you so we can tailor your training plan from day one.",
    fields: {
      firstNameLabel: "First name",
      firstNamePlaceholder: "Alex",
      lastNameLabel: "Last name",
      lastNamePlaceholder: "Taylor",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Create a password",
      goalLabel: "Primary goal",
      goalPlaceholder: "Select your focus",
    },
    goalOptions: [
      { value: "performance", label: "Improve performance" },
      { value: "balance", label: "Balance work and training" },
      { value: "health", label: "Build healthy habits" },
      { value: "recovery", label: "Return after injury" },
    ],
    submitCta: "Create account",
    newsletterLabel: "Send me personalized training insights and updates.",
    terms: {
      prefix: "By continuing, you agree to our",
      termsLabel: "Terms of Use",
      privacyLabel: "Privacy Policy",
      suffix: "",
    },
    loginPrompt: "Already have an account?",
    loginLinkLabel: "Log in",
    successMessage: "Account created successfully. You can log in now.",
    errorMessages: {
      missingFields: "Please fill in all required fields.",
      emailExists: "An account with this email already exists.",
      generic: "We couldn't create your account. Please try again.",
    },
    sidebar: {
      title: "Adaptation starts here",
      items: [
        "Receive workouts that adjust dynamically to your schedule and recovery status.",
        "Connect your wearables to unlock deeper insights and weekly performance summaries.",
        "Collaborate with our AI coach to balance ambition with sustainable progress.",
      ],
    },
  },
  fr: {
    title: "Créez votre compte Adapt2Life",
    subtitle: "Entrez dans votre expérience de coaching adaptatif.",
    description:
      "Parlez-nous un peu de vous pour que nous puissions personnaliser votre programme dès le premier jour.",
    fields: {
      firstNameLabel: "Prénom",
      firstNamePlaceholder: "Alex",
      lastNameLabel: "Nom",
      lastNamePlaceholder: "Dupont",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "vous@example.com",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Créez un mot de passe",
      goalLabel: "Objectif principal",
      goalPlaceholder: "Sélectionnez votre objectif",
    },
    goalOptions: [
      { value: "performance", label: "Améliorer les performances" },
      { value: "balance", label: "Equilibrer travail et entraînement" },
      { value: "health", label: "Installer de bonnes habitudes" },
      { value: "recovery", label: "Reprendre après une blessure" },
    ],
    submitCta: "Créer mon compte",
    newsletterLabel: "Envoyez-moi des conseils personnalisés et des nouveautés.",
    terms: {
      prefix: "En continuant, vous acceptez nos",
      termsLabel: "Conditions d'utilisation",
      privacyLabel: "Politique de confidentialité",
      suffix: "",
    },
    loginPrompt: "Vous avez déjà un compte ?",
    loginLinkLabel: "Connectez-vous",
    successMessage: "Compte créé avec succès. Vous pouvez vous connecter.",
    errorMessages: {
      missingFields: "Merci de renseigner tous les champs obligatoires.",
      emailExists: "Un compte existe déjà avec cet e-mail.",
      generic: "Impossible de créer votre compte. Veuillez réessayer.",
    },
    sidebar: {
      title: "L'adaptation commence ici",
      items: [
        "Recevez des entraînements qui s'ajustent en temps réel à votre emploi du temps et à votre récupération.",
        "Connectez vos objets connectés pour accéder à des analyses approfondies et des bilans hebdomadaires.",
        "Collaborez avec notre coach IA pour allier ambition et progression durable.",
      ],
    },
  },
};

export default function SignupPage({ params }: SignupPageProps) {
  const locale = params.locale;
  const common = getCommonCopy(locale);
  const copy = signupCopy[locale];

  return (
    <MarketingLayout
      locale={locale}
      nav={{ items: common.navItems, cta: common.navCta }}
      footer={common.footer}
    >
      <section className="flex flex-grow items-center justify-center bg-gradient-to-br from-blue-700 to-green-700 py-16">
        <div className="w-full max-w-4xl rounded-3xl border border-green-500/30 bg-gray-900/80 p-10 shadow-2xl backdrop-blur">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-lg text-green-200 md:text-xl">
              {copy.subtitle}
            </p>
            <p className="mt-4 text-sm text-gray-300 md:text-base">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <SignupForm
              locale={locale}
              copy={{
                fields: {
                  firstNameLabel: copy.fields.firstNameLabel,
                  firstNamePlaceholder: copy.fields.firstNamePlaceholder,
                  lastNameLabel: copy.fields.lastNameLabel,
                  lastNamePlaceholder: copy.fields.lastNamePlaceholder,
                  emailLabel: copy.fields.emailLabel,
                  emailPlaceholder: copy.fields.emailPlaceholder,
                  passwordLabel: copy.fields.passwordLabel,
                  passwordPlaceholder: copy.fields.passwordPlaceholder,
                  goalLabel: copy.fields.goalLabel,
                  goalPlaceholder: copy.fields.goalPlaceholder,
                },
                goalOptions: copy.goalOptions,
                newsletterLabel: copy.newsletterLabel,
                terms: copy.terms,
                submitCta: copy.submitCta,
                successMessage: copy.successMessage,
                errorMessages: copy.errorMessages,
              }}
            />

            <aside className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-left text-sm text-gray-200">
              <h3 className="text-lg font-semibold text-white">
                {copy.sidebar.title}
              </h3>
              <ul className="space-y-3 marker:text-green-300">
                {copy.sidebar.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 text-lg text-green-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400">
                {copy.loginPrompt}{" "}
                <Link
                  href={`/${locale}/login`}
                  className="font-semibold text-green-300 hover:text-green-200"
                >
                  {copy.loginLinkLabel}
                </Link>
              </p>
            </aside>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
