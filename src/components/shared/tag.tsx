"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  variant?: "default" | "muted" | "solid" | "outline";
  className?: string;
  onClick?: () => void;
}

const variantMap = {
  default: "bg-muted text-muted-foreground border-transparent",
  muted: "bg-muted/60 text-muted-foreground border-transparent",
  solid: "bg-foreground text-background border-transparent",
  outline: "bg-transparent text-foreground border-border",
};

export function Tag({ label, variant = "default", className, onClick }: TagProps) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono tracking-tight",
        variantMap[variant],
        onClick && "hover:opacity-70 transition cursor-pointer",
        className
      )}
    >
      {label}
    </Comp>
  );
}
