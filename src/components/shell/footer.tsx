"use client";

import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);

  const exploreLinks = [
    { section: "forum", label: t("nav.forum") },
    { section: "jobs", label: t("nav.jobs") },
    { section: "projects", label: t("nav.projects") },
    { section: "mentorat", label: t("nav.mentorat") },
    { section: "tutos", label: t("nav.tutos") },
    { section: "annuaire", label: t("nav.annuaire") },
  ];

  const aboutLinks = [
    t("footer.about_us"),
    t("footer.code_of_conduct"),
    t("footer.contact"),
  ];

  const legalLinks = [t("footer.terms"), t("footer.privacy")];

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Merci ! Tu recevras bientôt nos actualités.");
  };

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="kente-divider opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-md bg-ink text-background flex items-center justify-center font-serif font-bold text-xl">
                <span className="text-sun">&gt;_</span>
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight">
                CodeXchange
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t("footer.tagline")}
            </p>

            <div className="pt-2">
              <p className="text-xs font-mono uppercase tracking-widest text-terracotta mb-1">
                {t("footer.newsletter")}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {t("footer.newsletter_cta")}
              </p>
              <form onSubmit={subscribe} className="flex gap-2 max-w-sm">
                <Input
                  type="email"
                  placeholder={t("footer.newsletter_placeholder")}
                  className="text-sm"
                  required
                />
                <Button type="submit" size="sm" variant="default">
                  {t("footer.newsletter_subscribe")}
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-1 pt-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="#" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="#" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="#" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="#" aria-label="Email">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {t("footer.explore")}
            </h4>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.section}>
                  <button
                    onClick={() => navigate(link.section)}
                    className="text-sm text-foreground/80 hover:text-terracotta transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {t("footer.about")}
            </h4>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-terracotta transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-terracotta transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} CodeXchange · {t("footer.rights")}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {t("footer.made_with")} <Heart className="h-3 w-3 text-terracotta fill-terracotta" /> {t("footer.by")}
          </p>
        </div>
      </div>
    </footer>
  );
}
