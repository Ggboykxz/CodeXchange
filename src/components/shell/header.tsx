"use client";

import { useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthForm } from "@/components/shared/auth-form";
import { Avatar } from "@/components/shared/avatar";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const go = (section: string) => {
    navigate(section);
    setMobileOpen(false);
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => go("home")}
              className="flex items-center gap-2 shrink-0 group"
            >
              <span className="text-base font-bold tracking-tight">
                <span className="text-muted-foreground">$</span>{" "}
                <span className="text-foreground">codexchange</span>
                <span className="text-muted-foreground">.dev</span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0">
              {navItems.map((item) => {
                const active = currentSection === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => go(item.section)}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors relative",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(item.labelKey)}
                    {active && (
                      <span className="absolute -bottom-px left-3 right-3 h-px bg-foreground" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="GitHub"
                className="hidden sm:flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition"
              >
                <Github className="h-4 w-4" />
              </a>
              <LanguageSwitcher />
              <ThemeToggle />

              {user ? (
                <button
                  onClick={() => go("dashboard")}
                  className="flex items-center gap-2 ml-1 pl-2 pr-1 py-1 rounded border border-border hover:bg-muted/50 transition text-sm"
                >
                  <Avatar
                    name={user.name}
                    color={user.profile?.avatarColor}
                    size="xs"
                  />
                  <span className="hidden sm:block text-sm font-medium pr-1">
                    {user.profile?.username || user.name}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              ) : (
                <>
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
                    className="bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
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
                    aria-label="Menu"
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
                    {navItems.map((item) => (
                      <button
                        key={item.section}
                        onClick={() => go(item.section)}
                        className="flex items-center gap-3 px-3 py-2 rounded text-left hover:bg-muted transition text-sm"
                      >
                        <span className="text-muted-foreground">→</span>
                        <span>{t(item.labelKey)}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
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
      </header>

      {/* Auth modal */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              <span className="text-muted-foreground">$</span>{" "}
              {authMode === "login"
                ? t("auth.login.title").toLowerCase()
                : t("auth.register.title").toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <AuthForm
            mode={authMode}
            onSuccess={() => setAuthOpen(false)}
            onSwitch={() =>
              setAuthMode(authMode === "login" ? "register" : "login")
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
