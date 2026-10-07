import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authUserSelect } from "@/lib/selects";
import { currentUser, unauthorized } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validate";
import { json } from "@/lib/api";

/**
 * PATCH /api/profiles/me — éditer son propre profil (B4).
 *
 * Champs acceptés whitelistés par zod : impossible de modifier `userId`,
 * `role` ni le `passwordHash` de quelqu'un d'autre, et l'identité vient de
 * la session serveur (pas de `?username=` forgeable).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized("You must be signed in to edit your profile");

    const parsed = profileUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json(
        { error: "Invalid profile payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, ...profileFields } = parsed.data;

    // `undefined` = non fourni, `null` = effacer le champ. On ne repasse que
    // les clés réellement présentes pour ne pas écraser avec des undefined.
    const profileData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(profileFields)) {
      if (value !== undefined) profileData[key] = value;
    }

    const profile = await db.profile.update({
      where: { userId: user.id },
      data: profileData,
      select: { user: { select: authUserSelect }, ...profileSelect },
    });

    if (name !== undefined && name !== user.name) {
      await db.user.update({ where: { id: user.id }, data: { name } });
    }

    return json({ profile, user: { ...user, name: name ?? user.name } });
  } catch (e) {
    logger.route("Update profile error", e);
    return json({ error: "Failed to update profile" }, { status: 500 });
  }
}

const profileSelect = {
  id: true,
  username: true,
  headline: true,
  bio: true,
  country: true,
  city: true,
  stack: true,
  level: true,
  github: true,
  twitter: true,
  linkedin: true,
  website: true,
  available: true,
  avatarColor: true,
  userId: true,
} as const;
