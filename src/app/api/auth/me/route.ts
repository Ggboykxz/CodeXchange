import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authJson, json } from "@/lib/api";
import { verifySessionToken } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("cx_session")?.value;
  const userId = verifySessionToken(token);
  if (!userId) {
    return json({ user: null });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  return authJson({ user });
}

export async function DELETE() {
  const response = json({ success: true });
  response.cookies.delete("cx_session");
  return response;
}
