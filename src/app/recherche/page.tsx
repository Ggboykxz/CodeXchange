import Link from "next/link";
import { searchCodeXchange } from "@/lib/search";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recherche" };

type Props = { searchParams: Promise<{ q?: string }> };

function encodage(q: string): string {
  return encodeURIComponent(q);
}

export default async function PageRecherche({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const resultat = await searchCodeXchange(q);

  const total =
    resultat.sujets.length +
    resultat.offres.length +
    resultat.projets.length +
    resultat.membres.length +
    resultat.tutos.length;

  const sections: {
    titre: string;
    hrefBase: string;
    voirTout: string;
    items: { id: string; titre: string; href: string; meta?: string }[];
  }[] = [
    {
      titre: "Sujets",
      hrefBase: "/forum",
      voirTout: `/forum?q=${encodage(q)}`,
      items: resultat.sujets.map((sujet) => ({
        id: `sujet-${sujet.id}`,
        titre: sujet.titre,
        href: `/forum/${sujet.id}`,
      })),
    },
    {
      titre: "Offres",
      hrefBase: "/jobs",
      voirTout: `/jobs?q=${encodage(q)}`,
      items: resultat.offres.map((offre) => ({
        id: `offre-${offre.id}`,
        titre: offre.titre,
        href: `/jobs/${offre.id}`,
        meta: `${offre.entreprise} · ${offre.pays}`,
      })),
    },
    {
      titre: "Projets",
      hrefBase: "/projets",
      voirTout: `/projets?q=${encodage(q)}`,
      items: resultat.projets.map((projet) => ({
        id: `projet-${projet.id}`,
        titre: projet.titre,
        href: `/projets/${projet.id}`,
        meta: projet.stack,
      })),
    },
    {
      titre: "Membres",
      hrefBase: "/annuaire",
      voirTout: `/annuaire?q=${encodage(q)}`,
      items: resultat.membres.map((membre) => ({
        id: `membre-${membre.id}`,
        titre: membre.nom,
        href: `/membres/${membre.slug}`,
        meta: `${membre.titre} · ${membre.ville}, ${membre.pays}`,
      })),
    },
    {
      titre: "Tutos",
      hrefBase: "/tutos",
      voirTout: `/tutos?q=${encodage(q)}`,
      items: resultat.tutos.map((tuto) => ({
        id: `tuto-${tuto.id}`,
        titre: tuto.titre,
        href: `/tutos/${tuto.slug}`,
        meta: tuto.resume,
      })),
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-black tracking-tight">Recherche globale</h1>
        <p className="text-sm text-cx-muted-fg">
          On a trouvé {total} résultat{total > 1 ? "s" : ""}.
        </p>
        <form action="/recherche" method="get" className="flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher partout…"
            className="w-full rounded-lg border border-cx-border bg-transparent px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
          />
          <button
            type="submit"
            className="rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-cx-primary-fg"
          >
            Chercher
          </button>
        </form>
      </header>

      {total === 0 ? (
        <EmptyState
          titre="Aucun résultat"
          description={
            q.length > 0
              ? `Rien ne correspond à « ${q} ». Essayez un autre mot-clé.`
              : "Saisissez au moins deux caractères pour lancer la recherche."
          }
          cta="Parcourir le forum"
          href="/forum"
        />
      ) : (
        <div className="flex flex-col gap-8">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <section key={section.titre} className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <h2 className="text-xl font-bold tracking-tight">
                    {section.titre}{" "}
                    <span className="text-sm font-normal text-cx-muted-fg">
                      ({section.items.length})
                    </span>
                  </h2>
                  <Link
                    href={section.voirTout}
                    className="text-sm font-semibold text-cx-primary hover:underline"
                  >
                    Voir tout →
                  </Link>
                </div>
                <ul className="divide-y divide-cx-border rounded-xl border border-cx-border bg-cx-card">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="block px-4 py-3 text-sm hover:bg-cx-muted"
                      >
                        <span className="font-medium">{item.titre}</span>
                        {item.meta ? (
                          <span className="ml-2 text-cx-muted-fg">· {item.meta}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}