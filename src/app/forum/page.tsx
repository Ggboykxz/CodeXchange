import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import ForumFeed from "@/components/forum-feed";
import Pagination from "@/components/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listPosts } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import SelecteurTri from "@/components/selecteur-tri";
import Tendances from "@/components/tendances";
import Composeur from "@/components/composeur";
import { Icone } from "@/components/icones";

export const metadata = { title: "Forum" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; tag?: string; tri?: ("hot" | "new" | "top" | "recent" | "populaire") | undefined }>;
};

/** /forum — la timeline façon X : colonne centrale ~600px, composeur
 * omniprésent, onglets de tri collants (rangement au défilement), rail de
 * tendances à droite, et rangées de fil cliquables sur toute leur surface. */
export default async function PageForum({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const tag = params.tag ?? undefined;
  const tri = params.tri ?? undefined;

  // Requête initiale côté serveur (page 1). getSessionUserId() doit être
  // attendu : sans await, userId est une promesse jamais résolue (bug d'état).
  const userId = await getSessionUserId();
  const [resultat, locale, me] = await Promise.all([
    listPosts({ q, tag, tri, page: 1 }),
    localeCourante(),
    userId !== null
      ? prisma.user.findUnique({ where: { id: userId }, select: { nom: true, slug: true, avatar: true } })
      : Promise.resolve(null),
  ]);
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,600px)_300px] lg:justify-center">
      {/* Colonne timeline. */}
      <div className="flex min-w-0 flex-col">
        <header className="border-b border-cx-border pb-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{t(locale, "forum.title")}</h1>
          <p className="mt-0.5 text-xs text-cx-muted-fg">{t(locale, "forum.subtitle")}</p>
        </header>

        <div className="mt-4">
          <Composeur locale={locale} connecte={userId !== null} me={me} />
        </div>

        {sujets.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              titre={t(locale, "forum.empty_title")}
              description={t(locale, "forum.empty_desc")}
              cta="forum.new"
              href="/forum/nouveau"
            />
          </div>
        ) : (
          <>
            {/* Onglets collants avec léger flou (façon X) : le tri reste
                lisible pendant tout le défilement. */}
            <div className="sticky top-0 z-10 mt-4 bg-cx-bg/85 backdrop-blur">
              <SelecteurTri
                basePath="/forum"
                params={{ q: params.q, tag: params.tag }}
                actuelle={tri ?? "hot"}
                options={[
                  { valeur: "hot", cle: "hot" },
                  { valeur: "new", cle: "new" },
                  { valeur: "top", cle: "top" },
                ]}
                libelles={{
                  tri: t(locale, "sort.label"),
                  hot: t(locale, "sort.hot"),
                  new: t(locale, "sort.new"),
                  top: t(locale, "sort.top"),
                }}
              />
            </div>
            <ForumFeed
              initialItems={sujets}
              totalPages={totalPages}
              currentPage={pageActuelle}
              basePath="/forum"
              locale={locale}
              connecte={userId !== null}
              params={{ q: params.q, tag: params.tag, tri }}
            />
          </>
        )}

        {/* Pagination traditionnelle en pied de page pour le partage direct / SEO */}
        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className={`mt-2 flex flex-wrap items-center justify-center gap-2`}
          >
            <Pagination
              page={pageActuelle}
              totalPages={totalPages}
              basePath="/forum"
            />
          </nav>
        ) : null}

        {/* FAB de composition (mobile) façon X ; placé au-dessus du
            retour-haut, dans la zone du pouce, hors des safe-areas. */}
        <Link
          href="/forum/nouveau"
          aria-label={t(locale, "forum.new")}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 inline-flex size-13 items-center justify-center rounded-full bg-cx-primary text-cx-primary-fg shadow-lg transition-transform duration-150 active:scale-95 sm:hidden"
        >
          <Icone nom="plus" className="size-6" />
        </Link>
      </div>

      {/* Rail façon X : tendances. */}
      <aside className="hidden lg:sticky lg:top-6 lg:self-start lg:block">
        <Tendances limite={6} />
      </aside>
    </div>
  );
}
