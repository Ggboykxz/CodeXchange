import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aPostule, getJob } from "@/lib/jobs";
import { parseId } from "@/lib/forum";
import { isFavorite } from "@/lib/favorites";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import BoutonPostuler from "./bouton-postuler";
import BoutonFavori from "@/components/bouton-favori";
import BoutonSignaler from "@/components/bouton-signaler";
import FilAriane from "@/components/fil-ariane";

type Props = { params: Promise<{ id: string }> };

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

async function lireOffre(id: string) {
  const jobId = parseId(id);
  if (jobId === null) return null;
  return getJob(jobId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const offre = await lireOffre(id);
  return { title: offre ? `${offre.titre} — ${offre.entreprise}` : "Offre introuvable" };
}

/** /jobs/[id] — détail d'une offre : bouton postuler + lien externe vers l'origine. */
export default async function PageOffre({ params }: Props) {
  const { id } = await params;
  const jobId = parseId(id);
  if (jobId === null) notFound();
  const offre = await getJob(jobId);
  if (!offre) notFound();

  const [userId, locale] = await Promise.all([getSessionUserId(), localeCourante()]);
  const dejaPostule = userId === null ? false : await aPostule(userId, jobId);
  const favoriDeLoffre = userId === null ? false : await isFavorite(userId, "job", jobId);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/jobs" className="text-sm text-[var(--cx-accent)]">
        <FilAriane
          items={[
            { label: t(locale, "nav.home"), href: "/" },
            { label: t(locale, "nav.jobs"), href: "/jobs" },
            { label: offre.titre },
          ]}
        />
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {offre.titre}
        </h1>
        <p className="text-sm text-[var(--cx-muted)]">
          {offre.entreprise} ·{" "}
          {offre.ville ? `${offre.ville}, ${offre.pays}` : offre.pays} ·{" "}
          {DATE.format(offre.createdAt)}
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <span className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
              {offre.contrat}
            </span>
          </li>
          <li>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                offre.remote
                  ? "bg-cx-success/10 text-cx-success"
                  : "border border-[var(--cx-muted)]/40 text-[var(--cx-muted)]"
              }`}
            >
              {offre.remote ? t(locale, "jobs.remote") : t(locale, "jobs.onsite")}
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <BoutonPostuler
              jobId={jobId}
              connecte={userId !== null}
              dejaPostule={dejaPostule}
              compteur={offre._count.candidatures}
            />
            <BoutonFavori kind="job" targetId={jobId} initial={favoriDeLoffre} connecte={userId !== null} />
          </div>
          <BoutonSignaler kind="job" targetId={jobId} />
        </div>
        {userId === null && (
          <p className="text-sm text-[var(--cx-muted)]">
            <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
              Connectez-vous
            </Link>{" "}
            pour envoyer votre candidature.
          </p>
        )}
      </header>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "jobs.author")}</h2>
        <p className="mt-1 text-[var(--cx-muted)]">
          {offre.auteur.nom} · {offre.auteur.ville}, {offre.auteur.pays}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">{t(locale, "jobs.external")}</h2>
        <p className="mt-1 text-[var(--cx-muted)]">
          {t(locale, "jobs.external_desc")}
        </p>
        <a
          href={offre.lien}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 font-medium hover:border-[var(--cx-accent)]"
        >
          {t(locale, "jobs.external_link")}
        </a>
      </section>
    </div>
  );
}
