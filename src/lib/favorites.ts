/**
 * Favoris (“Mes favoris”) — persistance d’un bookmark utilisateur sur tout
 * type d’objet consultable. Une seule table (`Favorite`) avec discriminating
 * `kind` et `targetId`, pour éviter de multiplier les schémas.
 */
import { prisma } from "./db";

export type FavoriteKind = "post" | "job" | "projet" | "tuto" | "event" | "membre";

export const ALL_KINDS: FavoriteKind[] = ["post", "job", "projet", "tuto", "event", "membre"];

export type FavorisGroupes = {
  posts: Array<{ id: number; titre: string; href: string }>;
  jobs: Array<{ id: number; titre: string; href: string }>;
  projets: Array<{ id: number; titre: string; href: string }>;
  tutos: Array<{ id: number; titre: string; href: string }>;
  events: Array<{ id: number; titre: string; href: string }>;
  membres: Array<{ id: number; nom: string; href: string }>;
};

async function ciblesByKind(userId: number, kind: FavoriteKind): Promise<number[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, kind },
    select: { targetId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.targetId);
}

/** Signale si l'objet est déjà favorisé. */
export async function isFavorite(userId: number, kind: FavoriteKind, targetId: number): Promise<boolean> {
  const found = await prisma.favorite.findUnique({
    where: { userId_kind_targetId: { userId, kind, targetId } },
  });
  return Boolean(found);
}

/** Bascule un favori : retourne `true` si ajouté, `false` si retiré. */
export async function toggleFavorite(userId: number, kind: FavoriteKind, targetId: number): Promise<boolean> {
  try {
    const created = await prisma.favorite.create({ data: { userId, kind, targetId } });
    return Boolean(created);
  } catch {
    await prisma.favorite.deleteMany({ where: { userId, kind, targetId } });
    return false;
  }
}

/** Retire un favori sans ambivalence (idempotent). */
export async function removeFavorite(userId: number, kind: FavoriteKind, targetId: number): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, kind, targetId } });
}

/** Tous les favoris de l'utilisateur, groupés par type. */
export async function listFavorites(userId: number): Promise<FavorisGroupes> {
  const byKind = await Promise.all(ALL_KINDS.map((k) => ciblesByKind(userId, k)));
  const ids = Object.fromEntries(ALL_KINDS.map((k, i) => [k, byKind[i]])) as Record<FavoriteKind, number[]>;

  const [posts, jobs, projets, tutos, events, membres] = await Promise.all([
    ids.post.length ? prisma.post.findMany({ where: { id: { in: ids.post } }, select: { id: true, titre: true } }) : Promise.resolve([]),
    ids.job.length ? prisma.job.findMany({ where: { id: { in: ids.job } }, select: { id: true, titre: true } }) : Promise.resolve([]),
    ids.projet.length ? prisma.project.findMany({ where: { id: { in: ids.projet } }, select: { id: true, titre: true } }) : Promise.resolve([]),
    ids.tuto.length ? prisma.tutorial.findMany({ where: { id: { in: ids.tuto } }, select: { id: true, titre: true, slug: true } }) : Promise.resolve([]),
    ids.event.length ? prisma.event.findMany({ where: { id: { in: ids.event } }, select: { id: true, titre: true } }) : Promise.resolve([]),
    ids.membre.length ? prisma.user.findMany({ where: { id: { in: ids.membre } }, select: { id: true, nom: true, slug: true } }) : Promise.resolve([]),
  ]);

  const byIdUser = new Map(membres.map((m) => [m.id, m]));
  // restore insertion order (desc) preserved by ciblesByKind
  return {
    posts: ids.post.map((id) => ({ id, titre: posts.find((p) => p.id === id)?.titre ?? "Sujet", href: `/forum/${id}` })),
    jobs: ids.job.map((id) => ({ id, titre: jobs.find((j) => j.id === id)?.titre ?? "Offre", href: `/jobs/${id}` })),
    projets: ids.projet.map((id) => ({ id, titre: projets.find((p) => p.id === id)?.titre ?? "Projet", href: `/projets/${id}` })),
    tutos: ids.tuto.map((id) => {
      const t = tutos.find((x) => x.id === id);
      return { id, titre: t?.titre ?? "Tuto", href: t?.slug ? `/tutos/${t.slug}` : `/tutos` };
    }),
    events: ids.event.map((id) => ({ id, titre: events.find((e) => e.id === id)?.titre ?? "Événement", href: `/evenements/${id}` })),
    membres: ids.membre.map((id) => {
      const m = byIdUser.get(id);
      return { id, nom: m?.nom ?? "Membre", href: m?.slug ? `/membres/${m.slug}` : `/annuaire` };
    }),
  };
}

export const KIND_LABELS: Record<FavoriteKind, string> = {
  post: "Sujets du forum",
  job: "Offres d'emploi",
  projet: "Projets",
  tuto: "Tutos",
  event: "Événements",
  membre: "Membres",
};


