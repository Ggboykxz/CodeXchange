import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

/** POST { tag } — toggles the follow of a tag/community. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { tag } = (await request.json().catch(() => ({}))) as { tag?: string };
  const clean = (tag ?? "").trim().toLowerCase();
  if (!clean) return NextResponse.json({ error: "VALIDATION" }, { status: 400 });

  const exists = await prisma.tagFollow.findUnique({ where: { userId_tag: { userId, tag: clean } } });
  if (exists) {
    await prisma.tagFollow.delete({ where: { userId_tag: { userId, tag: clean } } });
    return NextResponse.json({ following: false });
  }
  try {
    await prisma.tagFollow.create({ data: { userId, tag: clean } });
    return NextResponse.json({ following: true });
  } catch {
    return NextResponse.json({ following: false });
  }
}
