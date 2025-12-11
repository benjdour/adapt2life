import type { Metadata } from "next";

import { BlogPage, getBlogMetadata } from "./BlogPage";

export const metadata: Metadata = getBlogMetadata("fr");

export default function BlogRoute() {
  return <BlogPage locale="fr" />;
}
