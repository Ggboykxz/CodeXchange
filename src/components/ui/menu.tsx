"use client";

import { Menu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Enveloppes minces autour de Base UI « Menu ».
 *
 * Base UI apporte ce que l'implémentation maison n'avait pas : navigation aux
 * flèches (ouverture + départ sur le premier item), `role="menu"`/
 * `role="menuitem"` complets, retour du focus sur le déclencheur après Échap ou
 * sélection, fermeture par Tab. Ces enveloppes portent les classes du design
 * system (surface carte, rayon `lg`, échelle Z).
 */

export const MenuRacine = Menu.Root;
export const MenuDeclencheur = Menu.Trigger;

type PanneauProps = {
  children: ReactNode;
  className?: string;
  /** Alignement du panneau par rapport au déclencheur. */
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** Panneau ancré rendu dans un portail — `z-30` (cf. `Z.overlay`). */
export function MenuPanneau({
  children,
  className,
  align = "end",
  sideOffset = 8,
}: PanneauProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={sideOffset} className="z-30 outline-none">
        <Menu.Popup
          className={cn(
            "[transform-origin:var(--transform-origin)] min-w-56 rounded-xl border border-cx-border bg-cx-card p-1.5 shadow-lg outline-none",
            className,
          )}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

const CLASSE_ITEM =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-cx-card-fg outline-none select-none data-highlighted:bg-cx-muted";

/** Item d'action (bouton). */
export function MenuElement({ className, ...props }: Menu.Item.Props) {
  return <Menu.Item className={cn(CLASSE_ITEM, className)} {...props} />;
}

/** Item de navigation (lien) — ferme le menu au clic. */
export function MenuLien({ className, ...props }: Menu.LinkItem.Props) {
  return <Menu.LinkItem className={cn(CLASSE_ITEM, className)} {...props} />;
}

/** Séparateur de sections (bordure fine). */
export function MenuSeparateur({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("my-1 border-t border-cx-border", className)}
    />
  );
}
