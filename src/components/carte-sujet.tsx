import Link from "next/link";
import BoutonVote from "@/components/bouton-vote";
import BoutonPartager from "@/components/bouton-partager";
import { Icone } from "@/components/icones";
import LogoTechno, { logoTechno } from "@/components/logo-techno";
import type { PostResume } from "@/lib/forum";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import TempsRelatif from "@/components/temps-relatif";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** « Nouveau » si le sujet a moins de 48 h. */
function estNouveau(date: Date | string): boolean {
  const cible = typeof date === "string" ? new Date(date) : date;
  return Date.now() - cible.getTime() < 48 * 3_600_000;
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
 * Carte de sujet façon Reddit : gouttière de vote à gauche (▲ score ▼),
 * ligne communauté · auteur · date, titre cliquable, aperçu, flairs et barre
 * d'action (Commenter · Partager).
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
    <li className="group flex overflow-hidden rounded-lg border border-cx-border bg-cx-card transition hover:border-cx-primary/50">
      {/* Gouttière de vote. */}
      <div className="flex w-10 shrink-0 flex-col items-center bg-cx-muted/50 py-2.5 transition group-hover:bg-cx-muted">
        <BoutonVote
          postId={sujet.id}
          initialVote={sujet.userVote}
          initialScore={sujet.score}
          connecte={connecte}
          variante="gouttiere"
        />
      </div>

      {/* Contenu. */}
      <div className="min-w-0 flex-1 px-3.5 py-2.5">
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-cx-muted-fg">
          <Link
            href={`/forum?tag=${encodeURIComponent(communaute)}`}
            className="font-bold text-cx-fg hover:underline"
          >
            c/{communaute}
          </Link>
          <span aria-hidden>·</span>
          <span>
            {t(locale, "forum.by")} {sujet.author.nom}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <TempsRelatif date={sujet.createdAt} />
            {estNouveau(sujet.createdAt) ? (
              <span className="rounded-full bg-cx-accent/10 px-1.5 py-px text-[10px] font-bold text-cx-accent">Nouveau</span>
            ) : null}
          </span>
        </p>

        <h2 className="mt-1 text-base font-semibold leading-snug">
          <Link href={`/forum/${sujet.id}`} className="hover:text-cx-primary hover:underline">
            {sujet.titre}
          </Link>
        </h2>

        {texte ? <p className="mt-1 line-clamp-2 text-sm text-cx-muted-fg">{texte}</p> : null}

        {tags.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
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

        {/* Barre d'action. */}
        <div className="mt-2 flex items-center gap-1">
          <Link
            href={`/forum/${sujet.id}`}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-cx-muted-fg transition hover:bg-cx-muted hover:text-cx-fg"
          >
            <Icone nom="forum" className="size-4" />
            <span className="tabular-nums">{sujet._count.replies}</span> {t(locale, "forum.comments_short")}
          </Link>
          <BoutonPartager path={`/forum/${sujet.id}`} />
        </div>
      </div>
    </li>
  );
}
