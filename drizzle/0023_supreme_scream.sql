ALTER TABLE "posts" ADD COLUMN "article_key" varchar(255);--> statement-breakpoint
UPDATE "posts" SET "article_key" = "slug";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "article_key" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "posts_article_key_lang_idx" ON "posts" USING btree ("article_key","lang");
