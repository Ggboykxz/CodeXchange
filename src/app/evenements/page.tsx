import Link from "next/link";
import Pagination from "@/components/pagination";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t } from "@/lib/i18n";
import { listEvents } from "@/lib/events";
import { EvenementsFeed } from "@/components/fils-listes";

export const metadata = { title: "Événements" };

// Rendu à la demande : la liste doit refléter la base au moment de la visite
// (seed exécuté après le build), jamais un état figé à la compilation.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string }> };

/** Horodatage de référence ( passé / à venir ), figé par requête serveur. */
const MAINTENANT = Date.now();

/** /evenements — liste chronologique (passés d'abord) avec badges et compteur RSVP. */
export default async function PageEvenements({ searchParams }: Props) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const [resultat, locale] = await Promise.all([listEvents({ page, pageSize: 4 }), localeCourante()]);
  const evenements = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "events.title")}</h1>
          <p className="mt-1 text-sm text-cx-muted-fg">
            {t(locale, "events.subtitle")}
          </p>
        </div>
      </header>

      {evenements.length === 0 ? (
        <section className="rounded-xl border border-cx-border px-6 py-12 text-center">
          <p className="text-lg font-semibold">Aucun événement programmé pour le moment.</p>
          <p className="mt-2 text-sm text-cx-muted-fg">
            Vous organisez un meet-up ou un hackathon ? Annoncez-le sur le forum : la communauté
            se mobilise vite.
          </p>
          <Link
            href="/forum/nouveau"
            className="mt-5 inline-block rounded-full bg-cx-accent px-5 py-2.5 text-sm font-semibold text-cx-accent-fg"
          >
            Annoncer un événement sur le forum
          </Link>
        </section>
      ) : (
        <EvenementsFeed
          initialItems={evenements}
          totalPages={totalPages}
          currentPage={pageActuelle}
          locale={locale}
          maintenant={MAINTENANT}
        />
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/evenements"
      />
    </div>
  );
}
