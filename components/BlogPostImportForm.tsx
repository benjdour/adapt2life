"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "success" | "error";

export type BlogPostImportFormCopy = {
  helperText: string;
  fileLabel: string;
  imageLabel: string;
  heroImageUrlLabel: string;
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
};

type BlogPostImportFormProps = {
  copy: BlogPostImportFormCopy;
};

export function BlogPostImportForm({ copy }: BlogPostImportFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setMessage(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/blog/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(typeof payload?.error === "string" ? payload.error : copy.errorMessage);
      }

      form.reset();
      setStatus("success");
      setMessage(copy.successMessage);
    } catch (error) {
      const description = error instanceof Error ? error.message : copy.errorMessage;
      setStatus("error");
      setMessage(description);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
      <p className="text-sm text-muted-foreground">{copy.helperText}</p>

      <div className="space-y-2">
        <Label htmlFor="blog-markdown" requiredIndicator>
          {copy.fileLabel}
        </Label>
        <Input id="blog-markdown" name="file" type="file" accept=".md,.markdown" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blog-image">{copy.imageLabel}</Label>
        <Input id="blog-image" name="image" type="file" accept="image/*" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blog-hero-url">{copy.heroImageUrlLabel}</Label>
        <Input id="blog-hero-url" name="heroImageUrl" type="url" placeholder="https://..." />
      </div>

      <Button type="submit" isLoading={isLoading}>
        {copy.submitLabel}
      </Button>

      {message ? (
        <p
          className={`text-sm ${
            status === "success" ? "text-emerald-400" : status === "error" ? "text-red-400" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
