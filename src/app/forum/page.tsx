import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import ForumFeed from "@/components/forum-feed";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listPosts } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import SelecteurTri from "@/components/selecteur-tri";
import Tendances from "@/components/tendances";

export const metadata = { title: "Forum" };

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; tag?: string; tri?: ("hot" | "new" | "top" | "recent" | "populaire") | undefined }>;
};

export default async function PageForum({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? "";
  const tag = params.tag ?? undefined;
  const tri = params.tri ?? undefined;

  // Requête initiale côté serveur (page 1).
  const [resultat, locale] = await Promise.all([
    listPosts({ q, tag, tri, page: 1 }),
    localeCourante(),
  ]);
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const userId = getSessionUserId();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "forum.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {t(locale, "forum.subtitle")}
          </p>
        </div>
      </header>

      {sujets.length === 0 ? (
        <EmptyState
          titre={t(locale, "forum.empty_title")}
          description={t(locale, "forum.empty_desc")}
          cta="forum.new"
          href="/forum/nouveau"
        />
      ) : (
        <ForumFeed
          initialItems={sujets}
          totalPages={totalPages}
          currentPage={pageActuelle}
          basePath="/forum"
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
            basePath="/forum"
            params={{ q, tag, tri }}
          />
        </nav>
      )}
    </div>
  );
}