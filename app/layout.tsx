import type { Metadata } from "next";
import { StackTheme } from "@stackframe/stack";
import { Inter, Orbitron, Poppins } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { stackServerApp } from "@/stack/server";
import "./globals.css";
import { UiToaster } from "@/components/ui/ui-toaster";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { canAccessAdminArea } from "@/lib/accessControl";
import { ClientStackProvider } from "@/components/stack/ClientStackProvider";
import { getNavigationConfig } from "@/lib/i18n/navigation";
import { getRequestLocale } from "@/lib/i18n/request";
import { Locale } from "@/lib/i18n/locales";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const ogImageUrl = `${siteUrl}/brand/og-image.jpg`;

const BASE_METADATA: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Adapt2Life",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Adapt2Life — Smart Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@adapt2life",
    creator: "@adapt2life",
    images: [ogImageUrl],
  },
};

const LOCALE_METADATA = {
  fr: {
    title: "Adapt2Life",
    description: "Smart Coach Adapt2Life — l’IA qui génère et envoie tes entraînements personnalisés vers Garmin.",
    alternates: { canonical: siteUrl },
    openGraph: {
      title: "Adapt2Life — Smart Coach connecté à Garmin",
      description: "Génère des entraînements personnalisés, synchronisés avec ta montre et adaptés à ta réalité.",
      url: siteUrl,
    },
    twitter: {
      title: "Adapt2Life — Smart Coach connecté à Garmin",
      description: "Des entraînements sur mesure, générés par IA et envoyés sur ta montre.",
    },
  },
  en: {
    title: "Adapt2Life",
    description: "Adapt2Life Smart Coach — AI workouts tailored to you and synced automatically to Garmin.",
    alternates: { canonical: `${siteUrl}/en` },
    openGraph: {
      title: "Adapt2Life — Smart Coach connected to Garmin",
      description: "Generate personalized workouts, synced to your watch and matching real life.",
      url: `${siteUrl}/en`,
    },
    twitter: {
      title: "Adapt2Life — Smart Coach connected to Garmin",
      description: "AI-built sessions, delivered straight to your Garmin watch.",
    },
  },
} satisfies Record<Locale, Partial<Metadata>>;

const ORGANIZATION_SCHEMA_BY_LOCALE = {
  fr: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Adapt2Life",
    url: siteUrl,
    description: "Coach IA connecté à Garmin pour générer des entraînements personnalisés.",
    logo: `${siteUrl}/brand/logo-main.png`,
    sameAs: ["https://www.linkedin.com/company/adapt2life"],
    founder: {
      "@type": "Person",
      name: "Benjamin Dour",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@adapt2life.app",
        availableLanguage: ["fr", "en"],
      },
    ],
    brand: {
      "@type": "Brand",
      name: "Adapt2Life",
      logo: `${siteUrl}/brand/logo-main.png`,
      slogan: "Ton coach IA connecté à Garmin.",
    },
  },
  en: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Adapt2Life",
    url: siteUrl,
    description: "AI coach connected to Garmin to generate and deliver personalized workouts.",
    logo: `${siteUrl}/brand/logo-main.png`,
    sameAs: ["https://www.linkedin.com/company/adapt2life"],
    founder: {
      "@type": "Person",
      name: "Benjamin Dour",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@adapt2life.app",
        availableLanguage: ["fr", "en"],
      },
    ],
    brand: {
      "@type": "Brand",
      name: "Adapt2Life",
      logo: `${siteUrl}/brand/logo-main.png`,
      slogan: "Your AI coach connected to Garmin.",
    },
  },
} satisfies Record<Locale, Record<string, unknown>>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const localized = LOCALE_METADATA[locale] ?? LOCALE_METADATA.fr;
  return {
    ...BASE_METADATA,
    ...localized,
    openGraph: {
      ...BASE_METADATA.openGraph,
      ...localized.openGraph,
    },
    twitter: {
      ...BASE_METADATA.twitter,
      ...localized.twitter,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, locale] = await Promise.all([
    stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" }),
    getRequestLocale(),
  ]);
  const navigationConfig = getNavigationConfig(locale);
  const organizationSchema = ORGANIZATION_SCHEMA_BY_LOCALE[locale] ?? ORGANIZATION_SCHEMA_BY_LOCALE.fr;

  return (
    <html lang={locale}>
      <head>
        <Script
          id="gtm-base"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TSRVXW8V');",
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} ${orbitron.variable} min-h-screen bg-background text-foreground`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TSRVXW8V"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ClientStackProvider>
          <StackTheme>
            <div className="flex min-h-screen flex-col">
              <TopNav
                isAuthenticated={Boolean(user)}
                showAdminLink={canAccessAdminArea(user?.id)}
                navigation={navigationConfig}
                locale={locale}
              />
              <main className="flex-1">{children}</main>
              <Footer navigation={navigationConfig} />
            </div>
            <UiToaster />
            <Analytics />
            <SpeedInsights />
            <script
              type="application/ld+json"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(organizationSchema),
              }}
            />
          </StackTheme>
        </ClientStackProvider>
      </body>
    </html>
  );
}
