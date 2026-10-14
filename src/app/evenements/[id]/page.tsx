import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { drapeau } from "@/lib/drapeaux";
import { aRsvp, getEvent } from "@/lib/events";
import { parseId } from "@/lib/forum";
import { isFavorite } from "@/lib/favorites";
import { localeCourante, t } from "@/lib/i18n";
import { getSessionUserId } from "@/lib/session";
import BoutonRsvp from "./bouton-rsvp";
import BoutonFavori from "@/components/bouton-favori";
import FilAriane from "@/components/fil-ariane";

type Props = { params: Promise<{ id: string }> };

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

async function lireEvenement(id: string) {
  const eventId = parseId(id);
  if (eventId === null) return null;
  return getEvent(eventId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const evenement = await lireEvenement(id);
  return { title: evenement ? evenement.titre : "Événement introuvable" };
}

/** /evenements/[id] — détail d'un événement : date, lieu, RSVP. */
export default async function PageEvenement({ params }: Props) {
  const { id } = await params;
  const eventId = parseId(id);
  if (eventId === null) notFound();
  const evenement = await getEvent(eventId);
  if (!evenement) notFound();

  const [userId, locale] = await Promise.all([getSessionUserId(), localeCourante()]);
  const dejaConfirme = userId === null ? false : await aRsvp(userId, eventId);
  const favoriDeLevenement = userId === null ? false : await isFavorite(userId, "event", eventId);
  const maintenant = new Date();
  const passe = evenement.date.getTime() <= maintenant.getTime();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/evenements" className="text-sm text-[var(--cx-accent)]">
        <FilAriane
          items={[
            { label: t(locale, "nav.home"), href: "/" },
            { label: t(locale, "nav.events"), href: "/evenements" },
            { label: evenement.titre },
          ]}
        />
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          {evenement.titre}
        </h1>
        <p className="text-sm text-[var(--cx-muted)]">
          <time dateTime={evenement.date.toISOString()}>
            {DATE.format(evenement.date)} à {HEURE.format(evenement.date)}
          </time>
        </p>
        <ul className="flex flex-wrap items-center gap-2">
          <li>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                passe
                  ? "border border-[var(--cx-muted)]/40 text-[var(--cx-muted)]"
                  : "bg-cx-success/10 text-cx-success"
              }`}
            >
              {passe ? t(locale, "events.past") : t(locale, "events.upcoming")}
            </span>
          </li>
          <li>
            <span className="rounded-full bg-[var(--cx-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--cx-accent)]">
              {evenement.format}
            </span>
          </li>
          <li className="text-xs text-[var(--cx-muted)]">
            {evenement.format === "En ligne"
              ? "En ligne"
              : [drapeau(evenement.pays), [evenement.ville, evenement.pays].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" ")}
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <BoutonRsvp
            eventId={eventId}
            connecte={userId !== null}
            dejaConfirme={dejaConfirme}
            compteur={evenement._count.rsvps}
          />
          <BoutonFavori kind="event" targetId={eventId} initial={favoriDeLevenement} connecte={userId !== null} />
        </div>
        {userId === null && (
          <p className="text-sm text-[var(--cx-muted)]">
            <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
              Connectez-vous
            </Link>{" "}
            pour confirmer votre présence.
          </p>
        )}
      </header>

      <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
        <h2 className="font-semibold">À propos de l&apos;événement</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--cx-muted)]">
          {evenement.description}
        </p>
      </section>

      {evenement.format === "En ligne" && evenement.lien && (
        <section className="rounded-xl border border-[var(--cx-muted)]/25 px-5 py-5 text-sm">
          <h2 className="font-semibold">Rejoindre en ligne</h2>
          <p className="mt-1 text-[var(--cx-muted)]">
            L&apos;événement se déroule à distance : ce lien s&apos;ouvre dans un nouvel onglet.
          </p>
          <a
            href={evenement.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg border border-[var(--cx-muted)]/40 px-4 py-2.5 font-medium hover:border-[var(--cx-accent)]"
          >
            Ouvrir le lien de l&apos;événement ↗
          </a>
        </section>
      )}
    </div>
  );
}
