"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Dropdown from "@/components/dropdown";
import { Icone } from "@/components/icones";
import { t, type Locale } from "@/lib/i18n";

type Props = { locale: Locale; suggestions: string[] };

/**
 * Recherche par icône déroulante : champ + suggestions. Compacte (une icône
 * dans la barre) pour ne jamais déborder le header, et ancrée correctement
 * grâce à `Dropdown`.
 */
export default function RechercheDropdown({ locale, suggestions }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const terme = q.trim();
    if (terme) router.push(`/recherche?q=${encodeURIComponent(terme)}`);
  }

  return (
    <Dropdown
      label={t(locale, "nav.search")}
      trigger={<Icone nom="recherche" className="h-5 w-5" />}
      triggerClassName="rounded-lg p-2 text-cx-muted-fg hover:bg-cx-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cx-primary/50"
    >
      <form onSubmit={envoyer} className="flex gap-2 p-1">
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(locale, "nav.search")}
          className="w-full rounded-lg border border-cx-border bg-cx-bg px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
        />
        <button
          type="submit"
          aria-label={t(locale, "nav.search")}
          className="rounded-lg bg-cx-primary px-3 text-cx-primary-fg"
        >
          <Icone nom="recherche" className="h-4 w-4" />
        </button>
      </form>
      {suggestions.length > 0 ? (
        <div className="border-t border-cx-border px-1 pt-1">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-cx-muted-fg">
            Suggestions
          </p>
          {suggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => router.push(`/recherche?q=${encodeURIComponent(s)}`)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-cx-card-fg hover:bg-cx-muted"
            >
              <Icone nom="recherche" className="h-3.5 w-3.5 shrink-0 text-cx-muted-fg" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      ) : null}
    </Dropdown>
  );
}
