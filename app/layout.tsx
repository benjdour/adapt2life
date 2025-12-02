import type { Metadata } from "next";
import { StackTheme } from "@stackframe/stack";
import { Inter, Orbitron, Poppins } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getStackClientApp } from "@/stack/client";
import { stackServerApp } from "@/stack/server";
import "./globals.css";
import { UiToaster } from "@/components/ui/ui-toaster";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { canAccessAdminArea } from "@/lib/accessControl";
import { ClientStackProvider } from "@/components/stack/ClientStackProvider";

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
const organizationSchema = {
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
};

export const metadata: Metadata = {
  title: "Adapt2Life",
  description: "Your AI-powered training companion",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Adapt2Life — Ton coach IA connecté à Garmin",
    description: "Génère des entraînements personnalisés, synchronisés avec ta montre et adaptés à ta réalité.",
    siteName: "Adapt2Life",
    images: [
      {
        url: `${siteUrl}/brand/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Adapt2Life - Coach IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@adapt2life",
    creator: "@adapt2life",
    title: "Adapt2Life — Ton coach IA connecté à Garmin",
    description: "Des entraînements sur mesure, générés par IA et envoyés sur ta montre.",
    images: [`${siteUrl}/brand/og-image.jpg`],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });
  const stackApp = getStackClientApp();

  return (
    <html lang="en">
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
        <ClientStackProvider app={stackApp}>
          <StackTheme>
            <div className="flex min-h-screen flex-col">
              <TopNav isAuthenticated={Boolean(user)} showAdminLink={canAccessAdminArea(user?.id)} />
              <main className="flex-1">{children}</main>
              <Footer />
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
