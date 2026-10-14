import { NextResponse } from "next/server";
import { unreadMessages } from "@/lib/messagerie";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ count: 0 });
  try {
    return NextResponse.json({ count: await unreadMessages(userId) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
