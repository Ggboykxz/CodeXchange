import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authJson, json } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createSessionToken(user.id);

    const response = authJson({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
      },
      token,
    });
    response.cookies.set("cx_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (e) {
    console.error("Login error:", e);
    return json({ error: "Failed to login" }, { status: 500 });
  }
}
