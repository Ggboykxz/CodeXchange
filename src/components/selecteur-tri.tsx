"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

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

/** Onglets de tri façon X (« Pour toi / Suivis ») : soulignement bleu animé,
 * cibles 44px, état conservé en query string (partageable, bookmarkable).
 * Le tri par défaut (`hot`) n'ajoute aucun paramètre d'URL. */
export default function SelecteurTri({
  basePath,
  params,
  options,
  actuelle,
  libelles,
}: Props) {
  const router = useRouter();

  function changer(valeur: string) {
    if (valeur === actuelle) return;
    const recherche = new URLSearchParams();
    for (const [cle, val] of Object.entries(params)) {
      if (val) recherche.set(cle, val);
    }
    if (valeur !== "hot") recherche.set("tri", valeur);
    else recherche.delete("tri");
    const cible = recherche.toString();
    router.push(`${basePath}${cible ? `?${cible}` : ""}`);
  }

  return (
    <nav
      aria-label={libelles.tri ?? "Trier"}
      role="tablist"
      className="flex items-stretch gap-1 border-b border-cx-border"
    >
      {options.map((option) => {
        const actif = option.valeur === actuelle;
        return (
          <button
            key={option.valeur}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => changer(option.valeur)}
            className={cn(
              "relative flex min-h-[44px] cursor-pointer items-center px-4 text-[15px] transition-colors duration-150",
              actif ? "font-bold text-cx-fg" : "font-medium text-cx-muted-fg hover:bg-cx-muted/60 hover:text-cx-fg",
            )}
          >
            {libelles[option.cle] ?? option.valeur}
            {/* Soulignement actif façon X : pilule animée en scaleX (transform only). */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-0 left-0 h-[3px] origin-left rounded-full bg-cx-primary transition-transform duration-150",
                "w-full",
                actif ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
