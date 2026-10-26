"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/avatar";
import LogoTechno from "@/components/logo-techno";
import { useToast } from "@/components/toast";
import { drapeau } from "@/lib/drapeaux";
import { t, type Locale } from "@/lib/i18n";

/**
 * Fils à défilement infini des listes hors forum (jobs, projets, annuaire,
 * événements) : la page 1 est servie par le serveur, les suivantes arrivent en
 * JSON (routes /api/…/liste) via IntersectionObserver, avec un bouton « Charger
 * plus » en secours. Mêmes garde-fous que le forum : stop-auto après une
 * erreur, toast émis une seule fois, aucun état collant.
 */

type Params = Record<string, string | undefined>;

/** Chargeur générique — un seul pattern pour les quatre listes. */
function useFlux<T>({
  href,
  params,
  initialItems,
  totalPages,
  currentPage,
  messageErreur,
}: {
  href: string;
  params: Params;
  initialItems: T[];
  totalPages: number;
  currentPage: number;
  messageErreur: string;
}) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [pageSuivante, setPageSuivante] = useState(currentPage + 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [enErreur, setEnErreur] = useState(false);
  const sentinelleRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const charger = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set("page", String(pageSuivante));
      for (const [cle, valeur] of Object.entries(params)) {
        if (valeur !== undefined && valeur !== "") url.searchParams.set(cle, valeur);
      }
      const reponse = await fetch(url.toString(), { cache: "no-store" });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const donnees = (await reponse.json()) as { items: T[]; page: number; totalPages: number };
      setItems((prev) => [...prev, ...donnees.items]);
      setPageSuivante(donnees.page + 1);
      setHasMore(donnees.page < donnees.totalPages);
      setEnErreur(false);
    } catch {
      if (!enErreur) toast.erreur(messageErreur);
      setEnErreur(true);
    } finally {
      setIsLoading(false);
    }
  }, [href, params, hasMore, isLoading, pageSuivante, enErreur, toast, messageErreur]);

  // Auto-chargement au défilement, suspendu après un échec (reprise manuelle).
  useEffect(() => {
    if (enErreur || !sentinelleRef.current) return;
    const observer = new IntersectionObserver(
      (entrees) => {
        if (entrees[0].isIntersecting && !isLoading && hasMore) void charger();
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinelleRef.current);
    return () => observer.disconnect();
  }, [charger, isLoading, hasMore, enErreur]);

  return { items, enErreur, isLoading, hasMore, sentinelleRef, charger };
}

/** Fin commune du fil : sentinelle + bouton manuel + message d'erreur. */
function QueueDeFlux({
  enErreur,
  isLoading,
  hasMore,
  sentinelleRef,
  charger,
  locale,
}: {
  enErreur: boolean;
  isLoading: boolean;
  hasMore: boolean;
  sentinelleRef: React.RefObject<HTMLDivElement | null>;
  charger: () => Promise<void>;
  locale: Locale;
}) {
  return (
    <>
      {hasMore && !enErreur && !isLoading ? (
        <div ref={sentinelleRef} className="h-6 w-full" aria-hidden="true" />
      ) : null}
      {hasMore ? (
        <div className="py-6 text-center">
          <button
            type="button"
            onClick={() => void charger()}
            disabled={isLoading}
            aria-live="polite"
            className="rounded-full border border-cx-border px-4 py-2 text-sm font-medium text-cx-primary transition hover:bg-cx-muted/50 active:scale-[0.97]"
          >
            {isLoading ? t(locale, "common.loading") : t(locale, "feed.load_more")}
          </button>
        </div>
      ) : null}
      {enErreur ? (
        <p role="status" className="pb-4 text-center text-sm text-cx-destructive">
          {t(locale, "feed.erreur")}
        </p>
      ) : null}
      {!hasMore && !enErreur ? (
        <p role="status" className="py-6 text-center text-sm font-medium text-cx-muted-fg">
          {t(locale, "feed.up_to_date")}
        </p>
      ) : null}
    </>
  );
}

/* ─────────────────────────── Rangées (cards) ─────────────────────────── */

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const DATE_LONG = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

type JobLigne = {
  id: number;
  titre: string;
  entreprise: string;
  contrat: string;
  remote: boolean;
  pays: string;
  ville?: string | null;
  createdAt: Date | string;
};

