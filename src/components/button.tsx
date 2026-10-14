import Link from "next/link";
import type { ReactNode } from "react";

const variants: Record<string, string> = {
  primary: "bg-cx-primary text-cx-primary-fg shadow-sm hover:opacity-90",
  accent: "bg-cx-accent text-cx-accent-fg shadow-sm hover:opacity-90",
  ghost: "border border-cx-border bg-cx-card text-cx-fg hover:bg-cx-muted",
  danger: "bg-cx-destructive text-cx-destructive-fg hover:opacity-90",
};

export type ButtonProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  href?: string;
  type?: "submit" | "button";
  className?: string;
};

export function Button({ children, variant = "primary", href, type = "button", className = "" }: ButtonProps) {
  const cls = `inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-sm min-h-[44px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-cx-ring active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] ?? variants.primary} ${className}`;
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
