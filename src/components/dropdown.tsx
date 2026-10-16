"use client";

import type { ReactNode } from "react";
import { MenuDeclencheur, MenuPanneau, MenuRacine } from "@/components/ui/menu";

type Props = {
  /** Contenu du bouton déclencheur (icône, avatar, libellé…). */
  trigger: ReactNode;
  /** Contenu du panneau déroulant (items, groupes…). */
  children: ReactNode;
  /** Libellé d'accessibilité du bouton. */
  label: string;
  /** Alignement du panneau par rapport au bouton. */
  align?: "right" | "left";
  /** Classes additionnelles du bouton déclencheur. */
  triggerClassName?: string;
};

/**
 * Menu déroulant du header, désormais porté par **Base UI** (enveloppe
 * `src/components/ui/menu.tsx`). La signature ne change pas.
 *
 * Comportements apportés par Base UI : `role="menu"`/`role="menuitem"`,
 * ouverture et navigation au clavier (flèches, Début/Fin), retour du focus sur
 * le déclencheur après Échap ou après une action, fermeture par Tab, ancrage
 * recalculé par la librairie de positionnement (plus de `z` maison à gérer :
 * le portail porte `z-30`, cf. `Z.overlay`).
 */
export default function Dropdown({
  trigger,
  children,
  label,
  align = "right",
  triggerClassName = "",
}: Props) {
  return (
    <MenuRacine>
      <MenuDeclencheur aria-label={label} className={triggerClassName}>
        {trigger}
      </MenuDeclencheur>
      <MenuPanneau align={align === "right" ? "end" : "start"}>{children}</MenuPanneau>
    </MenuRacine>
  );
}
