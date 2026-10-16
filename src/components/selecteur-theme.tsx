"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, appliquerTheme, themeEffectif, type Theme } from "@/lib/theme";
import { Icone, type NomIcone } from "@/components/icones";

const LIBELLES: Record<Theme, string> = {
  light: "Clair",
  dark: "Sombre",
  auto: "Auto",
};

const ICONES: Record<Theme, NomIcone> = {
  light: "soleil",
  dark: "lune",
  auto: "moniteur",
};

/** Sélecteur de thème : clair / sombre / auto (cookie `cx_theme`, 1 an). */
export default function SelecteurTheme({ themeInitial }: { themeInitial: Theme }) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(themeInitial);

  function changer(nouveau: Theme) {
    setTheme(nouveau);
    appliquerTheme(nouveau);
    router.refresh();
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-cx-border p-0.5"
      role="group"
      aria-label="Thème"
    >
      {THEMES.map((valeur) => (
        <button
          key={valeur}
          type="button"
          onClick={() => changer(valeur)}
          aria-pressed={theme === valeur}
          title={`${LIBELLES[valeur]} (${themeEffectif(valeur)})`}
          className={`inline-flex min-h-[28px] cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold transition ${
            theme === valeur ? "bg-cx-primary text-cx-primary-fg" : "text-cx-muted-fg hover:bg-cx-muted"
          }`}
        >
          <Icone nom={ICONES[valeur]} className="size-3.5" />
          {LIBELLES[valeur]}
        </button>
      ))}
    </div>
  );
}
