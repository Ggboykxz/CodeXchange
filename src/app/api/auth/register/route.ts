import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, username, country, city, stack, level } =
      await req.json();

    if (!name || !email || !password || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const existingUsername = await db.profile.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
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

    const token = generateToken();

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, profile: user.profile },
      token,
    });
    response.cookies.set("cx_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
