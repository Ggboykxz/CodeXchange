/**
 * Recherche globale (D9) — la logique qui décide est **pure** et testée
 * (`tests/search.test.ts`) : normalisation de la requête et formation
 * des groupes à afficher. La route `/api/search` ne fait que récupérer
 * les lignes et déléguer ici.
 *
 * Pourquoi pas de moteur de recherche dédié (Meilisearch…) : 6 petites
 * requêtes `ILIKE` sur tables de petite/moyenne taille, un seul
 * index serait un service de plus sans gain mesurable à cette échelle —
 * l'honnêteté du « branché et réel » prime sur la vitrine technique.
 */

/** Trim + un espace entre mots, plafonné : la requête envoyée au serveur est stable. */
export function normalizeQuery(q: string | null | undefined): string {
  if (!q) return "";
  return q.trim().replace(/\s+/g, " ").slice(0, 80);
}

export type SearchKind = "threads" | "jobs" | "projects" | "tutorials" | "events" | "people";

export type SearchItem = { kind: SearchKind; title: string; sub?: string; href: string };

export type SearchGroup = { kind: SearchKind; items: SearchItem[] };

export type SearchResult = { query: string; total: number; groups: SearchGroup[] };

/** Colonnes nécessaires — exactement ce que la route sélectionne. */
export interface SearchRows {
  threads: Array<{ title: string; slug: string; category: string; upvotes: number }>;
  jobs: Array<{ title: string; company: string }>;
  projects: Array<{ name: string; tagline: string }>;
  tutorials: Array<{ title: string; readTime: number }>;
  events: Array<{ title: string; date: Date; location: string | null; online: boolean }>;
  people: Array<{ name: string; username: string }>;
}

/**
 * Formation des groupes : sections vides écartées, ordre stable, totaux
 * calculés. Les `href` sont des ancres de section (`#forum/slug`…) —
 * même navigation que les cartes.
 */
export function toResult(query: string, rows: SearchRows): SearchResult {
  const groups: SearchGroup[] = [];

  if (rows.threads.length) {
    groups.push({
      kind: "threads",
      items: rows.threads.map((t) => ({
        kind: "threads" as const,
        title: t.title,
        sub: t.upvotes > 0 ? `${t.category} · ${t.upvotes} upvote${t.upvotes > 1 ? "s" : ""}` : t.category,
        href: `/forum/${t.slug}`,
      })),
    });
  }

  if (rows.jobs.length) {
    groups.push({
      kind: "jobs",
      items: rows.jobs.map((j) => ({
        kind: "jobs" as const,
        title: j.title,
        sub: j.company,
        href: "/jobs",
      })),
    });
  }

  if (rows.projects.length) {
    groups.push({
      kind: "projects",
      items: rows.projects.map((p) => ({
        kind: "projects" as const,
        title: p.name,
        sub: p.tagline,
        href: "/projects",
      })),
    });
  }

  if (rows.tutorials.length) {
    groups.push({
      kind: "tutorials",
      items: rows.tutorials.map((t) => ({
        kind: "tutorials" as const,
        title: t.title,
        sub: `${t.readTime} min de lecture`,
        href: "/tutos",
      })),
    });
  }

  if (rows.events.length) {
    const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
    groups.push({
      kind: "events",
      items: rows.events.map((e) => ({
        kind: "events" as const,
        title: e.title,
        sub: `${dateFmt.format(e.date)} · ${e.online ? "en ligne" : (e.location ?? "sur place")}`,
        href: "/tutos",
      })),
    });
  }

  if (rows.people.length) {
    groups.push({
      kind: "people",
      items: rows.people.map((p) => ({
        kind: "people" as const,
        title: p.name,
        sub: `@${p.username}`,
        href: `/annuaire/${p.username}`,
      })),
    });
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return { query, total, groups };
}
