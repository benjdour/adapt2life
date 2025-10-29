import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: Request) {
  const { stackId, name, email } = await request.json();

  try {
    await db
      .insert(users)
      .values({ stackId, name, email })
      .onConflictDoNothing({ target: users.stackId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error inserting user:", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}