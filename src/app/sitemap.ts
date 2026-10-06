import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * `/sitemap.xml`.
 *
 * Une seule entrée — et c'est exactement la vérité du site : la
 * navigation se fait par hash (`#forum`, `#jobs`, `#mentorat`, définis
 * par `navigate()` dans `src/store/app-store.ts`) et `next build` ne
 * produit **qu'une route**, `/`. Lister `/#forum` reviendrait à proposer
 * aux crawlers la même page sous six fragments : Google les ignore,
 * les autres indexeraient des doublons.
 *
 * Deux points volontairement absents :
 *  - les sections comme vraies routes : à ajouter ici le jour où elles
 *    deviendront des pages (état du chantier : `docs/ROADMAP.md`) ;
 *  - les `alternates.languages` : la locale vit dans le stockage client,
 *    il n'existe pas de `/en/...` à déclarer.
 *
 * Aucun accès base : le sitemap se génère au build sans dépendre de
 * `DATABASE_URL`, donc jamais de build cassé parce que la DB est absente.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
