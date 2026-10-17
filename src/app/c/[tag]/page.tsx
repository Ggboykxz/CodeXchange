import Link from "next/link";
import { notFound } from "next/navigation";
import { localeCourante, t } from "@/lib/i18n";
import { listPosts } from "@/lib/forum";
import { getSessionUserId } from "@/lib/session";
import ForumFeed from "@/components/forum-feed";
import { EmptyState } from "@/components/empty-state";
import Tendances from "@/components/tendances";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return { title: `c/${tag}` };
}

export default async function PageCommunaute({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const userId = await getSessionUserId();
  const [resultat, locale] = await Promise.all([
    listPosts({ tag: decoded, page: 1 }),
    localeCourante(),
  ]);
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,600px)_300px] lg:justify-center">
      <div className="flex min-w-0 flex-col">
        {/* En-tête communauté façon Reddit (r/). */}
        <header className="rounded-2xl border border-cx-border bg-cx-card px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-wider text-cx-accent-fort">c/{decoded}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">#{decoded}</h1>
          <p className="mt-2 text-sm text-cx-muted-fg">
            {sujets.length} {sujets.length > 1 ? t(locale, "forum.answers_many") : t(locale, "forum.answers_one")} · communauté de développeurs
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/forum/nouveau?tag=${encodeURIComponent(decoded)}`}
              className="rounded-full bg-cx-primary px-4 py-2 text-sm font-bold text-cx-primary-fg"
            >
              {t(locale, "forum.poster")}
            </Link>
            <Link
              href={`/forum?tag=${encodeURIComponent(decoded)}`}
              className="rounded-full border border-cx-border px-4 py-2 text-sm font-medium"
            >
              Voir dans le fil
            </Link>
          </div>
        </header>

        {/* Règles (placeholder). */}
        <section className="mt-4 rounded-2xl border border-cx-border bg-cx-card/60 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cx-muted-fg">Règles de la communauté</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-cx-muted-fg">
            <li>Respect et bienveillance entre membres.</li>
            <li>Questions techniques avec contexte et code.</li>
            <li>Pas de spam ni d'auto-promotion excessive.</li>
            <li>Marque les sujets résolus avec ✓.</li>
          </ol>
        </section>

        <div className="mt-4">
          {sujets.length === 0 ? (
            <EmptyState
              titre={`Aucun sujet dans c/${decoded}`}
              description="Sois le premier à lancer la discussion."
              cta="forum.new"
              href={`/forum/nouveau?tag=${encodeURIComponent(decoded)}`}
            />
          ) : (
            <ForumFeed
              initialItems={sujets}
              totalPages={totalPages}
              currentPage={pageActuelle}
              basePath="/forum"
              locale={locale}
              connecte={userId !== null}
              params={{ tag: decoded }}
            />
          )}
        </div>
      </div>

      <aside className="hidden lg:sticky lg:top-6 lg:self-start lg:block">
        <Tendances limite={6} />
      </aside>
    </div>
  );
}
