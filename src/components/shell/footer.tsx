"use client";

import { useState } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const [nlEmail, setNlEmail] = useState("");
  const [nlBusy, setNlBusy] = useState(false);

  const exploreLinks = [
    { section: "forum", label: t("nav.forum") },
    { section: "jobs", label: t("nav.jobs") },
    { section: "projects", label: t("nav.projects") },
    { section: "mentorat", label: t("nav.mentorat") },
    { section: "tutos", label: t("nav.tutos") },
    { section: "annuaire", label: t("nav.annuaire") },
  ];

  /**
   * I5 — l'abonnement écrit réellement en base (`POST /api/newsletter`).
   * La route répond pareil que l'adresse soit neuve ou déjà inscrite :
   * même toast, pas d'information sur la liste.
   */
  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nlBusy) return;
    setNlBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nlEmail }),
      });
      if (!res.ok) {
        toast.error(t("footer.newsletter_error"));
        return;
      }
      setNlEmail("");
      toast.success(t("footer.newsletter_done"));
    } catch {
      toast.error(t("footer.newsletter_error"));
    } finally {
      setNlBusy(false);
    }
  };

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand + Newsletter */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-1">
              <p className="text-base font-bold">
                <span className="text-muted-foreground">$</span> codexchange
                <span className="text-muted-foreground">.dev</span>
              </p>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>

            <div className="pt-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("footer.newsletter")}
              </p>
              <p className="text-sm text-muted-foreground mb-3 max-w-md">
                {t("footer.newsletter_cta")}
              </p>
              <form onSubmit={subscribe} className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder={t("footer.newsletter_placeholder")}
                  className="text-sm bg-card"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" variant="default" disabled={nlBusy}>
                  {t("footer.newsletter_subscribe")}
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {t("footer.explore")}
            </p>
            <ul className="space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.section}>
                  <button
                    onClick={() => navigate(link.section)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {t("footer.about")}
            </p>
            <ul className="space-y-2">
              {[t("footer.about_us"), t("footer.code_of_conduct"), t("footer.terms"), t("footer.privacy"), t("footer.contact")].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="font-mono">
            © {new Date().getFullYear()} CodeXchange · {t("footer.rights")}
          </p>
          <p className="font-mono">
            built in africa, by devs · for devs
          </p>
        </div>
      </div>
    </footer>
  );
}
