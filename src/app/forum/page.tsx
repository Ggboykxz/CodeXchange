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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* En-tête éditorial (pas un clone de X). */}
      <header className="flex flex-col gap-2 border-b border-cx-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "forum.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">{t(locale, "forum.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <ForumFeed
                initialItems={sujets}
                totalPages={totalPages}
                currentPage={pageActuelle}
                basePath="/forum"
                locale={locale}
                connecte={userId !== null}
                params={{ q: params.q, tag: params.tag, tri }}
              />
            </div>
            <aside className="hidden space-y-4 lg:block">
              <Tendances limite={6} />
            </aside>
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Pagination page={pageActuelle} totalPages={totalPages} basePath="/forum" />
        </nav>
      ) : null}

      <Link
        href="/forum/nouveau"
        aria-label={t(locale, "forum.new")}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 inline-flex size-13 items-center justify-center rounded-full bg-cx-primary text-cx-primary-fg shadow-lg transition-transform duration-150 active:scale-95 sm:hidden"
      >
        <Icone nom="plus" className="size-6" />
      </Link>
    </div>
  );
}
