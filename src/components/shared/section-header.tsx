"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="display text-4xl sm:text-5xl lg:text-6xl text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground text-pretty leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
