import Link from "next/link";
import Avatar from "@/components/avatar";
import { Icone } from "@/components/icones";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  connecte: boolean;
  me?: { nom: string; slug: string; avatar?: string } | null;
};

/**
 * Boîte de composition omniprésente façon X : avatar + faux champ
 * « Quoi de neuf ? » + bouton Poster. Posée au-dessus des onglets du fil —
 * poster est toujours à un clic, sans chercher le CTA.
 */
export default function Composeur({ locale, connecte, me }: Props) {
  const cible = connecte ? "/forum/nouveau" : "/connexion";

  return (
    <div className="rounded-2xl border border-cx-border bg-cx-card/60">
      <Link href={cible} className="flex items-center gap-3 px-3.5 py-3">
        {connecte && me ? (
          <Avatar slug={me.slug} nom={me.nom} avatar={me.avatar} taille="md" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cx-muted text-cx-muted-fg">
            <Icone nom="forum" className="size-5" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-cx-muted-fg">
          {connecte ? t(locale, "forum.composer_placeholder") : t(locale, "forum.composer_connexion")}
        </span>
      </Link>
      <div className="flex justify-end px-3.5 pb-3">
        <Link
          href={cible}
          className="rounded-full bg-cx-primary px-4 py-1.5 text-sm font-bold text-cx-primary-fg transition hover:opacity-90 active:scale-[0.97]"
        >
          {t(locale, "forum.poster")}
        </Link>
      </div>
    </div>
  );
}
