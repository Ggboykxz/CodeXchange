"use client";

import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  terracotta: "bg-foreground text-background",
  sun: "bg-muted text-foreground",
  clay: "bg-foreground/80 text-background",
  baobab: "bg-foreground text-background",
  sage: "bg-muted-foreground text-background",
  maroon: "bg-foreground/90 text-background",
};

interface AvatarProps {
  name?: string | null;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

function initials(name: string | undefined | null) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  const bg = colorMap[color || "terracotta"] || colorMap.terracotta;
  return (
    <div
      className={cn(
        "rounded flex items-center justify-center font-mono font-semibold shrink-0",
        bg,
        sizeMap[size],
        className
      )}
      aria-label={name || "user"}
    >
      {initials(name)}
    </div>
  );
}
