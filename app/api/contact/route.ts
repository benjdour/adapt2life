import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide."),
  subject: z.string().min(3, "Merci d’ajouter un objet."),
  message: z.string().min(10, "Merci de détailler votre message."),
});

type ContactRequest = z.infer<typeof contactSchema>;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = contactSchema.parse(body);

    const mailtoUrl = buildMailto(parsed);

    return NextResponse.json({ success: true, mailto: mailtoUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return NextResponse.json({ error: firstIssue?.message ?? "Requête invalide." }, { status: 400 });
    }
    return NextResponse.json({ error: "Impossible d’envoyer votre message pour le moment." }, { status: 500 });
  }
}

const buildMailto = (payload: ContactRequest) => {
  const params = new URLSearchParams({
    subject: `Adapt2Life — ${payload.subject}`,
    body: `Nom: ${payload.name}\nEmail: ${payload.email}\nObjet: ${payload.subject}\n\nMessage:\n${payload.message}`,
  });
  return `mailto:contact@adapt2life.app?${params.toString()}`;
};
