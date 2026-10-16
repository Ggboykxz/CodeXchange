import Link from "next/link";
import Avatar from "@/components/avatar";
import Pagination from "@/components/pagination";
import { drapeau } from "@/lib/drapeaux";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listCountries, listMembers, type MembreResume } from "@/lib/members";
import { cn } from "@/lib/cn";

export const metadata = { title: "Annuaire" };

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

/** Nombre de badges de stack affichés sur une carte d'annuaire. */
const BADGES_MAX = 3;

type Props = {
  searchParams: Promise<{ pays?: string; stack?: string; q?: string; page?: string }>;
};

/** Badge stack : une pastille par technologie (3 max sur les cartes). */
function BadgeStack({ technologie }: { technologie: string }) {
  return (
    <span className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary">
      {technologie}
    </span>
  );
}

/** Carte d'un membre : avatar, nom, titre, ville+pays avec drapeau, stack. */
function CarteMembre({ membre }: { membre: MembreResume }) {
  const visibles = membre.stack.slice(0, BADGES_MAX);
  const restantes = membre.stack.length - visibles.length;

  return (
    <li className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60">
      <Link href={`/membres/${membre.slug}`} className="flex items-start gap-4">
        <Avatar slug={membre.slug} nom={membre.nom} avatar={membre.avatar || undefined} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold leading-snug hover:text-cx-primary">
            {membre.nom}
          </h2>
          <p className="truncate text-sm text-cx-muted-fg">{membre.titre}</p>
          <p className="mt-1 text-xs text-cx-muted-fg">
            {drapeau(membre.pays)} {membre.ville}, {membre.pays}
          </p>
          <ul className="mt-3 flex flex-wrap items-center gap-2">
            {visibles.map((technologie) => (
              <li key={technologie}>
                <BadgeStack technologie={technologie} />
              </li>
            ))}
            {restantes > 0 && (
              <li className="text-xs tabular-nums text-cx-muted-fg">+{restantes}</li>
            )}
            {membre.role === "MENTOR" && (
              <li className="rounded-full bg-cx-warning/5 px-2.5 py-0.5 text-xs font-semibold text-cx-warning">
                Mentor
              </li>
            )}
          </ul>
        </div>
      </Link>
    </li>
  );
}

/** /annuaire — grille de membres + filtres pays/stack/recherche en query string. */
export default async function PageAnnuaire({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const pays = (params.pays ?? "").trim();
  const stack = (params.stack ?? "").trim();
  const page = normalizePage(params.page);

  const [resultatMembres, paysListes, locale] = await Promise.all([
    listMembers({ q: q || undefined, pays: pays || undefined, stack: stack || undefined, page, pageSize: 12 }),
    listCountries(),
    localeCourante(),
  ]);
  const membres = resultatMembres.items;
  const totalPages = resultatMembres.totalPages;
  const pageActuelle = resultatMembres.page;
  const filtreActif = q !== "" || pays !== "" || stack !== "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "directory.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {t(locale, "directory.subtitle")}
          </p>
        </div>
        <Link
          href="/inscription"
          className="rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg"
        >
          {t(locale, "nav.join")} · {t(locale, "directory.title")}
        </Link>
      </header>

      <form action="/annuaire" method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label htmlFor="q" className="sr-only">
          {t(locale, "directory.search")}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t(locale, "directory.search")}
          className={cn(CLASS_CHAMP, "sm:max-w-64")}
        />
        <label htmlFor="pays" className="sr-only">
          {t(locale, "directory.country_filter")}
        </label>
        <select id="pays" name="pays" defaultValue={pays} className={cn(CLASS_CHAMP, "sm:max-w-44")}>
          <option value="">Tous les pays</option>
          {paysListes.map((paysVu) => (
            <option key={paysVu} value={paysVu}>
              {drapeau(paysVu)} {paysVu}
            </option>
          ))}
        </select>
        <label htmlFor="stack" className="sr-only">
          {t(locale, "directory.stack_filter")}
        </label>
        <input
          id="stack"
          name="stack"
          type="text"
          defaultValue={stack}
          placeholder={t(locale, "directory.stack_filter")}
          className={cn(CLASS_CHAMP, "sm:max-w-40")}
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-lg border border-cx-border px-4 py-2 text-sm font-medium transition hover:border-cx-primary active:scale-[0.97]"
        >
          {t(locale, "directory.filter")}
        </button>
        {filtreActif && (
          <Link
            href="/annuaire"
            className="px-2 py-2 text-sm font-medium text-cx-primary underline-offset-4 hover:underline"
          >
            {t(locale, "directory.reset")}
          </Link>
        )}
      </form>

      {membres.length === 0 ? (
        <section className="rounded-xl border border-cx-border px-6 py-12 text-center">
          {filtreActif ? (
            <>
              <p className="text-lg font-semibold">{t(locale, "directory.empty_title")}</p>
              <p className="mt-2 text-sm text-cx-muted-fg">
                {t(locale, "directory.empty_desc")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/annuaire"
                  className="rounded-lg border border-cx-border px-4 py-2 text-sm font-medium"
                >
                  {t(locale, "directory.title")}
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg"
                >
                  {t(locale, "auth.register_link")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Aucun membre pour le moment.</p>
              <p className="mt-2 text-sm text-cx-muted-fg">
                Soyez le premier à remplir votre profil : ville, pays, stack et liens. La communauté
                vous trouve tout de suite.
              </p>
              <Link
                href="/inscription"
                className="mt-5 inline-block rounded-lg bg-cx-primary px-5 py-2.5 text-sm font-semibold text-cx-primary-fg"
              >
                Créer le premier profil
              </Link>
            </>
          )}
        </section>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {membres.map((membre) => (
            <CarteMembre key={membre.id} membre={membre} />
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/annuaire"
        params={{ q: q || undefined, pays: pays || undefined, stack: stack || undefined }}
      />
    </div>
  );
}
