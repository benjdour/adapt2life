import { NextResponse } from "next/server";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";
import { Buffer } from "node:buffer";

import { db } from "@/db";
import { posts } from "@/db/schema";

type BlogFrontMatter = {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  publishedAt?: unknown;
  lang?: unknown;
  heroImage?: unknown;
};

const REQUIRED_FIELDS: Array<keyof BlogFrontMatter> = ["title", "slug", "excerpt", "publishedAt"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const markdownFile = formData.get("file");

    if (!(markdownFile instanceof File)) {
      return NextResponse.json({ error: "Markdown file is required." }, { status: 400 });
    }

    const markdownContent = await markdownFile.text();
    const { data, content } = matter(markdownContent);
    const frontMatter = data as BlogFrontMatter;

    for (const field of REQUIRED_FIELDS) {
      if (typeof frontMatter[field] !== "string" || !String(frontMatter[field]).trim()) {
        return NextResponse.json(
          { error: `Missing required front matter field: ${field}` },
          { status: 400 },
        );
      }
    }

    const publishedAt = new Date(String(frontMatter.publishedAt));
    if (Number.isNaN(publishedAt.getTime())) {
      return NextResponse.json({ error: "Invalid publishedAt date." }, { status: 400 });
    }

    const slug = String(frontMatter.slug).trim();
    const title = String(frontMatter.title).trim();
    const excerpt = String(frontMatter.excerpt).trim();
    const heroImageUrlFinal = await resolveHeroImageUrl(formData, frontMatter);

    await db.insert(posts).values({
      id: nanoid(),
      slug,
      title,
      excerpt,
      lang: typeof frontMatter.lang === "string" && frontMatter.lang.trim() ? frontMatter.lang.trim() : "fr",
      heroImage: heroImageUrlFinal,
      publishedAt,
      content,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to import blog post", error);
    return NextResponse.json({ error: "Unable to import the blog post." }, { status: 500 });
  }
}

async function resolveHeroImageUrl(formData: FormData, frontMatter: BlogFrontMatter): Promise<string | null> {
  const heroImageUrlFromForm = formData.get("heroImageUrl");
  if (typeof heroImageUrlFromForm === "string" && heroImageUrlFromForm.trim()) {
    return heroImageUrlFromForm.trim();
  }

  if (typeof frontMatter.heroImage === "string" && frontMatter.heroImage.trim()) {
    return frontMatter.heroImage.trim();
  }

  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const safeFileName = imageFile.name.replace(/\s+/g, "-").toLowerCase();
    const blobPath = `blog/${Date.now()}-${safeFileName}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const blob = await put(blobPath, Buffer.from(arrayBuffer), {
      access: "public",
      contentType: imageFile.type || "application/octet-stream",
    });
    return blob.url;
  }

  return null;
}
