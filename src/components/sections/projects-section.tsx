"use client";

import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { ContentDialog } from "@/components/shared/content-forms";
import { Tag } from "@/components/shared/tag";
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
  Users,
  Sparkles,
  Plus,
} from "lucide-react";

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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.projects")}
        title={t("projects.title")}
        subtitle={t("projects.subtitle")}
        className="mb-8"
      >
        <div className="mt-4">
          <Button
            onClick={() => (user ? setCreateOpen(true) : openAuth("login"))}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("create.project")}
          </Button>
        </div>
      </SectionHeader>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("projects.filter.status.all")}
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? t("projects.filter.status.all") : t(`projects.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("projects.filter.stack.all")}
            </Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FolderGit2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("projects.empty")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="text-left group">
              <Card className="h-full p-5 hover:border-foreground/50 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-md bg-muted border border-border flex items-center justify-center text-2xl shrink-0">
                    {p.cover || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-foreground transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {p.tagline}
                    </p>
                  </div>
                  <Tag label={t(`projects.status.${p.status}`)} variant={statusVariant(p.status)} />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {p.description}
                </p>

                {p.stack && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.stack
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((s) => (
                        <Tag key={s} label={s} />
                      ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {p.stars} {t("projects.stars")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Avatar
                      name={p.author.name}
                      color={p.author.profile?.avatarColor}
                      size="xs"
                    />
                    {p.author.name}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto scroll-pretty">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-md bg-muted border border-border flex items-center justify-center text-3xl shrink-0">
                    {selected.cover || "📦"}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="font-bold text-2xl">
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
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              {selected.lookingFor && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
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
                  <span className="flex items-center gap-0.5 ml-2">
                    <Star className="h-3 w-3" />
                    {selected.stars}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selected.repoUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer">
                        <GitBranch className="h-4 w-4 mr-1.5" />
                        {t("projects.repo")}
                      </a>
                    </Button>
                  )}
                  {selected.demoUrl && (
                    <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                      <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1.5" />
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
