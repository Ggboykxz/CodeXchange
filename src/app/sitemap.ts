import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * `/sitemap.xml` — liste toutes les routes indexables.
 *
 * Chaque section est une route réelle (`/forum`, `/jobs`…) rendue par
 * `app/[section]/page.tsx` avec des métadonnées côté serveur : elles
 * ont donc leur place ici, à l'inverse de l'ancien format hash `#forum`
 * que Google ignorait. Les ancres (`/#forum/slug`) restent navigation
 * secondaire, pas des URLs à indexer.
 *
 * Aucun accès base : le sitemap se génère au build sans dépendre de
 * `DATABASE_URL`, donc jamais de build cassé parce que la DB est absente.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const sections = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/forum", changeFrequency: "always" as const, priority: 0.9 },
    { path: "/jobs", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/projects", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/mentorat", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/tutos", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/annuaire", changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  return sections.map((s) => ({
    url: absoluteUrl(s.path),
    lastModified: new Date(),
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));
}
