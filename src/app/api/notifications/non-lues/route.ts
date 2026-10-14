import { NextResponse } from "next/server";
import { unreadCount } from "@/lib/notifications";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) return NextResponse.json({ count: 0 });
  try {
    return NextResponse.json({ count: await unreadCount(userId) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
