"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactFormCopy = {
  title: string;
  description: string;
  labels: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
  };
  placeholders: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
  };
  validation: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    generic: string;
  };
  success: string;
  submitLabel: string;
  mailLinkLabel: string;
  errors: {
    server: string;
    request: string;
  };
};

const buildSchema = (validation: ContactFormCopy["validation"]) =>
  z.object({
    firstName: z.string().min(2, validation.firstName),
    lastName: z.string().min(2, validation.lastName),
    email: z.string().email(validation.email),
    subject: z.string().min(3, validation.subject),
    message: z.string().min(10, validation.message),
  });

export const ContactForm = ({ copy }: { copy: ContactFormCopy }) => {
  const [formState, setFormState] = useState<FormState>({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message?: string }>({ type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contactSchema = useMemo(() => buildSchema(copy.validation), [copy.validation]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: null });

    const validation = contactSchema.safeParse(formState);
    if (!validation.success) {
      setStatus({ type: "error", message: validation.error.issues?.[0]?.message ?? copy.validation.generic });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data?.success) {
        throw new Error(data.error ?? copy.errors.server);
      }

      setStatus({ type: "success", message: copy.success });
      setFormState({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : copy.errors.request,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                {copy.labels.firstName}
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={formState.firstName}
                onChange={handleChange}
                placeholder={copy.placeholders.firstName}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="text-sm font-semibold text-foreground">
                {copy.labels.lastName}
              </label>
              <Input
                id="lastName"
                name="lastName"
                value={formState.lastName}
                onChange={handleChange}
                placeholder={copy.placeholders.lastName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              {copy.labels.email}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              placeholder={copy.placeholders.email}
            />
          </div>

          <div>
            <label htmlFor="subject" className="text-sm font-semibold text-foreground">
              {copy.labels.subject}
            </label>
            <Input
              id="subject"
              name="subject"
              value={formState.subject}
              onChange={handleChange}
              placeholder={copy.placeholders.subject}
            />
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-semibold text-foreground">
              {copy.labels.message}
            </label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              value={formState.message}
              onChange={handleChange}
              placeholder={copy.placeholders.message}
            />
          </div>

          {status.type === "error" ? (
            <p className="rounded-2xl border border-error/30 bg-error/5 px-4 py-2 text-sm text-error">{status.message}</p>
          ) : null}

          {status.type === "success" ? (
            <p className="rounded-2xl border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">{status.message}</p>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button type="submit" className="w-full md:w-auto" isLoading={isSubmitting}>
              {copy.submitLabel}
            </Button>
            <Link href="mailto:contact@adapt2life.app" className="text-sm text-muted-foreground underline">
              {copy.mailLinkLabel}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
