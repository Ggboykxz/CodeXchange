import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import SelecteurTri from "@/components/selecteur-tri";
import Tendances from "@/components/tendances";
import { listPosts } from "@/lib/forum";
import { idsSuivis } from "@/lib/follows";

export const metadata = { title: "Forum" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = { searchParams: Promise<{ q?: string; tag?: string; page?: string; tri?: string; suivis?: string }> };

/** /forum — liste des sujets + recherche + filtre par tag (query string). */
export default async function PageForum({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tag = (params.tag ?? "").trim();
  const page = normalizePage(params.page);
  const userId = await getSessionUserId();
  const triParam = params.tri;
  const tri = triParam === "new" || triParam === "top" ? triParam : "hot";
  const filtreSuivis = params.suivis === "1" && userId !== null;
  // En mode « Abonnements », on ne montre que les sujets des membres suivis.
  const auteursSuivis = filtreSuivis ? await idsSuivis(userId as number) : undefined;
  const [resultat, locale] = await Promise.all([
    listPosts({
      q: q || undefined,
      tag: tag || undefined,
      page,
      pageSize: 12,
      tri,
      userId: userId == null ? undefined : userId,
      authorIds: auteursSuivis,
    }),
    localeCourante(),
  ]);
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const filtreActif = q !== "" || tag !== "";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "forum.title")}</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            {t(locale, "forum.subtitle")}
          </p>
        </div>
        <Link
          href="/forum/nouveau"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {t(locale, "forum.new")}
        </Link>
      </header>
      <p className="text-sm text-cx-muted-fg"><Link href="/forum/tags" className="text-cx-primary hover:underline">Voir toutes les communautés →</Link></p>

      {userId !== null && (
        <nav aria-label="Filtrer le fil" className="flex gap-2">
          <Link
            href="/forum"
            aria-current={!filtreSuivis ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              !filtreSuivis ? "bg-cx-primary text-cx-primary-fg" : "border border-cx-border text-cx-muted-fg hover:text-cx-fg"
            }`}
          >
            Tout
          </Link>
          <Link
            href="/forum?suivis=1"
            aria-current={filtreSuivis ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filtreSuivis ? "bg-cx-primary text-cx-primary-fg" : "border border-cx-border text-cx-muted-fg hover:text-cx-fg"
            }`}
          >
            Abonnements
          </Link>
        </nav>
      )}

      <Tendances limite={6} />

      <form action="/forum" method="get" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          {t(locale, "forum.search")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t(locale, "forum.search")}
          className={CLASS_CHAMP}
        />
        <label htmlFor="tag" className="sr-only">
          {t(locale, "forum.tag_filter")}
        </label>
        <input
          id="tag"
          name="tag"
          type="text"
          defaultValue={tag}
          placeholder={t(locale, "forum.tag_filter")}
          className={`${CLASS_CHAMP} sm:max-w-40`}
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium hover:border-[var(--cx-accent)]"
        >
          {t(locale, "forum.filter")}
        </button>
        {filtreActif && (
          <Link
            href="/forum"
            className="px-2 py-2 text-sm font-medium text-[var(--cx-accent)] underline-offset-4 hover:underline"
          >
            {t(locale, "forum.reset")}
          </Link>
        )}
      </form>

      <div className="flex justify-end">
        <SelecteurTri
          basePath="/forum"
          params={{ q: q || undefined, tag: tag || undefined, tri }}
          actuelle={tri}
          options={[
            { valeur: "hot", cle: "sort.hot" },
            { valeur: "new", cle: "sort.new" },
            { valeur: "top", cle: "sort.top" },
          ]}
          libelles={{
            tri: t(locale, "sort.label"),
            "sort.recent": t(locale, "sort.recent"),
            "sort.popular": t(locale, "sort.popular"),
          }}
        />
      </div>

      {sujets.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          {filtreSuivis ? (
            <>
              <p className="text-lg font-semibold">Votre fil d&apos;abonnements est vide</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                Suivez des membres depuis l&apos;annuaire pour voir leurs sujets ici.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/annuaire"
                  className="rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg"
                >
                  Découvrir des membres
                </Link>
                <Link
                  href="/forum"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  Tout le forum
                </Link>
              </div>
            </>
          ) : filtreActif ? (
            <>
              <p className="text-lg font-semibold">{t(locale, "forum.empty_title")}</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                {t(locale, "forum.empty_desc")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/forum"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  {t(locale, "nav.forum")}
                </Link>
                <Link
                  href="/forum/nouveau"
                  className="rounded-lg bg-[var(--cx-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t(locale, "forum.new")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">{t(locale, "forum.empty_title")}</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                {t(locale, "forum.empty_desc")}
              </p>
              <Link
                href="/forum/nouveau"
                className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t(locale, "forum.new")}
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
                {sujet._count.replies} {sujet._count.replies > 1 ? t(locale, "forum.answers_many") : t(locale, "forum.answers_one")} ·{" "}
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
        params={{ q: q || undefined, tag: tag || undefined, tri }}
      />
    </main>
  );
}
