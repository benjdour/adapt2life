import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { defaultLocale, isLocale } from "@/i18n/config";
import type { ReactNode } from "react";

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
  description: "Your AI trainer for a balanced life",
};

type RootLayoutParams = {
  locale?: string;
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
  params: RootLayoutParams | Promise<RootLayoutParams>;
}>;

function isThenable<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === "function";
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const resolvedParams = isThenable(params) ? await params : params;
  const locale =
    resolvedParams.locale && isLocale(resolvedParams.locale)
      ? resolvedParams.locale
      : defaultLocale;
  return (
    <html lang={locale}>
      <head>
        {/* Link to Font Awesome CDN for social media icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
