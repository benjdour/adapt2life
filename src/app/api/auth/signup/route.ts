import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type SignupPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body: SignupPayload = await request.json().catch(() => ({}));
  const { firstName, lastName, email, password } = body;

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { success: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "email_exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ success: true });
}
