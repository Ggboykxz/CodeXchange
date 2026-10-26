"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/icones";
import { cn } from "@/lib/cn";

const ITEMS: { href: string; label: string; icone: "accueil" | "recherche" | "plus" | "notifications" | "profil" }[] = [
  { href: "/", label: "Accueil", icone: "accueil" },
  { href: "/recherche", label: "Recherche", icone: "recherche" },
  { href: "/forum/nouveau", label: "Poster", icone: "plus" },
  { href: "/notifications", label: "Notifs", icone: "notifications" },
  { href: "/profil", label: "Profil", icone: "profil" },
];

/** Barre de navigation inférieure (mobile) — façon app native. */
export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-cx-border bg-cx-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-center justify-around px-2 py-1.5">
        {ITEMS.map((item) => {
          const actif = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px] font-medium transition",
                  actif ? "text-cx-primary" : "text-cx-muted-fg hover:text-cx-fg",
                )}
              >
                <Icone nom={item.icone} className="size-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}