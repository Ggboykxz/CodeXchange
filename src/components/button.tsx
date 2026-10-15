import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";

// Variantes limitées à `primary | ghost | danger` : un seul accent par vue.
// `accent` reste un alias de `primary` pour ne pas casser les appels existants.
const variants = {
  primary: "bg-cx-primary text-cx-primary-fg shadow-sm hover:opacity-90",
  ghost: "border border-cx-border bg-cx-card text-cx-fg hover:bg-cx-muted",
  danger: "bg-cx-destructive text-cx-destructive-fg hover:opacity-90",
} as const;

export type ButtonProps = {
  children: ReactNode;
  variant?: keyof typeof variants | "accent";
  href?: string;
  type?: "submit" | "button";
  className?: string;
};

export function Button({ children, variant = "primary", href, type = "button", className }: ButtonProps) {
  const variante = variant === "accent" ? "primary" : variant;
  const cls = cn(
    "inline-flex cursor-pointer items-center justify-center px-4 py-2.5 text-sm min-h-[44px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-cx-ring active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
    RAYON.md,
    variants[variante],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls}>
      {children}
    </button>
  );
}
