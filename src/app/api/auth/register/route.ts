import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authJson, json } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.-]{3,24}$/i;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, username, country, city, stack, level } =
      await req.json();

    if (!name || !email || !password || !username) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return json({ error: "Invalid email address" }, { status: 400 });
    }
    if (String(password).length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!USERNAME_RE.test(username)) {
      return json(
        { error: "Username must be 3-24 chars (letters, digits, _ . -)" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return json({ error: "Email already in use" }, { status: 409 });
    }

    const existingUsername = await db.profile.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return json({ error: "Username already taken" }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        profile: {
          create: {
            username,
            country: country || null,
            city: city || null,
            stack: stack || null,
            level: level || "junior",
            bio: "",
            avatarColor: "terracotta",
          },
        },
      },
      include: { profile: true },
    });

    const token = createSessionToken(user.id);

    const response = authJson({
      user: { id: user.id, name: user.name, email: user.email, profile: user.profile },
      token,
    });
    response.cookies.set("cx_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (e) {
    console.error("Register error:", e);
    return json({ error: "Failed to create account" }, { status: 500 });
  }
}
