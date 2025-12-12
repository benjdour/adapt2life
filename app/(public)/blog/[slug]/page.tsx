import type { Metadata } from "next";

import { BlogArticlePage, getBlogArticleMetadata } from "./BlogArticlePage";

type PageParams = { slug: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const resolved = await params;
  return getBlogArticleMetadata("fr", resolved.slug);
}

export default async function BlogArticleDefaultRoute({ params }: { params: Promise<PageParams> }) {
  const resolved = await params;
  return <BlogArticlePage locale="fr" slug={resolved.slug} />;
}
