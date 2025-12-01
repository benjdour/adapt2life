import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(2, "Merci d’indiquer votre prénom."),
  lastName: z.string().min(2, "Merci d’indiquer votre nom."),
  email: z.string().email("Adresse e-mail invalide."),
  subject: z.string().min(3, "Merci d’ajouter un objet."),
  message: z.string().min(10, "Merci de détailler votre message."),
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_INBOX = process.env.CONTACT_INBOX_EMAIL ?? "contact@adapt2life.app";
const CONTACT_FROM = process.env.CONTACT_FROM_EMAIL ?? "Adapt2Life <contact@adapt2life.app>";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = contactSchema.parse(body);

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Configuration e-mail manquante." }, { status: 500 });
    }

    const payload = buildEmailPayload(parsed);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      return NextResponse.json(
        { error: details?.message ?? "Impossible d’envoyer votre message pour le moment." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return NextResponse.json({ error: firstIssue?.message ?? "Requête invalide." }, { status: 400 });
    }
    return NextResponse.json({ error: "Impossible d’envoyer votre message pour le moment." }, { status: 500 });
  }
}

const buildEmailPayload = (payload: z.infer<typeof contactSchema>) => {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const html = `
    <p><strong>Nom :</strong> ${fullName}</p>
    <p><strong>Email :</strong> ${payload.email}</p>
    <p><strong>Objet :</strong> ${payload.subject}</p>
    <p><strong>Message :</strong></p>
    <p>${payload.message.replace(/\n/g, "<br/>")}</p>
  `;

  return {
    from: CONTACT_FROM,
    to: [CONTACT_INBOX],
    reply_to: payload.email,
    subject: `Adapt2Life — ${payload.subject}`,
    html,
  };
};
