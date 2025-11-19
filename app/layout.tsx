import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Inter, Orbitron, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { stackClientApp } from "@/stack/client";
import { stackServerApp } from "@/stack/server";
import "./globals.css";
import { UiToaster } from "@/components/ui/ui-toaster";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

const debugGeneratorUserIds = (process.env.DEBUG_GENERATOR_USER_IDS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

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

export const metadata: Metadata = {
  title: "Adapt2Life",
  description: "Your AI-powered training companion",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} ${orbitron.variable} min-h-screen bg-background text-foreground`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <div className="flex min-h-screen flex-col">
              <TopNav isAuthenticated={Boolean(user)} showDebugLink={Boolean(user?.id && debugGeneratorUserIds.includes(user.id))} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <UiToaster />
            <Analytics />
            <SpeedInsights />
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
