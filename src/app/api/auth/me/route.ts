import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Demo: we return a hardcoded mock current user for simplicity
  // In a real app, this would verify the session token from cookies
  const cookie = req.cookies.get("cx_session");
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  // For demo purposes, return Aïcha Diallo as the "current user"
  const user = await db.user.findFirst({
    where: { email: "aicha.diallo@codexchange.dev" },
    include: { profile: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("cx_session");
  return response;
}
