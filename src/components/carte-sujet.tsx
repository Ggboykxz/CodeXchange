import Link from "next/link";
import BoutonVote from "@/components/bouton-vote";
import BoutonPartager from "@/components/bouton-partager";
import { Icone } from "@/components/icones";
import Avatar from "@/components/avatar";
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
}: {
  sujet: PostResume;
  locale: Locale;
  connecte: boolean;
}) {
  const tags = sujet.tags
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const communaute = tags[0] ?? "codexchange";
  const texte = apercu(sujet.corps);

  return (
    <li className="group border-b border-cx-border transition-colors duration-150 hover:bg-cx-muted/30">
      <article className="flex gap-3 px-1 py-3 sm:px-2">
        <Link
          href={`/membres/${sujet.author.slug}`}
          className="mt-0.5 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cx-primary"
          aria-label={t(locale, "forum.by") + " " + sujet.author.nom}
        >
          <Avatar slug={sujet.author.slug} nom={sujet.author.nom} avatar={sujet.author.avatar ?? undefined} taille="md" />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Ligne d'en-tête façon X : nom · c/communauté · temps · Badge. */}
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm leading-5">
            <Link
              href={`/membres/${sujet.author.slug}`}
              className="min-w-0 max-w-[14rem] truncate font-bold text-cx-fg hover:underline sm:max-w-[18rem]"
            >
              {sujet.author.nom}
            </Link>
            <span aria-hidden className="text-cx-muted-fg">
              ·
            </span>
            <Link
              href={`/forum?tag=${encodeURIComponent(communaute)}`}
              className="min-w-0 max-w-[11rem] truncate text-xs font-medium text-cx-muted-fg hover:underline"
            >
              c/{communaute}
            </Link>
            <span aria-hidden className="text-xs text-cx-muted-fg">
              ·
            </span>
            <span className="text-xs text-cx-muted-fg">
              <TempsRelatif date={sujet.createdAt} />
            </span>
            {estNouveau(sujet.createdAt) ? (
              <span className="rounded-md bg-cx-accent/10 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-cx-accent-fort">
                Nouveau
              </span>
            ) : null}
          </p>

          <h2 className="mt-0.5 max-w-[62ch] text-[15px] font-bold leading-5 text-cx-fg">
            <Link href={`/forum/${sujet.id}`} className="hover:underline">
              {sujet.titre}
            </Link>
          </h2>

          {texte ? <p className="mt-0.5 max-w-[62ch] line-clamp-2 text-sm leading-5 text-cx-muted-fg">{texte}</p> : null}

          {tags.length > 1 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(1).map((mot) => (
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
          <div className="mt-2.5 flex max-w-[26rem] items-center justify-between gap-2">
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
            <BoutonPartager path={`/forum/${sujet.id}`} />
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
