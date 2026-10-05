"use client";

import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  terracotta: "bg-terracotta text-white",
  sun: "bg-sun text-ink",
  clay: "bg-clay text-white",
  baobab: "bg-baobab text-white",
  sage: "bg-[oklch(0.55_0.09_145)] text-white",
  maroon: "bg-[oklch(0.42_0.12_25)] text-white",
};

interface AvatarProps {
  name?: string | null;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-7 w-7 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
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
        "rounded-full flex items-center justify-center font-serif font-bold shrink-0 shadow-sm",
        bg,
        sizeMap[size],
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
