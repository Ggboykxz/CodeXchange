import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * `/robots.txt` — généré par Next au lieu d'être posé dans `public/` :
 * le fichier statique qu'il y avait (allow partout, sans sitemap) ne
 * pouvait pas connaître l'URL publique du site.
 *
 * `/api/` est interdit : ce sont des réponses JSON déjà indexables par
 * `noindex`-adjacent, mais un crawler ne doit pas partir y consommer du
 * budget de crawl. `/offline.html` est la page de secours du service
 * worker : la laisser sortir produirait une page quasi vide en indice.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/offline.html"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
