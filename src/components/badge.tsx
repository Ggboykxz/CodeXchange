import type { ReactNode } from "react";

const variants: Record<string, string> = {
  primary: "bg-cx-primary text-cx-primary-fg hover:opacity-90",
  secondary: "bg-cx-secondary text-cx-secondary-fg hover:opacity-90",
  accent: "bg-cx-accent text-cx-accent-fg hover:opacity-90",
  muted: "bg-cx-muted text-cx-muted-fg hover:opacity-80",
  danger: "bg-cx-destructive text-cx-destructive-fg hover:opacity-90",
  ghost: "border border-cx-border bg-transparent text-cx-fg hover:bg-cx-muted",
};

export function Badge({
  children,
  variant = "muted",
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant] ?? variants.muted}`}
    >
      {children}
    </span>
  );
}
