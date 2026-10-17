import Link from "next/link";
import { searchCodeXchange } from "@/lib/search";
import { localeCourante, t } from "@/lib/i18n";
import BarreRecherche from "@/components/barre-recherche";
import { suggestionsRecherche } from "@/lib/suggestions";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recherche" };


type Props = { searchParams: Promise<{ q?: string; type?: string }> };

function encodage(q: string): string {
  return encodeURIComponent(q);
}

export default async function PageRecherche({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const typeFiltre = params.type ?? "all";
  const [resultat, locale, suggestions] = await Promise.all([
    searchCodeXchange(q),
    localeCourante(),
    suggestionsRecherche(),
  ]);

  const total =
    resultat.sujets.length +
    resultat.offres.length +
    resultat.projets.length +
    resultat.membres.length +
    resultat.tutos.length;

  const sections: {
    cle: string;
    titre: string;
    hrefBase: string;
    voirTout: string;
    items: { id: string; titre: string; href: string; meta?: string }[];
  }[] = [
    {
      cle: "forum",
      titre: t(locale, "nav.forum"),
      hrefBase: "/forum",
      voirTout: `/forum?q=${encodage(q)}`,
      items: resultat.sujets.map((sujet) => ({
        id: `sujet-${sujet.id}`,
        titre: sujet.titre,
        href: `/forum/${sujet.id}`,
      })),
    },
    {
      cle: "jobs",
      titre: t(locale, "nav.jobs"),
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
      cle: "projets",
      titre: t(locale, "nav.projects"),
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
      cle: "membres",
      titre: t(locale, "nav.directory"),
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
      cle: "tutos",
      titre: t(locale, "nav.tutorials"),
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
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-black tracking-tight">{t(locale, "search.title")}</h1>
        <p className="text-sm tabular-nums text-cx-muted-fg">
          {t(locale, "search.subtitle")} — {total}
        </p>
        <div className="max-w-md">
          <BarreRecherche suggestions={suggestions} />
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Filtre de recherche">
          {[
            { cle: "all", libelle: "Tout" },
            { cle: "forum", libelle: t(locale, "nav.forum") },
            { cle: "jobs", libelle: t(locale, "nav.jobs") },
            { cle: "projets", libelle: t(locale, "nav.projects") },
            { cle: "membres", libelle: t(locale, "nav.directory") },
            { cle: "tutos", libelle: t(locale, "nav.tutorials") },
          ].map((f) => (
            <Link
              key={f.cle}
              href={`/recherche?q=${encodage(q)}&type=${f.cle}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                typeFiltre === f.cle
                  ? "bg-cx-primary text-cx-primary-fg"
                  : "border border-cx-border text-cx-muted-fg hover:bg-cx-muted"
              }`}
            >
              {f.libelle}
            </Link>
          ))}
        </nav>
      </header>

      {total === 0 ? (
        <EmptyState
          titre={t(locale, "search.empty_title")}
          description={
            q.length > 0
              ? `Rien ne correspond à « ${q} ». Essayez un autre mot-clé.`
              : t(locale, "search.min_chars")
          }
          cta={t(locale, "nav.forum")}
          href="/forum"
        />
      ) : (
        <div className="flex flex-col gap-8">
          {sections
            .filter((section) => section.items.length > 0 && (typeFiltre === "all" || section.cle === typeFiltre))
            .map((section) => (
              <section key={section.titre} className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <h2 className="text-xl font-bold tracking-tight">
                    {section.titre}{" "}
                    <span className="text-sm font-normal tabular-nums text-cx-muted-fg">
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
                        className="block px-4 py-3 text-sm transition hover:bg-cx-muted"
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
    </div>
  );
}