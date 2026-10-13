import Link from "next/link";
import { CONTRATS, listJobs } from "@/lib/jobs";

export const metadata = { title: "Offres d'emploi" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  searchParams: Promise<{ remote?: string; pays?: string; contrat?: string; q?: string }>;
};

/** Badge contrat : rempli pour le type de contrat, bordé pour le mode de travail. */
function BadgeContrat({ contrat }: { contrat: string }) {
  return (
    <span className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
      {contrat}
    </span>
  );
}

function BadgeRemote({ remote }: { remote: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        remote
          ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
          : "border border-[var(--cx-muted)]/40 text-[var(--cx-muted)]"
      }`}
    >
      {remote ? "Remote" : "Sur place"}
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

  const offres = await listJobs({
    q: q || undefined,
    pays: pays || undefined,
    contrat: contrat || undefined,
    remote: remote === "" ? undefined : remote === "1",
  });
  const filtreActif = q !== "" || pays !== "" || contrat !== "" || remote !== "";

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Offres d&apos;emploi</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            Missions, CDI et stages pour les développeurs d&apos;Afrique — en remote ou sur place.
          </p>
        </div>
        <Link
          href="/jobs/nouveau"
          className="rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Publier une offre
        </Link>
      </header>

      <form action="/jobs" method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label htmlFor="q" className="sr-only">
          Rechercher une offre
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Rechercher (titre, entreprise, ville)…"
          className={`${CLASS_CHAMP} sm:max-w-56`}
        />
        <label htmlFor="pays" className="sr-only">
          Filtrer par pays
        </label>
        <input
          id="pays"
          name="pays"
          type="text"
          defaultValue={pays}
          placeholder="Pays (ex. Gabon)"
          className={`${CLASS_CHAMP} sm:max-w-36`}
        />
        <label htmlFor="contrat" className="sr-only">
          Filtrer par contrat
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
          Filtrer par mode de travail
        </label>
        <select
          id="remote"
          name="remote"
          defaultValue={remote}
          className={`${CLASS_CHAMP} sm:max-w-36`}
        >
          <option value="">Remote ou sur place</option>
          <option value="1">Remote</option>
          <option value="0">Sur place</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium hover:border-[var(--cx-accent)]"
        >
          Filtrer
        </button>
        {filtreActif && (
          <Link
            href="/jobs"
            className="px-2 py-2 text-sm font-medium text-[var(--cx-accent)] underline-offset-4 hover:underline"
          >
            Tout effacer
          </Link>
        )}
      </form>

      {offres.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          {filtreActif ? (
            <>
              <p className="text-lg font-semibold">Aucune offre ne correspond à vos filtres.</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                Essayez un autre mot-clé, un autre pays ou un autre type de contrat.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/jobs"
                  className="rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2 text-sm font-medium"
                >
                  Voir toutes les offres
                </Link>
                <Link
                  href="/jobs/nouveau"
                  className="rounded-lg bg-[var(--cx-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Publier une offre
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Aucune offre pour le moment.</p>
              <p className="mt-2 text-sm text-[var(--cx-muted)]">
                Vous recrutez ? Publiez la première offre : la communauté la voit tout de suite.
              </p>
              <Link
                href="/jobs/nouveau"
                className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Publier la première offre
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
                  <BadgeRemote remote={offre.remote} />
                </li>
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
