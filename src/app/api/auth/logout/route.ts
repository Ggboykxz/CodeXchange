import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { destroySession } from "@/lib/session";

/** DELETE /api/auth/logout — détruit la session et efface le cookie. */
export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
