import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";

const staticRoutes: string[] = [
  "/",
  "/features",
  "/features/coach-ia-garmin",
  "/about",
  "/pricing",
  "/how-it-works",
  "/garmin-trainer",
  "/faq",
  "/contact",
  "/integrations/garmin",
  "/legal/conditions",
  "/legal/confidentialite",
  "/legal/mentions-legales",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
