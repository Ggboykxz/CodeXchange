"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chip used across the platform for tags, categories and statuses.
 *
 * `variant` covers the neutral chrome; `tone` covers the semantic accent
 * colors. Keeping them separate means a caller can combine them
 * (`tone="terracotta" variant="outline"`) instead of enumerating every
 * possible combination.
 */
export type TagTone =
  | "terracotta"
  | "sun"
  | "clay"
  | "baobab"
  | "sage"
  | "maroon";

export interface TagProps {
  label: string;
  children?: ReactNode;
  /**
   * Neutral chrome, or a legacy accent tone (pre-`tone` callers pass colors
   * directly here). Prefer `tone` for accents.
   */
  variant?: "default" | "muted" | "solid" | "outline" | TagTone;
  tone?: TagTone;
  className?: string;
  onClick?: () => void;
}

const variantMap = {
  default: "bg-muted text-muted-foreground border-transparent",
  muted: "bg-muted/60 text-muted-foreground border-transparent",
  solid: "bg-foreground text-background border-transparent",
  outline: "bg-transparent text-foreground border-border",
} as const;

/** Accent tones backed by the theme's chart palette (see globals.css). */
const toneMap: Record<TagTone, string> = {
  terracotta: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  sun: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  baobab: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  clay: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  sage: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  maroon: "bg-chart-4/15 text-chart-4 border-chart-4/30",
};

type BaseVariant = "default" | "muted" | "solid" | "outline";

/**
 * Accents par tag technique, partagés par le fil d'accueil et le forum :
 * `react` doit être la même couleur d'un écran à l'autre, sinon le lecteur
 * perd le repère visuel.
 */
export const tagColors: Record<string, TagTone | "default"> = {
  react: "terracotta",
  nextjs: "terracotta",
  go: "sun",
  rust: "clay",
  flutter: "sun",
  ai: "baobab",
  ml: "baobab",
  devops: "clay",
  career: "default",
  kotlin: "clay",
};

/**
 * Legacy callers pass their color name as `variant`; accept it and route it
 * to `tone` so old code keeps compiling while the API stays explicit.
 */
function splitVariant(variant: TagProps["variant"]): {
  variant: BaseVariant;
  tone?: TagTone;
} {
  if (variant && variant in toneMap) {
    return { variant: "default", tone: variant as TagTone };
  }
  return { variant: (variant as BaseVariant) ?? "default" };
}

export function Tag({
  label,
  children,
  variant = "default",
  tone,
  className,
  onClick,
}: TagProps) {
  const legacy = splitVariant(variant);
  const resolvedTone = tone ?? legacy.tone;
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono tracking-tight",
        resolvedTone ? toneMap[resolvedTone] : variantMap[legacy.variant],
        onClick && "hover:opacity-70 transition cursor-pointer",
        className
      )}
    >
      {children}
      {label}
    </Comp>
  );
}
