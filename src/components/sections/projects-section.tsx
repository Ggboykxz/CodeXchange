"use client";

import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { ContentDialog } from "@/components/shared/content-forms";
import { Tag, tagColors } from "@/components/shared/tag";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Star,
  GitBranch,
  ExternalLink,
  FolderGit2,
  Plus,
  ArrowRight,
  MapPin,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  username: string;
  avatarColor: string | null;
  country: string | null;
};

type Project = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  repoUrl: string | null;
  demoUrl: string | null;
  stack: string | null;
  status: string;
  lookingFor: string | null;
  cover: string | null;
  stars: number;
  createdAt: string;
  author: { id: string; name: string; profile: Profile | null };
};

const statuses = ["all", "idea", "mvp", "beta", "live", "maintained"];
const stacks = ["all", "React", "TypeScript", "Go", "Python", "Flutter", "Rust", "Next.js"];

/**
 * Pastille de cycle de vie — la couleur reprend celle du badge de statut
 * (vert « en production », terre cuite pour la beta). Le libellé texte porte
 * déjà l'information : la pastille n'est qu'un repère, jamais le seul indice.
 */
const statusDot: Record<string, string> = {
  idea: "bg-muted-foreground",
  mvp: "bg-chart-2",
  beta: "bg-brand",
  live: "bg-emerald-500",
  maintained: "bg-foreground",
};

/** Libellé d'un filtre de statut — celui du menu déroulant et des puces. */
function statusLabel(s: string, t: (key: string) => string) {
  return s === "all" ? t("projects.filter.status.all") : t(`projects.status.${s}`);
}

/**
 * Vitrine « Open Source & Projects Showcase » — le portail projets de la
 * plateforme, dans l'identité terminale.
 *
 * Hiérarchie reprise du design : bandeau d'en-tête en ligne de commande
 * (`$ codexchange.dev/projects`), barre de filtres « matrice de cycle de vie »
 * (idée / MVP / beta / en production / maintenu), grille de cartes de projet
 * (statut, hub, étoiles, slogan, extrait, stack, rôles recherchés, auteur,
 * liens repo/démo) et colonne latérale de commandes (publication, matrice de
 * statuts, stacks tendance).
 *
 * Toute la logique — récupération `/api/projects`, filtres statut/stack,
 * ouverture du détail, publication — est inchangée : seul le rendu a été
 * remis en forme avec nos composants et les tokens sémantiques.
 */
