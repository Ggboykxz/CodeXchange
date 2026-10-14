"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type EtatNav = {
  /** Ouverture du drawer latéral (mobile / tablette). */
  ouverte: boolean;
  basculer: () => void;
  fermer: () => void;
};

const Ctx = createContext<EtatNav>({ ouverte: false, basculer: () => {}, fermer: () => {} });

/**
 * État global de la navigation latérale façon Reddit : le ☰ du header ouvre le
 * drawer (mobile) et le referme. `Escape` ferme ; le contexte est fourni par un
 * composant client enveloppant le layout (les sous-composants clients y accèdent
 * même s'ils sont rendus dans des sous-arbres serveur).
 */
export function NavProvider({ children }: { children: ReactNode }) {
  const [ouverte, setOuvert] = useState(false);
  const basculer = useCallback(() => setOuvert((o) => !o), []);
  const fermer = useCallback(() => setOuvert(false), []);

  // Échap ferme le drawer ; on ferme aussi au passage en desktop.
  useEffect(() => {
    if (!ouverte) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ouverte]);

  return <Ctx.Provider value={{ ouverte, basculer, fermer }}>{children}</Ctx.Provider>;
}

export function useNav(): EtatNav {
  return useContext(Ctx);
}
