import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Inscription et connexion (spec) : e-mail + mot de passe, bcrypt coût 10,
 * e-mails uniques insensibles à la casse (normalisés en minuscules à l'écriture
 * comme à la lecture), slug auto-généré avec suffixe numérique en cas de collision.
 */

/** Coût bcrypt imposé par le plan (Task 3, step 3). */
const COUT_BCRYPT = 10;
const LONGUEUR_MIN_MDP = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Inscription = {
  email: string;
  password: string;
  nom: string;
  ville: string;
  pays: string;
  titre: string;
};

/** Slug lisible : casse, accents, espaces et ponctuation normalisés. */
export function slugify(nom: string): string {
  const slug = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase()
    .replace(/['’]/g, "") // apostrophes absorbées : "N'Guessan" → "nguessan"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "membre";
}

function emailNormalise(email: string): string {
  return email.trim().toLowerCase();
}

/** Violation d'index unique Prisma (P2002), y compris sous concurrence. */
function estEmailDuplique(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    (erreur as { code?: string }).code === "P2002"
  );
}

export async function hashPassword(p: string): Promise<string> {
  return bcrypt.hash(p, COUT_BCRYPT);
}

export async function verifyPassword(p: string, h: string): Promise<boolean> {
  return bcrypt.compare(p, h);
}

export async function registerUser(i: Inscription): Promise<User> {
  const email = emailNormalise(i.email);
  if (!EMAIL_RE.test(email)) {
    throw new AppError("FORUM_VALIDATION", "E-mail invalide.");
  }
  if (i.password.length < LONGUEUR_MIN_MDP) {
    throw new AppError("FORUM_VALIDATION", "Mot de passe : 8 caractères minimum.");
  }
  if (!i.nom.trim() || !i.ville.trim() || !i.pays.trim() || !i.titre.trim()) {
    throw new AppError("FORUM_VALIDATION", "Champs obligatoires manquants.");
  }

  // SQLite : l'unicité est sensible à la casse, on compare donc l'e-mail normalisé.
  const dejaInscrit = await prisma.user.findUnique({ where: { email } });
  if (dejaInscrit) {
    throw new AppError("AUTH_DUPLICATE_EMAIL");
  }

  // Slug = slugify(nom) + suffixe numérique si collision (spec / Global Constraints).
  const base = slugify(i.nom);
  let slug = base;
  for (let n = 2; (await prisma.user.findUnique({ where: { slug } })); n++) {
    slug = `${base}-${n}`;
  }

  try {
    return await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(i.password),
        nom: i.nom.trim(),
        slug,
        titre: i.titre.trim(),
        ville: i.ville.trim(),
        pays: i.pays.trim(),
      },
    });
  } catch (erreur) {
    // Course possible entre le findUnique ci-dessus et le create.
    if (estEmailDuplique(erreur)) {
      throw new AppError("AUTH_DUPLICATE_EMAIL");
    }
    throw erreur;
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  const utilisateur = await prisma.user.findUnique({
    where: { email: emailNormalise(email) },
  });
  if (!utilisateur || !(await verifyPassword(password, utilisateur.passwordHash))) {
    throw new AppError("AUTH_INVALID");
  }
  if (utilisateur.bannedAt) {
    throw new AppError("USER_BANNED");
  }
  return utilisateur;
}