/** Rangée d'offre d'emploi (identique à la page 1 historique). */
function RangJob({ offre, locale }: { offre: JobLigne; locale: Locale }) {
  return (
    <li className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60 hover:shadow-md">
      <Link href={`/jobs/${offre.id}`} className="block">
        <h2 className="text-lg font-semibold leading-snug hover:text-cx-primary">{offre.titre}</h2>
      </Link>
      <p className="mt-1 text-xs tabular-nums text-cx-muted-fg">
        {offre.entreprise} ·{" "}
        {offre.remote && offre.ville
          ? `${offre.ville}, ${offre.pays} · remote possible`
          : offre.ville
            ? `${offre.ville}, ${offre.pays}`
            : offre.pays}{" "}
        · {DATE.format(new Date(offre.createdAt))}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        <li>
          <span className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary">
            {offre.contrat}
          </span>
        </li>
        <li>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              offre.remote ? "bg-cx-success/5 text-cx-success" : "border border-cx-border text-cx-muted-fg"
            }`}
          >
            {offre.remote ? t(locale, "jobs.remote") : t(locale, "jobs.onsite")}
          </span>
        </li>
      </ul>
    </li>
  );
}

type ProjetLigne = {
  id: number;
  titre: string;
  description: string;
  createdAt: Date | string;
  author: { nom: string; ville?: string | null; pays?: string | null };
  stack: string[];
  cherche: string[];
  _count: { membres: number };
};

function BadgeStack({ technologie }: { technologie: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary">
      <LogoTechno nom={technologie} className="size-3.5" />
      {technologie}
    </span>
  );
}

/** Rangée de projet. */
function RangProjet({ projet, locale }: { projet: ProjetLigne; locale: Locale }) {
  return (
    <li className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60 hover:shadow-md">
      <Link href={`/projets/${projet.id}`} className="block">
        <h2 className="text-lg font-semibold leading-snug hover:text-cx-primary">{projet.titre}</h2>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm text-cx-muted-fg">{projet.description}</p>
      <p className="mt-2 text-xs text-cx-muted-fg">
        {projet.author.nom} · {projet.author.ville}, {projet.author.pays} ·{" "}
        {DATE.format(new Date(projet.createdAt))} ·{" "}
        {projet._count.membres}{" "}
        {projet._count.membres > 1 ? t(locale, "projects.members_many") : t(locale, "projects.members_one")}
      </p>
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {projet.stack.map((technologie) => (
          <li key={technologie}>
            <BadgeStack technologie={technologie} />
          </li>
        ))}
        {projet.cherche.length > 0 && (
          <li className="text-xs font-medium text-cx-muted-fg">
            {t(locale, "projects.search")}&nbsp;: {projet.cherche.join(", ")}
          </li>
        )}
      </ul>
    </li>
  );
}

type MembreLigne = {
  id: number;
  slug: string;
  nom: string;
  titre?: string | null;
  ville?: string | null;
  pays?: string | null;
  role?: string;
  avatar?: string | null;
  stack: string[];
};

/** Carte de membre (grille de l'annuaire). */
function RangMembre({ membre }: { membre: MembreLigne }) {
  const visibles = membre.stack.slice(0, 3);
  const restantes = membre.stack.length - visibles.length;
  return (
    <li className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60 hover:shadow-md">
      <Link href={`/membres/${membre.slug}`} className="flex items-start gap-4">
        <Avatar slug={membre.slug} nom={membre.nom} avatar={membre.avatar || undefined} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold leading-snug hover:text-cx-primary">{membre.nom}</h2>
          <p className="truncate text-sm text-cx-muted-fg">{membre.titre}</p>
          <p className="mt-1 text-xs text-cx-muted-fg">
            {drapeau(membre.pays ?? "")} {membre.ville}, {membre.pays}
          </p>
          <ul className="mt-3 flex flex-wrap items-center gap-2">
            {visibles.map((technologie) => (
              <li key={technologie}>
                <BadgeStack technologie={technologie} />
              </li>
            ))}
            {restantes > 0 && <li className="text-xs tabular-nums text-cx-muted-fg">+{restantes}</li>}
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

type EvenementLigne = {
  id: number;
  titre: string;
  date: Date | string;
  format: string;
  lien?: string | null;
  ville?: string | null;
  pays?: string | null;
  _count: { rsvps: number };
};

/** Lieu : présentiel = ville avec drapeau, en ligne = lien « rejoindre ». */
function LieuEvenement({ evenement }: { evenement: EvenementLigne }) {
  if (evenement.format === "En ligne" || evenement.format === "Online") {
    return (
      <>
        En ligne
        {evenement.lien ? (
          <>
            {" · "}
            <a
              href={evenement.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cx-primary underline-offset-4 hover:underline"
            >
              Rejoindre le live ↗
            </a>
          </>
        ) : null}
      </>
    );
  }
  if (evenement.ville || evenement.pays) {
    return (
      <>
        {drapeau(evenement.pays ?? "")} {[evenement.ville, evenement.pays].filter(Boolean).join(", ")}
      </>
    );
  }
  return "Lieu à confirmer";
}

/** Rangée d'événement. */
function RangEvenement({
  evenement,
  locale,
  maintenant,
}: {
  evenement: EvenementLigne;
  locale: Locale;
  maintenant: number;
}) {
  const date = new Date(evenement.date);
  const passe = date.getTime() <= maintenant;
  return (
    <li className="rounded-xl border border-cx-border px-5 py-4 transition hover:border-cx-primary/60 hover:shadow-md">
      <Link href={`/evenements/${evenement.id}`} className="block">
        <h2 className="text-lg font-semibold leading-snug hover:text-cx-primary">{evenement.titre}</h2>
      </Link>
      <p className="mt-1 text-xs text-cx-muted-fg">
        <time dateTime={date.toISOString()} suppressHydrationWarning>
          {DATE_LONG.format(date)} · {HEURE.format(date)}
        </time>{" "}
        · <LieuEvenement evenement={evenement} />
      </p>
      <ul className="mt-3 flex flex-wrap items-center gap-2">
        <li>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              passe ? "border border-cx-border text-cx-muted-fg" : "bg-cx-success/5 text-cx-success"
            }`}
          >
            {passe ? t(locale, "events.past") : t(locale, "events.upcoming")}
          </span>
        </li>
        <li>
          <span className="rounded-full bg-cx-primary/5 px-2.5 py-0.5 text-xs font-semibold text-cx-primary">
            {evenement.format}
          </span>
        </li>
        <li>
          <span className="text-xs tabular-nums text-cx-muted-fg">
            {evenement._count.rsvps} {evenement._count.rsvps > 1 ? "participants" : "participant"}
          </span>
        </li>
      </ul>
    </li>
  );
}

