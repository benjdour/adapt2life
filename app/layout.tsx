import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Inter, Orbitron, Poppins } from "next/font/google";

import { stackClientApp } from "@/stack/client";
import "./globals.css";
import { UiToaster } from "@/components/ui/ui-toaster";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${orbitron.variable} font-sans bg-background text-foreground`}>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            {children}
            <UiToaster />
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
