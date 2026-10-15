import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Trois variantes seulement (un accent par vue). Les anciens noms restent des
// alias pour ne casser aucun appel : `secondary`/`accent` → principal,
// `muted` → neutre, `ghost` → neutre bordé.
const variants = {
  primary: "bg-cx-primary text-cx-primary-fg",
  neutral: "bg-cx-muted text-cx-muted-fg",
  danger: "bg-cx-destructive text-cx-destructive-fg",
} as const;

const alias: Record<string, keyof typeof variants> = {
  secondary: "primary",
  accent: "primary",
  muted: "neutral",
  ghost: "neutral",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof variants | keyof typeof alias;
}) {
  const variante = (alias[variant] ?? variant) as keyof typeof variants;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variante] ?? variants.neutral,
      )}
    >
      {children}
    </span>
  );
}
