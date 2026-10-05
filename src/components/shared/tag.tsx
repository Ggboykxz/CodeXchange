"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  variant?: "default" | "terracotta" | "sun" | "baobab" | "clay";
  className?: string;
  onClick?: () => void;
}

const variantMap = {
  default: "bg-muted text-foreground/70 border-border",
  terracotta: "bg-terracotta/10 text-terracotta border-terracotta/30",
  sun: "bg-sun/20 text-ink border-sun/40",
  baobab: "bg-baobab/15 text-baobab border-baobab/30 dark:text-baobab",
  clay: "bg-clay/10 text-clay border-clay/30 dark:text-clay",
};

export function Tag({ label, variant = "default", className, onClick }: TagProps) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-mono",
        variantMap[variant],
        onClick && "hover:opacity-80 transition cursor-pointer",
        className
      )}
    >
      {label}
    </Comp>
  );
}
