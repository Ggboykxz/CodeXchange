import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { listTutorials } from "@/lib/tutorials";

export const metadata = { title: "Tutos" };

// Rendu à la demande : la liste doit refléter la base au moment de la visite
// (seed exécuté après le build), jamais un état figé à la compilation.
export const dynamic = "force-dynamic";

/** Lien discret vers les autres rubriques créées par la Task 8. */
const RUBRIQUES = [
  { href: "/evenements", libelle: "Événements" },
  { href: "/tutos", libelle: "Tutos" },
  { href: "/mentorat", libelle: "Mentorat" },
] as const;

function NavRubriques() {
  return (
    <nav aria-label="Rubriques" className="flex flex-wrap gap-3 text-sm">
      {RUBRIQUES.map((rubrique) => (
        <Link
          key={rubrique.href}
          href={rubrique.href}
          className="text-[var(--cx-muted)] underline-offset-4 hover:text-[var(--cx-accent)] hover:underline"
        >
          {rubrique.libelle}
        </Link>
      ))}
    </nav>
  );
}

type Props = { searchParams: Promise<{ page?: string }> };

/** /tutos — liste des articles : durée de lecture, tags, résumé. */
export default async function PageTutos({ searchParams }: Props) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const resultat = await listTutorials({ page, pageSize: 12 });
  const tutos = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Tutos</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            Des articles courts et pratiques, écrits par la communauté — à lire dans le métro.
          </p>
        </div>
        <NavRubriques />
      </header>

      {tutos.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          <p className="text-lg font-semibold">Aucun tuto publié pour le moment.</p>
          <p className="mt-2 text-sm text-[var(--cx-muted)]">
            Vous avez résolu un bug récemment ? Écrivez le premier tuto : un paragraphe suffit pour
            démarrer.
          </p>
          <Link
            href="/forum/nouveau"
            className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Écrire le premier tuto sur le forum
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {tutos.map((tuto) => (
            <li
              key={tuto.id}
              className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60"
            >
              <Link href={`/tutos/${tuto.slug}`} className="block">
                <h2 className="text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
                  {tuto.titre}
                </h2>
              </Link>

              <p className="mt-1 text-sm text-[var(--cx-muted)]">{tuto.resume}</p>

              <ul className="mt-3 flex flex-wrap items-center gap-2">
                <li className="rounded-full border border-[var(--cx-muted)]/40 px-2.5 py-0.5 text-xs font-medium text-[var(--cx-muted)]">
                  ⏱ {tuto.dureeMin} min de lecture
                </li>
                {tuto.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/tutos"
      />
    </main>
  );
}
