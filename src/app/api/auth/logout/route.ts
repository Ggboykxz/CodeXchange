import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { destroySession } from "@/lib/session";

/** POST /api/auth/logout — détruction par formulaire HTML avec redirection 303. */
export async function POST(request: Request) {
  try {
    await destroySession();
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}

/** DELETE /api/auth/logout — détruit la session et efface le cookie (API). */
export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (erreur) {
    const { status, body } = errorResponse(erreur);
    return NextResponse.json(body, { status });
  }
}
