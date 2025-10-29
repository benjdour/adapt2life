import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { stackClientApp } from "@/stack/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            {children}
            <Toaster richColors position="top-center" expand />
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
