"use client";

import { useRouter } from "next/navigation";

type Props = {
  /** Chemin courant (sans query string). */
  basePath: string;
  /** Paramètres à conserver (q, tag, page…). */
  params: Record<string, string | undefined>;
  /** Valeurs possibles : clé technique → clé i18n du libellé. */
  options: Array<{ valeur: string; cle: string }>;
  actuelle: string;
  libelles: Record<string, string>;
};

/** Sélecteur de tri persistant en query string (GET, partageable). */
export default function SelecteurTri({
  basePath,
  params,
  options,
  actuelle,
  libelles,
}: Props) {
  const router = useRouter();

  function changer(valeur: string) {
    const recherche = new URLSearchParams();
    for (const [cle, val] of Object.entries(params)) {
      if (val) recherche.set(cle, val);
    }
    recherche.set("tri", valeur);
    router.push(`${basePath}?${recherche.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-cx-muted-fg">
      <span className="hidden sm:inline">{libelles.tri ?? "Trier"}</span>
      <select
        value={actuelle}
        onChange={(e) => changer(e.target.value)}
        className="rounded-lg border border-cx-border-fort bg-cx-card px-2 py-1.5 text-sm font-medium text-cx-fg outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30"
      >
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {libelles[option.cle] ?? option.valeur}
          </option>
        ))}
      </select>
    </label>
  );
}
