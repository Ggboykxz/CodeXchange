/**
 * URL publique de la plateforme.
 *
 * Servie à `metadataBase` (layout), à `robots.ts` et à `sitemap.ts` : sans
 * base absolue, Next émet des URLs relatives dans les balises Open Graph,
 * ce qui donne des aperçus cassés quand la page est partagée.
 *
 * Priorité :
 *  1. `NEXT_PUBLIC_SITE_URL` — renseigné en prod (et copié depuis
 *     `.env.example`, dont la valeur par défaut est le dev local) ;
 *  2. `VERCEL_URL` — fournie automatiquement hébergeur Vercel, mais SANS
 *     schéma, d'où le préfixage `https://` ;
 *  3. `http://localhost:3000` — dernier recours en dev.
 *
 * `NEXT_PUBLIC_` est requis : la variable est lue côté client (balises
 * metadata rendues par le navigateur lors de l'hydratation).
 */
const raw =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";

export const SITE_URL = (
  raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`
).replace(/\/+$/, "");

/** Convertit un chemin applicatif en URL absolue. */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
