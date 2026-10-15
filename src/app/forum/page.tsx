import Link from "next/link";
import Pagination from "@/components/pagination";
import CarteSujet from "@/components/carte-sujet";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import SelecteurTri from "@/components/selecteur-tri";
import Tendances from "@/components/tendances";
import { listPosts } from "@/lib/forum";
import { idsSuivis } from "@/lib/follows";
import { topHashtags } from "@/lib/hashtags";
import { prisma } from "@/lib/db";
import { Icone } from "@/components/icones";

export const metadata = { title: "Forum" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type Props = { searchParams: Promise<{ q?: string; tag?: string; page?: string; tri?: string; suivis?: string }> };

/** /forum — fil façon Reddit : nav communautés | cartes avec vote | widget à propos. */
export default async function PageForum({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tag = (params.tag ?? "").trim();
  const page = normalizePage(params.page);
  const userId = await getSessionUserId();
  const triParam = params.tri;
  const tri = triParam === "new" || triParam === "top" ? triParam : "hot";
  const filtreSuivis = params.suivis === "1" && userId !== null;
  const auteursSuivis = filtreSuivis ? await idsSuivis(userId as number) : undefined;

  const [resultat, locale, communautes, membres] = await Promise.all([
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
    topHashtags(8),
    prisma.user.count(),
  ]);
  const sujets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const filtreActif = q !== "" || tag !== "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Colonne centrale : fil */}
        <div className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{t(locale, "forum.title")}</h1>
              <p className="mt-1 text-sm text-cx-muted-fg">{t(locale, "forum.subtitle")}</p>
            </div>
            <Link
              href="/forum/nouveau"
              className="inline-flex items-center gap-1.5 rounded-full bg-cx-accent px-4 py-2 text-sm font-bold text-cx-accent-fg hover:opacity-90 active:scale-[0.97]"
            >
              <Icone nom="plus" className="h-4 w-4" />
              {t(locale, "forum.new")}
            </Link>
          </header>

          {/* Recherche. */}
          <form action="/forum" method="get" className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="q" className="sr-only">
              {t(locale, "forum.search")}
            </label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder={t(locale, "forum.search")} className={CLASS_CHAMP} />
            <label htmlFor="tag" className="sr-only">
              {t(locale, "forum.tag_filter")}
            </label>
            <input id="tag" name="tag" type="text" defaultValue={tag} placeholder={t(locale, "forum.tag_filter")} className={`${CLASS_CHAMP} sm:max-w-40`} />
            <button type="submit" className="rounded-lg border border-cx-border px-4 py-2 text-sm font-medium hover:bg-cx-muted">
              {t(locale, "forum.filter")}
            </button>
            {filtreActif ? (
              <Link href="/forum" className="px-2 py-2 text-sm font-medium text-cx-accent underline-offset-4 hover:underline">
                {t(locale, "forum.reset")}
              </Link>
            ) : null}
          </form>

          {/* Barre de tri façon Reddit : filtres à gauche, tri à droite. */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-cx-border bg-cx-card px-2 py-1.5">
            <nav aria-label="Filtrer le fil" className="flex gap-1">
              <Link
                href="/forum"
                aria-current={!filtreSuivis ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                  !filtreSuivis ? "bg-cx-primary text-cx-primary-fg" : "text-cx-muted-fg hover:bg-cx-muted"
                }`}
              >
                Tout
              </Link>
              {userId !== null ? (
                <Link
                  href="/forum?suivis=1"
                  aria-current={filtreSuivis ? "page" : undefined}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    filtreSuivis ? "bg-cx-primary text-cx-primary-fg" : "text-cx-muted-fg hover:bg-cx-muted"
                  }`}
                >
                  Abonnements
                </Link>
              ) : null}
            </nav>
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

          {/* Tendances (visible sur toutes les tailles). */}
          <div className="mt-4">
            <Tendances limite={6} />
          </div>

          {/* Fil de cartes. */}
          {sujets.length === 0 ? (
            <section className="mt-4 rounded-lg border border-dashed border-cx-border px-6 py-12 text-center">
              {filtreSuivis ? (
                <>
                  <p className="text-lg font-semibold">Votre fil d&apos;abonnements est vide</p>
                  <p className="mt-2 text-sm text-cx-muted-fg">Suivez des membres depuis l&apos;annuaire pour voir leurs sujets ici.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/annuaire" className="rounded-full bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg active:scale-[0.97]">
                      Découvrir des membres
                    </Link>
                    <Link href="/forum" className="rounded-lg border border-cx-border px-4 py-2 text-sm font-medium">
                      Tout le forum
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">{t(locale, "forum.empty_title")}</p>
                  <p className="mt-2 text-sm text-cx-muted-fg">{t(locale, "forum.empty_desc")}</p>
                  <Link href="/forum/nouveau" className="mt-5 inline-block rounded-full bg-cx-accent px-5 py-2.5 text-sm font-semibold text-cx-accent-fg active:scale-[0.97]">
                    {t(locale, "forum.new")}
                  </Link>
                </>
              )}
            </section>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {sujets.map((sujet) => (
                <CarteSujet key={sujet.id} sujet={sujet} locale={locale} connecte={userId !== null} />
              ))}
            </ul>
          )}

          <Pagination
            page={pageActuelle}
            totalPages={totalPages}
            basePath="/forum"
            params={{ q: q || undefined, tag: tag || undefined, tri }}
          />
        </div>

        {/* ── Colonne droite : widget à propos (≥ xl) ──────────────── */}
        <aside className="hidden xl:block xl:sticky xl:top-20">
          <section className="overflow-hidden rounded-lg border border-cx-border bg-cx-card">
            <div className="h-14 border-b border-cx-border bg-cx-muted" />
            <div className="p-4">
              <h2 className="text-lg font-bold">À propos de CodeXchange</h2>
              <p className="mt-1.5 text-sm text-cx-muted-fg">
                La communauté des développeurs d&apos;Afrique : pose des questions, partage des projets et trouve des co-fondateurs.
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-md bg-cx-muted/60 py-2">
                  <dt className="text-xs text-cx-muted-fg">Membres</dt>
                  <dd className="text-lg font-bold">{membres}</dd>
                </div>
                <div className="rounded-md bg-cx-muted/60 py-2">
                  <dt className="text-xs text-cx-muted-fg">Communautés</dt>
                  <dd className="text-lg font-bold">{communautes.length}</dd>
                </div>
              </dl>
              {userId === null ? (
                <Link href="/inscription" className="mt-4 block rounded-full bg-cx-accent py-2 text-center text-sm font-bold text-cx-accent-fg hover:opacity-90 active:scale-[0.97]">
                  {t(locale, "nav.join")}
                </Link>
              ) : (
                <Link href="/forum/nouveau" className="mt-4 block rounded-full bg-cx-accent py-2 text-center text-sm font-bold text-cx-accent-fg hover:opacity-90 active:scale-[0.97]">
                  {t(locale, "forum.new")}
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
