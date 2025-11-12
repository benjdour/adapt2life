import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Adresse e-mail invalide."),
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
      return NextResponse.json({ error: error.errors[0]?.message ?? "Requête invalide." }, { status: 400 });
    }
    return NextResponse.json({ error: "Impossible d’envoyer votre message pour le moment." }, { status: 500 });
  }
}

const buildMailto = (payload: ContactRequest) => {
  const params = new URLSearchParams({
    subject: `Message Adapt2Life — ${payload.name}`,
    body: `Nom: ${payload.name}\nEmail: ${payload.email}\n\nMessage:\n${payload.message}`,
  });
  return `mailto:contact@adapt2life.app?${params.toString()}`;
};
