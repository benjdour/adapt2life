import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

type LoginPayload = {
  email?: string;
  password?: string;
  locale?: string;
};

export async function POST(request: Request) {
  const body: LoginPayload = await request.json().catch(() => ({}));
  const { email, password, locale } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "invalid_credentials" },
      { status: 401 },
    );
  }

  const matches = await bcrypt.compare(password, user.password);

  if (!matches) {
    return NextResponse.json(
      { success: false, error: "invalid_credentials" },
      { status: 401 },
    );
  }

  await setSession({
    userId: user.id,
    firstName: user.firstName,
    locale: locale ?? undefined,
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  });
}
