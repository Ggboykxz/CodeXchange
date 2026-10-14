import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t, type Locale } from "@/lib/i18n";
import SelecteurTri from "@/components/selecteur-tri";
import { CONTRATS, listJobs } from "@/lib/jobs";

export const metadata = { title: "Offres d'emploi" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  searchParams: Promise<{ remote?: string; pays?: string; contrat?: string; q?: string; page?: string; tri?: string }>;
};

/** Badge contrat : rempli pour le type de contrat, bordé pour le mode de travail. */
function BadgeContrat({ contrat }: { contrat: string }) {
  return (
    <span className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
      {contrat}
    </span>
  );
}

function BadgeRemote({ remote, locale }: { remote: boolean; locale: Locale }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        remote
          ? "bg-cx-success/10 text-cx-success"
          : "border border-[var(--cx-muted)]/40 text-[var(--cx-muted)]"
      }`}
    >
      {remote ? t(locale, "jobs.remote") : t(locale, "jobs.onsite")}
    </span>
  );
}

/** /jobs — liste des offres + filtres persistés en query string. */
export default async function PageJobs({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const pays = (params.pays ?? "").trim();
  const contrat = (params.contrat ?? "").trim();
  const remote = (params.remote ?? "").trim();
  const tri = params.tri === "populaire" ? "populaire" : "recent";
  const page = normalizePage(params.page);

  const [resultat, locale] = await Promise.all([listJobs({
    q: q || undefined,
    pays: pays || undefined,
    contrat: contrat || undefined,
    remote: remote === "" ? undefined : remote === "1",
    page,
    pageSize: 12,
    tri,
  }),
    localeCourante(),
  ]);
  const offres = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const filtreActif = q !== "" || pays !== "" || contrat !== "" || remote !== "";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "jobs.title")}</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            {t(locale, "jobs.subtitle")}
          </p>
        </div>
        <Link
          href="/jobs/nouveau"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {t(locale, "jobs.new")}
        </Link>
      </header>

      <form action="/jobs" method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label htmlFor="q" className="sr-only">
          {t(locale, "jobs.search")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t(locale, "jobs.search")}
          className={`${CLASS_CHAMP} sm:max-w-56`}
        />
        <label htmlFor="pays" className="sr-only">
          {t(locale, "jobs.country_filter")}
        </label>
        <input
          id="pays"
          name="pays"
          type="text"
          defaultValue={pays}
          placeholder={t(locale, "jobs.country_filter")}
          className={`${CLASS_CHAMP} sm:max-w-36`}
        />
        <label htmlFor="contrat" className="sr-only">
          {t(locale, "jobs.contract_filter")}
        </label>
        <select
          id="contrat"
          name="contrat"
          defaultValue={contrat}
          className={`${CLASS_CHAMP} sm:max-w-36`}
        >
          <option value="">Contrat</option>
          {CONTRATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label htmlFor="remote" className="sr-only">
          {t(locale, "jobs.remote_filter")}
        </label>
        <select
          id="remote"
          name="remote"
          defaultValue={remote}
          className={`${CLASS_CHAMP} sm:max-w-36`}
        >
          <option value="">{t(locale, "jobs.remote")} / {t(locale, "jobs.onsite")}</option>
          <option value="1">{t(locale, "jobs.remote")}</option>
          <option value="0">{t(locale, "jobs.onsite")}</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium hover:border-[var(--cx-accent)]"
        >
          {t(locale, "jobs.filter")}
        </button>
        {filtreActif && (
          <Link
            href="/jobs"
            className="px-2 py-2 text-sm font-medium text-[var(--cx-accent)] underline-offset-4 hover:underline"
          >
            {t(locale, "jobs.reset")}
          </Link>
        )}
      </form>

      <div className="flex justify-end">
        <SelecteurTri
          basePath="/jobs"
          params={{
            q: q || undefined,
            pays: pays || undefined,
            contrat: contrat || undefined,
            remote: remote || undefined,
          }}
          actuelle={tri}
          options={[
            { valeur: "recent", cle: "sort.recent" },
            { valeur: "populaire", cle: "sort.popular" },
          ]}
          libelles={{
            tri: t(locale, "sort.label"),
            "sort.recent": t(locale, "sort.recent"),
            "sort.popular": t(locale, "sort.popular"),
          }}
        />
      </div>

      {offres.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          {filtreActif ? (
            <>
              <p className="text-lg font-semibold">{t(locale, "jobs.empty_title")}</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                {t(locale, "jobs.empty_desc")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/jobs"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  {t(locale, "jobs.title")}
                </Link>
                <Link
                  href="/jobs/nouveau"
                  className="rounded-lg bg-[var(--cx-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t(locale, "jobs.new")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">{t(locale, "jobs.empty_title")}</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                {t(locale, "jobs.empty_desc")}
              </p>
              <Link
                href="/jobs/nouveau"
                className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {t(locale, "jobs.new")}
              </Link>
            </>
          )}
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {offres.map((offre) => (
            <li
              key={offre.id}
              className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60"
            >
              <Link href={`/jobs/${offre.id}`} className="block">
                <h2 className="text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
                  {offre.titre}
                </h2>
              </Link>

              <p className="mt-1 text-xs text-[var(--cx-muted)]">
                {offre.entreprise} ·{" "}
                {offre.remote && offre.ville
                  ? `${offre.ville}, ${offre.pays} · remote possible`
                  : offre.ville
                    ? `${offre.ville}, ${offre.pays}`
                    : offre.pays}{" "}
                · {DATE.format(offre.createdAt)}
              </p>

              <ul className="mt-3 flex flex-wrap gap-2">
                <li>
                  <BadgeContrat contrat={offre.contrat} />
                </li>
                <li>
                  <BadgeRemote remote={offre.remote} locale={locale} />
                </li>
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/jobs"
        params={{ q: q || undefined, pays: pays || undefined, contrat: contrat || undefined, remote: remote || undefined }}
      />
    </div>
  );
}
