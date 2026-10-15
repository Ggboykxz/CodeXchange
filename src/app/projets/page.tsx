import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listProjects } from "@/lib/projects";

export const metadata = { title: "Projets" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  searchParams: Promise<{ stack?: string; q?: string; page?: string }>;
};

/** Badge stack : une pastille par technologie du projet. */
function BadgeStack({ technologie }: { technologie: string }) {
  return (
    <span className="rounded-full bg-[var(--cx-accent)]/5 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
      {technologie}
    </span>
  );
}

/** /projets — liste des projets + recherche et filtre stack en query string. */
export default async function PageProjets({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const stack = (params.stack ?? "").trim();
  const page = normalizePage(params.page);

  const [resultat, locale] = await Promise.all([
    listProjects({
      q: q || undefined,
      stack: stack || undefined,
      page,
      pageSize: 12,
    }),
    localeCourante(),
  ]);
  const projets = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const filtreActif = q !== "" || stack !== "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "projects.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {t(locale, "projects.subtitle")}
          </p>
        </div>
        <Link
          href="/projets/nouveau"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-cx-accent-fg"
        >
          {t(locale, "projects.new")}
        </Link>
      </header>

      <form action="/projets" method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label htmlFor="q" className="sr-only">
          {t(locale, "projects.search")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t(locale, "projects.search")}
          className={`${CLASS_CHAMP} sm:max-w-64`}
        />
        <label htmlFor="stack" className="sr-only">
          {t(locale, "projects.stack_filter")}
        </label>
        <input
          id="stack"
          name="stack"
          type="text"
          defaultValue={stack}
          placeholder={t(locale, "projects.stack_filter")}
          className={`${CLASS_CHAMP} sm:max-w-40`}
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium hover:border-[var(--cx-accent)]"
        >
          {t(locale, "projects.filter")}
        </button>
        {filtreActif && (
          <Link
            href="/projets"
            className="px-2 py-2 text-sm font-medium text-[var(--cx-accent)] underline-offset-4 hover:underline"
          >
            {t(locale, "projects.reset")}
          </Link>
        )}
      </form>

      {projets.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          {filtreActif ? (
            <>
              <p className="text-lg font-semibold">{t(locale, "projects.empty_title")}</p>
              <p className="mt-2 text-sm text-cx-muted-fg">
                {t(locale, "projects.empty_desc")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/projets"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  {t(locale, "projects.title")}
                </Link>
                <Link
                  href="/projets/nouveau"
                  className="rounded-lg bg-[var(--cx-accent)] px-4 py-2 text-sm font-semibold text-cx-accent-fg"
                >
                  {t(locale, "projects.new")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">{t(locale, "projects.empty_title")}</p>
              <p className="mt-2 text-sm text-cx-muted-fg">
                {t(locale, "projects.empty_desc")}
              </p>
              <Link
                href="/projets/nouveau"
                className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-cx-accent-fg"
              >
                {t(locale, "projects.new")}
              </Link>
            </>
          )}
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {projets.map((projet) => (
            <li
              key={projet.id}
              className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60"
            >
              <Link href={`/projets/${projet.id}`} className="block">
                <h2 className="text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
                  {projet.titre}
                </h2>
              </Link>

              <p className="mt-1 line-clamp-2 text-sm text-cx-muted-fg">
                {projet.description}
              </p>

              <p className="mt-2 text-xs text-cx-muted-fg">
                {projet.author.nom} · {projet.author.ville}, {projet.author.pays} ·{" "}
                {DATE.format(projet.createdAt)} ·{" "}
                {projet._count.membres} {projet._count.membres > 1 ? t(locale, "projects.members_many") : t(locale, "projects.members_one")}
              </p>

              <ul className="mt-3 flex flex-wrap items-center gap-2">
                {projet.stack.map((technologie) => (
                  <li key={technologie}>
                    <BadgeStack technologie={technologie} />
                  </li>
                ))}
                {projet.cherche.length > 0 && (
                  <li className="text-xs font-medium text-cx-muted-fg">
                    {t(locale, "projects.search")}&nbsp;: {projet.cherche.join(", ")}
                  </li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/projets"
        params={{ q: q || undefined, stack: stack || undefined }}
      />
    </div>
  );
}
