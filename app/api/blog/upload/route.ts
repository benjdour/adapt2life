import { NextResponse } from "next/server";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";
import { Buffer } from "node:buffer";
import { eq } from "drizzle-orm";

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
type LangResolutionResult = { value: string; error?: undefined } | { error: string; value?: undefined };

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const markdownFile = formData.get("file");

    if (!(markdownFile instanceof File)) {
      return NextResponse.json({ error: "Markdown file is required." }, { status: 400 });
    }

    const langFromFilename = inferLangFromFilename(markdownFile.name);
    const markdownContent = await markdownFile.text();
    const { data, content } = matter(markdownContent);
    const frontMatter = data as BlogFrontMatter;
    const frontMatterLang =
      typeof frontMatter.lang === "string" && frontMatter.lang.trim() ? frontMatter.lang.trim().toLowerCase() : null;
    const langFinal = resolvePostLanguage({ frontMatterLang, langFromFilename });
    if (langFinal.error) {
      return NextResponse.json({ error: langFinal.error }, { status: 400 });
    }
    const resolvedLang = langFinal.value ?? "fr";

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
    const articleKey = deriveArticleKey(markdownFile.name, slug);
    let heroImageUrlFinal = await resolveHeroImageUrl(formData, frontMatter);
    if (!heroImageUrlFinal) {
      heroImageUrlFinal = await findExistingHeroImage(articleKey);
    }

    const record = {
      id: nanoid(),
      slug,
      articleKey,
      title,
      excerpt,
      lang: resolvedLang,
      heroImage: heroImageUrlFinal ?? null,
      publishedAt,
      content,
    };

    await db.insert(posts).values(record);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to import blog post", error);
    return NextResponse.json({ error: "Unable to import the blog post." }, { status: 500 });
  }
}

async function resolveHeroImageUrl(formData: FormData, frontMatter: BlogFrontMatter): Promise<string | null> {
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

  const heroImageUrlFromForm = formData.get("heroImageUrl");
  if (typeof heroImageUrlFromForm === "string" && heroImageUrlFromForm.trim()) {
    return heroImageUrlFromForm.trim();
  }

  if (typeof frontMatter.heroImage === "string" && frontMatter.heroImage.trim()) {
    return frontMatter.heroImage.trim();
  }

  return null;
}

function inferLangFromFilename(fileName: string): "fr" | "en" | null {
  const normalized = fileName.toLowerCase();
  const match = normalized.match(/\.([a-z]{2})\.(md|markdown)$/);
  if (!match) {
    return null;
  }

  const code = match[1];
  if (code === "fr" || code === "en") {
    return code;
  }

  return null;
}

function resolvePostLanguage({
  frontMatterLang,
  langFromFilename,
}: {
  frontMatterLang: string | null;
  langFromFilename: "fr" | "en" | null;
}): LangResolutionResult {
  if (langFromFilename && frontMatterLang) {
    if (frontMatterLang !== langFromFilename) {
      return {
        error:
          "La langue indiquée dans le front matter ne correspond pas à la langue déduite du nom de fichier (ex: *.fr.md / *.en.md).",
      };
    }
    return { value: langFromFilename };
  }

  if (langFromFilename) {
    return { value: langFromFilename };
  }

  if (frontMatterLang) {
    return { value: frontMatterLang };
  }

  // On conserve "fr" par défaut afin de rester aligné avec le comportement historique.
  return { value: "fr" as const };
}

function deriveArticleKey(fileName: string, fallbackSlug: string): string {
  const normalized = fileName.trim().toLowerCase();
  const match = normalized.match(/^(.*)\.(fr|en)\.(md|markdown)$/);
  if (match?.[1]) {
    return match[1];
  }
  const withoutExtension = normalized.replace(/\.(md|markdown)$/, "");
  return withoutExtension || fallbackSlug.toLowerCase();
}

async function findExistingHeroImage(articleKey: string): Promise<string | null> {
  const existing = await db
    .select({ heroImage: posts.heroImage })
    .from(posts)
    .where(eq(posts.articleKey, articleKey))
    .limit(1);
  return existing[0]?.heroImage ?? null;
}