export function ProjectsSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [stack, setStack] = useState("all");
  const [selected, setSelected] = useState<Project | null>(null);
  // Publication d'un projet : bouton visible, modale unique.
  const [createOpen, setCreateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthStore((s) => s.openAuth);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (stack !== "all") params.set("stack", stack);
    try {
      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [status, stack]);

  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [load]);

  /** Ouvre la modale de publication — ou l'auth si le visiteur n'a pas de session. */
  const openCreate = () => (user ? setCreateOpen(true) : openAuth("login"));

  /** Les liens de la carte ne doivent pas déclencher l'ouverture du détail. */
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ---------------------------------------------------------- */}
      {/* Bandeau d'en-tête — ligne de commande, titre, CTA          */}
      {/* ---------------------------------------------------------- */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative p-5 sm:p-6 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div className="relative">
            {/* Chrome du terminal : prompt, options, voyant d'index. */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 font-mono text-xs text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold text-brand">$</span>
                <span className="truncate">codexchange.dev/projects</span>
                <span className="hidden sm:inline">--view=all --sort=stars</span>
              </div>
              <span className="border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                [status: index_synced]
              </span>
            </div>

            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <span className="text-brand">$</span> {t("nav.projects")}
            </p>
            <h1 className="display text-2xl text-balance sm:text-3xl">
              {t("projects.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("projects.subtitle")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                onClick={openCreate}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("create.project")}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Barre de filtres — matrice de cycle de vie + stack          */}
      {/* ---------------------------------------------------------- */}
      <Card className="mb-6 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label={t("common.filters")}
          >
            <span className="me-1 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              filter:
            </span>
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                  status === s
                    ? "border-brand bg-brand/10 font-bold text-brand"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                )}
              >
                <span aria-hidden="true" className={status === s ? "" : "opacity-60"}>
                  {status === s ? "[x]" : "[ ]"}
                </span>
                {statusLabel(s, t)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="project-stack"
              className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              {t("projects.filter.stack.all")}
            </Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger id="project-stack" className="h-9 w-[168px] font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stacks.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? t("projects.filter.stack.all") : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------- */}
      {/* Grille principale : vitrine + colonne de commandes         */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------- Vitrine projets ---------------- */}
        <div className="min-w-0">
          {loading ? (
            <div
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
              role="status"
              aria-busy="true"
            >
              <span className="sr-only">{t("common.loading")}</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FolderGit2
                className="h-8 w-8 text-muted-foreground mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">{t("projects.empty")}</p>
              <Button
                className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("create.project")}
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {projects.map((p) => {
                  const stackList =
                    p.stack
                      ?.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean) ?? [];
                  const roles =
                    p.lookingFor
                      ?.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean) ?? [];
                  const hub = p.author.profile?.country;

                  return (
                    <article
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="rise-in group cursor-pointer"
                    >
                      <Card className="card-interactive h-full gap-0 overflow-hidden p-0 py-0">
                        {/* Bandeau terminal : statut, hub, étoiles. */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2 font-mono text-[11px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 shrink-0",
                                statusDot[p.status] || "bg-muted-foreground"
                              )}
                              aria-hidden="true"
                            />
                            <Tag
                              label={t(`projects.status.${p.status}`)}
                              variant={statusVariant(p.status)}
                            />
                            {hub && (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" aria-hidden="true" />
                                {hub.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 font-bold tabular-nums text-brand">
                            <Star className="h-3.5 w-3.5" aria-hidden="true" />
                            {p.stars}
                            <span className="font-normal text-muted-foreground">
                              {t("projects.stars")}
                            </span>
                          </span>
                        </div>

                        <div className="flex h-full flex-col gap-2 p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-lg"
                              aria-hidden="true"
                            >
                              {p.cover || "📦"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base font-bold leading-snug">
                                <button
                                  type="button"
                                  onClick={() => setSelected(p)}
                                  className="rounded font-mono text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                                >
                                  {p.name}
                                </button>
                              </h3>
                              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground text-pretty">
                                {p.tagline}
                              </p>
                            </div>
                          </div>

                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {p.description}
                          </p>

                          {stackList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {stackList.slice(0, 5).map((s) => (
                                <Tag
                                  key={s}
                                  label={s}
                                  variant={tagColors[s.toLowerCase()] || "default"}
                                />
                              ))}
                            </div>
                          )}

                          {roles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                {t("projects.looking_for")}
                              </span>
                              {roles.slice(0, 3).map((r) => (
                                <Tag
                                  key={r}
                                  label={r}
                                  variant="outline"
                                  className="border-brand/40 font-bold text-brand"
                                />
                              ))}
                            </div>
                          )}

                          {/* Pied de carte : auteur + liens repo / démo. */}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 font-mono text-[11px] text-muted-foreground">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Avatar
                                name={p.author.name}
                                color={p.author.profile?.avatarColor}
                                size="xs"
                              />
                              <span className="truncate font-medium text-foreground">
                                {p.author.name}
                              </span>
                            </span>
                            <span className="flex items-center gap-2.5">
                              {p.repoUrl && (
                                <a
                                  href={p.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={stop}
                                  className="inline-flex items-center gap-1 rounded font-bold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                                >
                                  <GitBranch className="h-3 w-3" aria-hidden="true" />
                                  {t("projects.repo")}
                                </a>
                              )}
                              {p.demoUrl && (
                                <a
                                  href={p.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={stop}
                                  className="inline-flex items-center gap-1 rounded hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                                >
                                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                  {t("projects.demo")}
                                </a>
                              )}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </article>
                  );
                })}
              </div>

              <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="font-bold text-brand">&gt;&gt;</span>
                {projects.length} {t("common.results")}
              </p>
            </>
          )}
        </div>

        {/* ---------------- Colonne de commandes ---------------- */}
        <aside className="space-y-4" aria-label={t("projects.title")}>
          {/* Publication : `$ codexchange project --submit`. */}
          <Card className="gap-3 p-5">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                $ project --submit
              </span>
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
              {t("modules.projects.desc")}
            </p>
            <Button
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("create.project")}
            </Button>
          </Card>

          {/* Matrice de statuts — mêmes filtres que la barre du haut. */}
          <Card className="gap-3 p-5">
            <h2 className="flex items-center justify-between gap-2 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-brand">{"//"}</span>{" "}
                {statusLabel("all", t)}
              </span>
            </h2>
            <ul className="space-y-1.5">
              {statuses.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      status === s
                        ? "border-brand bg-brand/10 font-bold text-brand"
                        : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className={status === s ? "" : "opacity-60"}>
                        {status === s ? "[x]" : "[ ]"}
                      </span>
                      {statusLabel(s, t)}
                    </span>
                    <span
                      className={cn("h-2 w-2", statusDot[s] || "bg-muted-foreground")}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Stacks tendance — puces de filtrage rapide. */}
          <Card className="gap-3 p-5">
            <h2 className="flex items-center justify-between gap-2 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {t("feed.tech_stack")}
              </span>
              <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                live
              </span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {stacks
                .filter((s) => s !== "all")
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={stack === s}
                    onClick={() => setStack(stack === s ? "all" : s)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      stack === s
                        ? "border-chart-1/30 bg-chart-1/15 font-bold text-chart-1"
                        : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span aria-hidden="true" className={stack === s ? "" : "opacity-60"}>
                      {stack === s ? "[x]" : "[ ]"}
                    </span>#{s}
                  </button>
                ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Détail d'un projet — même contenu qu'avant, habillage terminal. */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto scroll-pretty">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div
                    className="h-14 w-14 rounded-md bg-muted border border-border flex items-center justify-center font-mono text-3xl shrink-0"
                    aria-hidden="true"
                  >
                    {selected.cover || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="font-mono text-2xl font-bold text-brand">
                      {selected.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selected.tagline}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 py-3 border-y border-border">
                <Tag label={t(`projects.status.${selected.status}`)} variant={statusVariant(selected.status)} />
                {selected.stack?.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <Tag key={s} label={s} />
                ))}
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  {"// "}
                  {t("projects.create.description")}
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              {selected.lookingFor && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-foreground mb-2 flex items-center gap-1">
                    <span className="text-brand">{"//"}</span>{" "}
                    {t("projects.looking_for")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.lookingFor
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <Tag key={s} label={s} variant="outline" />
                      ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar
                    name={selected.author.name}
                    color={selected.author.profile?.avatarColor}
                    size="xs"
                  />
                  <span>{t("projects.by")} {selected.author.name}</span>
                  <span className="flex items-center gap-0.5 ms-2">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    {selected.stars}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selected.repoUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer">
                        <GitBranch className="h-4 w-4 me-1.5" aria-hidden="true" />
                        {t("projects.repo")}
                      </a>
                    </Button>
                  )}
                  {selected.demoUrl && (
                    <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                      <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 me-1.5" aria-hidden="true" />
                        {t("projects.demo")}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Publication d'un projet (G). */}
      <ContentDialog<Project>
        kind="project"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => setProjects((prev) => [project, ...prev])}
      />
    </div>
  );
}

function statusVariant(status: string): "terracotta" | "sun" | "clay" | "baobab" | "default" {
  switch (status) {
    case "idea": return "default";
    case "mvp": return "sun";
    case "beta": return "terracotta";
    case "live": return "baobab";
    case "maintained": return "clay";
    default: return "default";
  }
}
