import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { listPosts } from "@/lib/forum";

export const metadata = { title: "Forum" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = { searchParams: Promise<{ q?: string; tag?: string; page?: string }> };

/** /forum — liste des sujets + recherche + filtre par tag (query string). */
export default async function PageForum({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tag = (params.tag ?? "").trim();
  const page = normalizePage(params.page);
  const resultat = await listPosts({ q: q || undefined, tag: tag || undefined, page, pageSize: 12 });
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const filtreActif = q !== "" || tag !== "";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Forum</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            Questions, retours d&apos;expérience et coups de main entre développeurs.
          </p>
        </div>
        <Link
          href="/forum/nouveau"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Écrire un sujet
        </Link>
      </header>

      <form action="/forum" method="get" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Rechercher un sujet
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Rechercher (titre ou corps)…"
          className={CLASS_CHAMP}
        />
        <label htmlFor="tag" className="sr-only">
          Filtrer par tag
        </label>
        <input
          id="tag"
          name="tag"
          type="text"
          defaultValue={tag}
          placeholder="Tag (ex. gabon)"
          className={`${CLASS_CHAMP} sm:max-w-40`}
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium hover:border-[var(--cx-accent)]"
        >
          Filtrer
        </button>
        {filtreActif && (
          <Link
            href="/forum"
            className="px-2 py-2 text-sm font-medium text-[var(--cx-accent)] underline-offset-4 hover:underline"
          >
            Tout effacer
          </Link>
        )}
      </form>

      {sujets.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          {filtreActif ? (
            <>
              <p className="text-lg font-semibold">Aucun sujet ne correspond à votre recherche.</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                Essayez un autre mot-clé ou un autre tag.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/forum"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  Voir tous les sujets
                </Link>
                <Link
                  href="/forum/nouveau"
                  className="rounded-lg bg-[var(--cx-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Écrire un sujet
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Le forum est tout neuf.</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                Posez la première question : la communauté vous répond.
              </p>
              <Link
                href="/forum/nouveau"
                className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Écrire le premier sujet
              </Link>
            </>
          )}
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {sujets.map((sujet) => (
            <li
              key={sujet.id}
              className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60"
            >
              <Link href={`/forum/${sujet.id}`} className="block">
                <h2 className="text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
                  {sujet.titre}
                </h2>
              </Link>

              <p className="mt-1 text-xs text-[var(--cx-muted)]">
                {sujet.author.nom} · {sujet.author.ville}, {sujet.author.pays} ·{" "}
                {DATE.format(sujet.createdAt)}
              </p>

              {sujet.tags && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {sujet.tags.split(",").map((mot) => (
                    <li key={mot}>
                      <Link
                        href={`/forum?tag=${encodeURIComponent(mot.trim())}`}
                        className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--cx-accent)]"
                      >
                        {mot.trim()}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-xs text-[var(--cx-muted)]">
                {sujet._count.replies} {sujet._count.replies > 1 ? "réponses" : "réponse"} ·{" "}
                {sujet._count.likes} {sujet._count.likes > 1 ? "likes" : "like"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/forum"
        params={{ q: q || undefined, tag: tag || undefined }}
      />
    </main>
  );
}
