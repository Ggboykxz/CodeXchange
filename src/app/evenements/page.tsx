import Link from "next/link";
import Pagination from "@/components/pagination";
import { drapeau } from "@/lib/drapeaux";
import { normalizePage } from "@/lib/pagination";
import { localeCourante, t, type Locale } from "@/lib/i18n";
import { listEvents, type EventResume } from "@/lib/events";

export const metadata = { title: "Événements" };

// Rendu à la demande : la liste doit refléter la base au moment de la visite
// (seed exécuté après le build), jamais un état figé à la compilation.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Lien discret vers les autres rubriques créées par la Task 8. */
/** Badge « Passé » / « À venir » selon la date du jour d'exécution. */
function StatutEvenement({ date, maintenant, locale }: { date: Date; maintenant: Date; locale: Locale }) {
  const passe = date.getTime() <= maintenant.getTime();
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        passe
          ? "border border-[var(--cx-muted)]/40 text-[var(--cx-muted)]"
          : "bg-cx-success/10 text-cx-success"
      }`}
    >
      {passe ? t(locale, "events.past") : t(locale, "events.upcoming")}
    </span>
  );
}

/** Lieu d'un événement : présentiel = ville/pays avec drapeau, en ligne = le lien. */
function LieuEvenement({ evenement }: { evenement: EventResume }) {
  if (evenement.format === "En ligne" || evenement.format === "Online") {
    return (
      <>
        En ligne
        {evenement.lien && (
          <>
            {" · "}
            <a
              href={evenement.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--cx-accent)] underline-offset-4 hover:underline"
            >
              Rejoindre le live ↗
            </a>
          </>
        )}
      </>
    );
  }
  if (evenement.ville || evenement.pays) {
    return (
      <>
        {drapeau(evenement.pays)}{" "}
        {[evenement.ville, evenement.pays].filter(Boolean).join(", ")}
      </>
    );
  }
  return "Lieu à confirmer";
}

/** Compteur de présences, au singulier ou au pluriel. */
function Compteur({ nombre }: { nombre: number }) {
  return (
    <span className="text-xs text-[var(--cx-muted)]">
      {nombre} {nombre > 1 ? "participants" : "participant"}
    </span>
  );
}

type Props = { searchParams: Promise<{ page?: string }> };

/** /evenements — liste chronologique (passés d'abord) avec badges et compteur RSVP. */
export default async function PageEvenements({ searchParams }: Props) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const [resultat, locale] = await Promise.all([listEvents({ page, pageSize: 12 }), localeCourante()]);
  const evenements = resultat.items;
  const totalPages = resultat.totalPages;
  const pageActuelle = resultat.page;
  const maintenant = new Date();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t(locale, "events.title")}</h1>
          <p className="mt-1 text-sm text-[var(--cx-muted)]">
            {t(locale, "events.subtitle")}
          </p>
        </div>
      </header>

      {evenements.length === 0 ? (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-6 py-12 text-center">
          <p className="text-lg font-semibold">Aucun événement programmé pour le moment.</p>
          <p className="mt-2 text-sm text-[var(--cx-muted)]">
            Vous organisez un meet-up ou un hackathon ? Annoncez-le sur le forum : la communauté
            se mobilise vite.
          </p>
          <Link
            href="/forum/nouveau"
            className="mt-5 inline-block rounded-lg bg-[var(--cx-accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Annoncer un événement sur le forum
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {evenements.map((evenement) => (
            <li
              key={evenement.id}
              className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-4 transition hover:border-[var(--cx-accent)]/60"
            >
              <Link href={`/evenements/${evenement.id}`} className="block">
                <h2 className="text-lg font-semibold leading-snug hover:text-[var(--cx-accent)]">
                  {evenement.titre}
                </h2>
              </Link>

              <p className="mt-1 text-xs text-[var(--cx-muted)]">
                <time dateTime={evenement.date.toISOString()}>
                  {DATE.format(evenement.date)} · {HEURE.format(evenement.date)}
                </time>{" "}
                · <LieuEvenement evenement={evenement} />
              </p>

              <ul className="mt-3 flex flex-wrap items-center gap-2">
                <li>
                  <StatutEvenement date={evenement.date} maintenant={maintenant} locale={locale} />
                </li>
                <li>
                  <span className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
                    {evenement.format}
                  </span>
                </li>
                <li>
                  <Compteur nombre={evenement._count.rsvps} />
                </li>
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        basePath="/evenements"
      />
    </main>
  );
}
