/**
 * Slugs d'URL — partagés par les questions, projets et tutos.
 *
 * Deux règles :
 *  1. un titre sans ASCII (« Comment déboguer ? ») doit quand même produire
 *     un slug non vide → on garde un *fallback* explicite ;
 *  2. pas de boucle check-then-act : le suffixe aléatoire rend la collision
 *     improbable, et un P2002 éventuel ne vaut jamais un 500.
 */
import { db } from "@/lib/db";

export type SlugKind = "thread" | "project" | "tutorial";

/** `slugify("Déployer en prod !")` → `deployer-en-prod` */
export function slugify(input: string, fallback = "item"): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || fallback
  );
}

async function taken(kind: SlugKind, slug: string): Promise<boolean> {
  const row =
    kind === "thread"
      ? await db.thread.findUnique({ where: { slug }, select: { id: true } })
      : kind === "project"
      ? await db.project.findUnique({ where: { slug }, select: { id: true } })
      : await db.tutorial.findUnique({ where: { slug }, select: { id: true } });
  return row !== null;
}

/** Base courte + suffixe aléatoire, retenté quelques fois en cas de collision. */
export async function uniqueSlug(
  kind: SlugKind,
  title: string,
  fallback = "item"
): Promise<string> {
  const base = slugify(title, fallback);
  let slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;

  for (let attempts = 0; attempts < 5 && (await taken(kind, slug)); attempts++) {
    slug = `${base}-${Math.random().toString(36).slice(2, 8 + attempts)}`;
  }
  return slug;
}
