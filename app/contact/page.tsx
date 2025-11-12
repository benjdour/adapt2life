"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z.string().min(2, "Merci d’indiquer votre nom."),
  email: z.string().email("Adresse e-mail invalide."),
  subject: z.string().min(3, "Merci d’ajouter un objet."),
  message: z.string().min(10, "Merci de détailler votre message."),
});

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [formState, setFormState] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message?: string }>({ type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: null });

    const validation = contactSchema.safeParse(formState);
    if (!validation.success) {
      setStatus({ type: "error", message: validation.error.issues?.[0]?.message ?? "Formulaire invalide." });
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

      const data = (await response.json()) as { mailto?: string; error?: string };

      if (!response.ok || !data.mailto) {
        throw new Error(data.error ?? "Impossible d’envoyer le message.");
      }

      window.location.href = data.mailto;
      setStatus({ type: "success", message: "Votre logiciel de messagerie va s’ouvrir." });
      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Impossible de traiter votre demande pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10 text-foreground">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Contact</p>
        <h1 className="text-4xl font-heading">Discutons de ton projet</h1>
        <p className="text-sm text-muted-foreground">Écris-nous via le formulaire ou directement à contact@adapt2life.app</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de contact</CardTitle>
          <CardDescription>Nous te répondons sous 24 heures ouvrées.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Nom
                </label>
                <Input id="name" name="name" value={formState.name} onChange={handleChange} placeholder="Ex. Marie Dupont" />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="exemple@adapt2life.app"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="text-sm font-semibold text-foreground">
                Objet
              </label>
              <Input
                id="subject"
                name="subject"
                value={formState.subject}
                onChange={handleChange}
                placeholder="Ex. Question sur l’abonnement"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-semibold text-foreground">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                value={formState.message}
                onChange={handleChange}
                placeholder="Décris ton besoin : objectif, contraintes, questions spécifiques, etc."
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
                Envoyer
              </Button>
              <Link href="mailto:contact@adapt2life.app" className="text-sm text-muted-foreground underline">
                ou écris-nous directement
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
