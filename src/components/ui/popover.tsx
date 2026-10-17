"use client";

import { Popover } from "@base-ui/react/popover";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/cn";

/**
 * Enveloppes minces autour de Base UI « Popover » : surface non modale pour
 * du contenu **interactif libre** (formulaire, champ de recherche) qui n'a pas
 * la sémantique d'un menu. Base UI gère l'ancrage, la fermeture (Échap, clic
 * extérieur) et le retour du focus sur le déclencheur.
 */

export const PopoverRacine = Popover.Root;
export const PopoverDeclencheur = Popover.Trigger;

type PanneauProps = {
  children: ReactNode;
  className?: string;
  /** Alignement du panneau par rapport au déclencheur. */
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Élément qui reçoit le focus à l'ouverture (ex. le champ de recherche). */
  focusInitial?: RefObject<HTMLElement | null>;
};

/** Panneau ancré rendu dans un portail — `z-30` (cf. `Z.overlay`). */
export function PopoverPanneau({
  children,
  className,
  align = "end",
  sideOffset = 8,
  focusInitial,
}: PanneauProps) {
  return (
    <Popover.Portal>
      <Popover.Positioner align={align} sideOffset={sideOffset} className="z-30 outline-none">
        <Popover.Popup
          initialFocus={focusInitial}
          className={cn(
            "[transform-origin:var(--transform-origin)] min-w-56 rounded-xl border border-cx-border bg-cx-card p-1.5 shadow-lg outline-none",
            className,
          )}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}
