import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Inter, Orbitron, Poppins } from "next/font/google";

import { stackClientApp } from "@/stack/client";
import { stackServerApp } from "@/stack/server";
import "./globals.css";
import { UiToaster } from "@/components/ui/ui-toaster";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

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
    icon: "/brand/logo-main.png",
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
              <TopNav isAuthenticated={Boolean(user)} />
              <main className="flex-1 px-4 py-8">{children}</main>
              <Footer />
            </div>
            <UiToaster />
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
