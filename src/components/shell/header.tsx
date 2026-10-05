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
  Terminal,
  MessageSquare,
  Briefcase,
  FolderGit2,
  GraduationCap,
  BookOpen,
  Users,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  section: string;
  labelKey: string;
  icon: typeof MessageSquare;
}

const navItems: NavItem[] = [
  { section: "forum", labelKey: "nav.forum", icon: MessageSquare },
  { section: "jobs", labelKey: "nav.jobs", icon: Briefcase },
  { section: "projects", labelKey: "nav.projects", icon: FolderGit2 },
  { section: "mentorat", labelKey: "nav.mentorat", icon: GraduationCap },
  { section: "tutos", labelKey: "nav.tutos", icon: BookOpen },
  { section: "annuaire", labelKey: "nav.annuaire", icon: Users },
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => go("home")}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="h-9 w-9 rounded-md bg-ink text-background flex items-center justify-center font-serif font-bold text-lg">
                <span className="text-sun">&gt;_</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold tracking-tight">
                  CodeXchange
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden sm:block">
                  by devs, for devs
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentSection === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => go(item.section)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-terracotta/10 text-terracotta"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <ThemeToggle />

              {user ? (
                <button
                  onClick={() => go("dashboard")}
                  className="flex items-center gap-2 ml-1 pl-2 pr-1 py-1 rounded-full border border-border hover:bg-muted transition"
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
                    className="hidden sm:inline-flex"
                  >
                    {t("nav.login")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuth("register")}
                    className="bg-terracotta hover:bg-terracotta/90"
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
                    className="lg:hidden"
                    aria-label="Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-ink text-background flex items-center justify-center font-serif font-bold">
                        <span className="text-sun">&gt;_</span>
                      </div>
                      CodeXchange
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-6">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.section}
                          onClick={() => go(item.section)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition"
                        >
                          <Icon className="h-4 w-4 text-terracotta" />
                          <span className="text-sm font-medium">
                            {t(item.labelKey)}
                          </span>
                        </button>
                      );
                    })}
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
                          className="w-full bg-terracotta hover:bg-terracotta/90"
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
        {/* Kente divider */}
        <div className="kente-divider opacity-30" />
      </header>

      {/* Auth modal */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-serif">
              <Terminal className="h-5 w-5 text-terracotta" />
              {authMode === "login"
                ? t("auth.login.title")
                : t("auth.register.title")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {authMode === "login"
                ? t("auth.login.subtitle")
                : t("auth.register.subtitle")}
            </p>
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