/* ─────────────────────────── Fils exportés ─────────────────────────── */

type PropsDePage<T> = {
  initialItems: T[];
  totalPages: number;
  currentPage: number;
  locale: Locale;
  params?: Params;
};

/** /jobs — offres avec défilement infini. */
export function JobsFeed({ initialItems, totalPages, currentPage, locale, params = {} }: PropsDePage<JobLigne>) {
  const flux = useFlux<JobLigne>({
    href: "/api/jobs/liste",
    params,
    initialItems,
    totalPages,
    currentPage,
    messageErreur: t(locale, "feed.erreur"),
  });
  return (
    <>
      <ul className="flex flex-col gap-3">
        {flux.items.map((offre) => (
          <RangJob key={offre.id} offre={offre} locale={locale} />
        ))}
      </ul>
      <QueueDeFlux {...flux} locale={locale} />
    </>
  );
}

/** /projets — projets avec défilement infini. */
export function ProjetsFeed({ initialItems, totalPages, currentPage, locale, params = {} }: PropsDePage<ProjetLigne>) {
  const flux = useFlux<ProjetLigne>({
    href: "/api/projects/liste",
    params,
    initialItems,
    totalPages,
    currentPage,
    messageErreur: t(locale, "feed.erreur"),
  });
  return (
    <>
      <ul className="flex flex-col gap-3">
        {flux.items.map((projet) => (
          <RangProjet key={projet.id} projet={projet} locale={locale} />
        ))}
      </ul>
      <QueueDeFlux {...flux} locale={locale} />
    </>
  );
}

/** /annuaire — grille de membres avec défilement infini. */
export function AnnuaireFeed({ initialItems, totalPages, currentPage, locale, params = {} }: PropsDePage<MembreLigne>) {
  const flux = useFlux<MembreLigne>({
    href: "/api/members/liste",
    params,
    initialItems,
    totalPages,
    currentPage,
    messageErreur: t(locale, "feed.erreur"),
  });
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flux.items.map((membre) => (
          <RangMembre key={membre.id} membre={membre} />
        ))}
      </ul>
      <QueueDeFlux {...flux} locale={locale} />
    </>
  );
}

/** /evenements — chronologie avec défilement infini. */
export function EvenementsFeed({
  initialItems,
  totalPages,
  currentPage,
  locale,
  maintenant,
}: PropsDePage<EvenementLigne> & { maintenant: number }) {
  const flux = useFlux<EvenementLigne>({
    href: "/api/events/liste",
    params: {},
    initialItems,
    totalPages,
    currentPage,
    messageErreur: t(locale, "feed.erreur"),
  });
  return (
    <>
      <ul className="flex flex-col gap-3">
        {flux.items.map((evenement) => (
          <RangEvenement key={evenement.id} evenement={evenement} locale={locale} maintenant={maintenant} />
        ))}
      </ul>
      <QueueDeFlux {...flux} locale={locale} />
    </>
  );
}
