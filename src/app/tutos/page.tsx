import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import TutosFeed from "@/components/tutos-feed";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listTutorials } from "@/lib/tutorials";

export const metadata = { title: "Tutos" };

// Rendu à la demande : la liste doit refléter la base au moment de la visite
// (seed exécuté après le build), jamais un état figé à la compilation.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string }> };

/** /tutos — liste des articles : durée de lecture, tags, résumé.
 * La page 1 est servie côté serveur ; les pages suivantes sont chargées
 * automatiquement au défilement grâce à un Observateur d'intersection
 * dans le composant client TutosFeed.
 * La pagination traditionnelle reste accessible en URL pour le partage.
 */
export default async function PageTutos({ searchParams }: Props) {
  const params = await searchParams;
  const page = normalizePage(params.page);

  // Requête initiale côté serveur (page 1).
  const [resultat, locale] = await Promise.all([
    listTutorials({ page, pageSize: 5 }),
    localeCourante(),
  ]);
  const tutos = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "tutorials.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {t(locale, "tutorials.subtitle")}
          </p>
        </div>
      </header>

      {tutos.length === 0 ? (
        <EmptyState
          titre={t(locale, "tutorials.empty_title")}
          description={t(locale, "tutorials.empty_desc")}
          cta="forum.new"
          href="/forum/nouveau"
        />
      ) : (
        <TutosFeed
          initialItems={tutos}
          totalPages={totalPages}
          currentPage={pageActuelle}
          basePath="/tutos"
          locale={locale}
        />
      )}

      {/* Pagination traditionnelle en pied de page pour le partage direct / SEO */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className={`flex flex-wrap items-center justify-center gap-2 mt-6`}
        >
          <Pagination
            page={pageActuelle}
            totalPages={totalPages}
            basePath="/tutos"
          />
        </nav>
      )}
    </div>
  );
}