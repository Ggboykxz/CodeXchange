"use client";

import Link from "next/link";
import BoutonVote from "@/components/bouton-vote";
import BoutonPartager from "@/components/bouton-partager";
import { Icone } from "@/components/icones";
import Avatar from "@/components/avatar";
import { BadgeVerification } from "@/components/badges-membre";
import LogoTechno, { logoTechno } from "@/components/logo-techno";
import type { PostResume } from "@/lib/forum";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import TempsRelatif from "@/components/temps-relatif";

/** « Nouveau » si le sujet a moins de 48 h. */
function estNouveau(date: Date | string): boolean {
  const cible = typeof date === "string" ? new Date(date) : date;
  return Date.now() - cible.getTime() < 48 * 3_600_000;
}

/** Compteur abrégé façon X : 927 → « 927 », 1 240 → « 1,2 k ». */
function formatNombre(n: number): string {
  if (n < 1000) return String(n);
  const abrevie = (Math.round(n / 100) / 10).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${abrevie} k`;
}

/** Aperçu du corps en texte brut, tronqué (le markdown n'est pas rendu en fil). */
/** Première image du corps : markdown `![alt](url)` ou URL image brute. */
function premiereImage(texte: string): string | null {
  const md = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(texte);
  if (md) return md[1];
  const nue = /(^|[\s])(https?:\/\/[^\s)]+\.(?:png|jpe?g|webp|gif))(?:$|[\s)])/i.exec(texte);
  return nue ? nue[2] : null;
}

function apercu(texte: string, max = 180): string | null {
  const brut = texte
    .replace(/```[\s\S]*?```/g, " [code] ")
    .replace(/[#*>_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (brut.length <= 20) return null;
  return brut.length > max ? `${brut.slice(0, max).trimEnd()}…` : brut;
}

/**
 * Ligne de fil façon X : avatar à gauche, nom · c/communauté · temps relatif,
 * titre en gras, aperçu, chips avec logos puis barre d'actions espacée
 * (répondre · voter · partager). Les lignes sont séparées par un filet, le
 * survol colore la ligne entière — pas de carte fermée.
 */
export default function CarteSujet({
  sujet,
  locale,
  connecte,
  onMasquer,
  actif = false,
  entree = 0,
}: {
  sujet: PostResume;
  locale: Locale;
  connecte: boolean;
  onMasquer?: (id: number) => void;
  /** Sujet mis en évidence par la navigation clavier `j`/`k`. */
  actif?: boolean;
  /** Rang dans le fil : sert au décalage de l'animation d'entrée. */
  entree?: number;
}) {
  const tags = sujet.tags
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const texte = apercu(sujet.corps);
  const media = premiereImage(sujet.corps);

  return (
    <li
      data-fil-item
      data-id={sujet.id}
      data-actif={actif ? "true" : undefined}
      aria-current={actif ? "true" : undefined}
      className={cn(
        "group relative border-b border-cx-border transition-colors duration-150 hover:bg-cx-muted/30 animate-fade-up",
        actif && "bg-cx-muted/40 ring-1 ring-inset ring-cx-primary/40",
      )}
      style={{ animationDelay: `${Math.min(entree, 8) * 35}ms` }}
    >
      <article className="relative flex gap-3 px-1 py-3 sm:px-2">
        <Link
          href={`/membres/${sujet.author.slug}`}
          className="relative z-10 mt-0.5 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cx-primary"
          aria-label={t(locale, "forum.by") + " " + sujet.author.nom}
        >
          <Avatar slug={sujet.author.slug} nom={sujet.author.nom} avatar={sujet.author.avatar ?? undefined} taille="md" />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Ligne d'en-tête façon X : nom @handle · temps · Badge. */}
          <p className="relative z-10 flex flex-wrap items-center gap-x-1.5 text-sm leading-5">
            <Link
              href={`/membres/${sujet.author.slug}`}
              className="min-w-0 max-w-[14rem] truncate font-bold text-cx-fg hover:underline sm:max-w-[18rem]"
            >
              {sujet.author.nom}
            </Link>
            {sujet.author.verified ? <BadgeVerification /> : null}
            <span className="min-w-0 max-w-[11rem] truncate text-xs text-cx-muted-fg">@{sujet.author.slug}</span>
            <span aria-hidden className="text-xs text-cx-muted-fg">
              ·
            </span>
            <span className="text-xs text-cx-muted-fg">
              <TempsRelatif date={sujet.createdAt} />
            </span>
            {estNouveau(sujet.createdAt) ? (
              <span className="rounded-md bg-cx-accent/10 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-cx-accent-fort">
                {t(locale, "sujet.nouveau")}
              </span>
            ) : null}
            {onMasquer ? (
              <button
                type="button"
                onClick={() => onMasquer(sujet.id)}
                aria-label="Masquer ce sujet"
                title="Masquer ce sujet"
                className="ml-auto inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full text-cx-muted-fg transition hover:bg-cx-muted hover:text-cx-fg"
              >
                <Icone nom="masquer" className="size-4" />
              </button>
            ) : null}
          </p>

          {/* Titre : le lien s'étire sur toute la rangée (rangée cliquable
              façon X) ; les contrôles interactifs passent au-dessus (z-10). */}
          <h2 className="mt-0.5 max-w-[62ch] text-[15px] font-bold leading-5 text-cx-fg">
            <Link href={`/forum/${sujet.id}`} data-lien-principal className="block after:absolute after:inset-0">
              {sujet.titre}
            </Link>
          </h2>

          {texte ? <p className="mt-0.5 max-w-[62ch] line-clamp-2 text-sm leading-5 text-cx-muted-fg">{texte}</p> : null}

          {media ? (
            <div className="relative mt-2 overflow-hidden rounded-2xl border border-cx-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media} alt="" loading="lazy" className="max-h-72 w-full object-cover" />
            </div>
          ) : null}

          {tags.length > 0 ? (
            <ul className="relative z-10 mt-2 flex flex-wrap gap-1.5">
              {tags.map((mot) => (
                <li key={mot}>
                  <Link
                    href={`/forum?tag=${encodeURIComponent(mot)}`}
                    className="rounded-full bg-cx-primary/5 px-2 py-0.5 text-xs font-semibold text-cx-primary hover:bg-cx-primary/20"
                  >
                    {logoTechno(mot) && <LogoTechno nom={mot} className="mr-1 inline-block size-3" />}
                    {mot}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Barre d'actions façon X : répondre · voter · partager, espacée. */}
          <div className="relative z-10 mt-2.5 flex max-w-[26rem] items-center justify-between gap-2">
            <Link
              href={`/forum/${sujet.id}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-primary/10 hover:text-cx-primary"
            >
              <Icone nom="forum" className="size-4" />
              <span className="tabular-nums">{formatNombre(sujet._count.replies)}</span>{" "}
              {sujet._count.replies === 1 ? t(locale, "forum.comment_one") : t(locale, "forum.comments_short")}
            </Link>
            <BoutonVote
              postId={sujet.id}
              initialVote={sujet.userVote}
              initialScore={sujet.score}
              connecte={connecte}
              variante="action"
            />
            <BoutonPartager path={`/forum/${sujet.id}`} libelle={t(locale, "forum.share")} />
          </div>
        </div>
      </article>
    </li>
  );
}

/** Nombre formaté exportable (tests, autres fils). */
export { formatNombre };

/* Alias utilitaire : le badge « Nouveau » se teinte via --cx-accent-fort
 * (contraste ≥ 4,5:1 sur fond accent/10) — voir globals.css. */
export function BadgeNouveau({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-md bg-cx-accent/10 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-cx-accent-fort", className)}>
      Nouveau
    </span>
  );
}
