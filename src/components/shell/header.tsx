"use client";

import { useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { canAssignRoles } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar } from "@/components/shared/avatar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shell/global-search";
import {
  Menu,
  LogOut,
  ChevronDown,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  section: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { section: "forum", labelKey: "nav.forum" },
  { section: "jobs", labelKey: "nav.jobs" },
  { section: "projects", labelKey: "nav.projects" },
  { section: "mentorat", labelKey: "nav.mentorat" },
  { section: "tutos", labelKey: "nav.tutos" },
  { section: "annuaire", labelKey: "nav.annuaire" },
];

export function Header() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const currentSection = useAppStore((s) => s.section);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  // Modale unique pilotée par le store : le header ne fait que la déclencher.
  const openAuth = useAuthStore((s) => s.openAuth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (section: string) => {
    navigate(section);
    setMobileOpen(false);
  };

  // B8/I2 — les entrées « Messages » (membre connecté) et « Admin »
  // (administrateur) sont dérivées à chaque rendu (et non au module) :
  // `user` arrive du store, et se remplit après le montage quand le cache
  // local est vide.
  const items: NavItem[] = [
    ...(user ? [...navItems, { section: "messages", labelKey: "nav.messages" }] : navItems),
    ...(canAssignRoles(user) ? [{ section: "admin", labelKey: "nav.admin" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1 rounded"
            >
              <span className="text-base font-bold tracking-tight">
                <span className="text-muted-foreground">$</span>{" "}
                <span className="text-foreground">codexchange</span>
                <span className="text-muted-foreground">.dev</span>
              </span>
            </a>

            {/* Desktop nav — de vrais liens : clic médian, clic droit →
                « ouvrir dans un onglet », URL copiable, Retour du navigateur. */}
            <nav className="hidden md:flex items-center gap-0">
              {items.map((item) => {
                const active = currentSection === item.section;
                return (
                  <a
                    key={item.section}
                    href={item.section === "home" ? "/" : `/${item.section}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(item.labelKey)}
                    {active && (
                      <span className="absolute -bottom-px start-3 end-3 h-px bg-foreground" />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/Ggboykxz/CodeXchange"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hidden sm:flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition"
              >
                <Github className="h-4 w-4" />
              </a>
              <NotificationBell />
              {/* Langue + thème : masqués sous `sm`. Seul le groupe
                  connecté fait déborder le header de 62 px sur un écran de
                  390 px ; les deux contrôles restent atteignables dans le
                  menu hamburger, où ils sont ajoutés ci-dessous. */}
              <div className="hidden sm:flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              {user ? (
                <button
                  onClick={() => go("dashboard")}
                  className="flex items-center gap-2 ms-1 ps-2 pe-1 py-1 rounded border border-border hover:bg-muted/50 transition text-sm"
                >
                  <Avatar
                    name={user.name}
                    color={user.profile?.avatarColor}
                    size="xs"
                  />
                  <span className="hidden sm:block text-sm font-medium pe-1">
                    {user.profile?.username || user.name}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              ) : (
                <>
                  {/* Connexion / Rejoindre : masqués sous `sm` — ils sont déjà
                      en bas du menu hamburger, et le header doit laisser passer
                      le bouton de menu sur un écran de 390 px. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuth("login")}
                    className="hidden sm:inline-flex text-sm"
                  >
                    {t("nav.login")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuth("register")}
                    className="hidden sm:inline-flex bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
                  >
                    {t("nav.register")}
                  </Button>
                </>
              )}

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label={t("nav.menu")}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <span className="font-mono font-bold">
                        <span className="text-muted-foreground">$</span> codexchange
                        <span className="text-muted-foreground">.dev</span>
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-6">
                    {items.map((item) => (
                      <a
                        key={item.section}
                        href={item.section === "home" ? "/" : `/${item.section}`}
                        aria-current={
                          currentSection === item.section ? "page" : undefined
                        }
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded text-start hover:bg-muted transition text-sm",
                          currentSection === item.section &&
                            "bg-muted font-medium"
                        )}
                      >
                        <span className="text-muted-foreground rtl:-scale-x-100">→</span>
                        <span>{t(item.labelKey)}</span>
                      </a>
                    ))}
                  </nav>
                  <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-border space-y-2">
                    {/* Contrôles masqués en petit écran : repris ici. */}
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 me-2" />
                        {t("nav.logout")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            openAuth("login");
                            setMobileOpen(false);
                          }}
                        >
                          {t("nav.login")}
                        </Button>
                        <Button
                          className="w-full bg-foreground text-background hover:bg-foreground/90"
                          onClick={() => {
                            openAuth("register");
                            setMobileOpen(false);
                          }}
                        >
                          {t("nav.register")}
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        {/* Recherche transverse (D9) : une boîte, tout le site — questions, offres,
            projets, tutos, agenda, membres. Ligne dédiée pour ne pas compresser
            la barre principale sur aucun breakpoint. */}
        <div className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2">
            <GlobalSearch />
          </div>
        </div>
      </header>
    </>
  );
}
