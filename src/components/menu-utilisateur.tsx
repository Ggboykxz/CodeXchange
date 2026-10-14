"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/avatar";
import Dropdown from "@/components/dropdown";
import { Icone } from "@/components/icones";
import { t, type Locale } from "@/lib/i18n";

type Membre = { nom: string; slug: string; avatar?: string | null };

type Props = {
  locale: Locale;
  nonLues: number;
  nonLusMessages: number;
  estAdmin: boolean;
  membre: Membre;
};

/** Ligne de menu commune (lien + icône). */
function Item({
  href,
  icone,
  libelle,
  badge,
  accent,
}: {
  href: string;
  icone: Parameters<typeof Icone>[0]["nom"];
  libelle: string;
  badge?: number;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-cx-muted ${
        accent ? "font-semibold text-cx-primary" : "text-cx-card-fg"
      }`}
    >
      <Icone nom={icone} className="h-4 w-4 shrink-0 text-cx-muted-fg" />
      <span className="flex-1">{libelle}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cx-primary px-1 text-[11px] font-bold text-cx-primary-fg">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Menu du compte (avatar déroulant) : profil, activité, favoris, notifs… */
export default function MenuUtilisateur({ locale, nonLues, nonLusMessages, estAdmin, membre }: Props) {
  const router = useRouter();

  async function deconnecter() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Dropdown
      label={t(locale, "profile.title")}
      trigger={
        <span className="flex items-center gap-1">
          <Avatar slug={membre.slug} nom={membre.nom} avatar={membre.avatar ?? undefined} />
          <Icone nom="chevron" className="h-3.5 w-3.5 text-cx-muted-fg" />
        </span>
      }
      triggerClassName="flex items-center rounded-full ring-cx-primary/40 hover:ring-2 focus-visible:outline-none focus-visible:ring-2"
    >
      <div className="border-b border-cx-border px-3 py-2">
        <p className="truncate text-sm font-semibold text-cx-card-fg">{membre.nom}</p>
        <p className="truncate text-xs text-cx-muted-fg">@{membre.slug}</p>
      </div>
      <div className="py-1">
        <Item href="/profil" icone="profil" libelle={t(locale, "profile.title")} accent />
        <Item href="/mon-espace" icone="espace" libelle={t(locale, "activity.title")} />
        <Item href="/favoris" icone="favoris" libelle={t(locale, "nav.favorites")} />
        <Item href="/notifications" icone="notifications" libelle={t(locale, "nav.notifications")} badge={nonLues} />
        <Item href="/messagerie" icone="messagerie" libelle={t(locale, "nav.messages")} badge={nonLusMessages} />
        <Item href="/parametres" icone="parametres" libelle={t(locale, "settings.title")} />
        {estAdmin ? <Item href="/admin" icone="admin" libelle={t(locale, "nav.admin")} /> : null}
      </div>
      <div className="border-t border-cx-border pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={deconnecter}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-cx-destructive hover:bg-cx-destructive/5"
        >
          <Icone nom="deconnexion" className="h-4 w-4 shrink-0" />
          {t(locale, "nav.logout")}
        </button>
      </div>
    </Dropdown>
  );
}
