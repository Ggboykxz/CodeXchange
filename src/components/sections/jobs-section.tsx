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
import { Switch } from "@/components/ui/switch";
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
import { Briefcase, MapPin, Globe, DollarSign, ArrowUpRight, Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  username: string;
  avatarColor: string | null;
  country: string | null;
  city: string | null;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  remote: boolean;
  type: string;
  stack: string | null;
  salary: string | null;
  description: string;
  applyUrl: string | null;
  createdAt: string;
  author: { id: string; name: string; profile: Profile | null };
};

const countries = [
  "all",
  "Sénégal",
  "Côte d'Ivoire",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Mali",
  "Gabon",
  "Egypt",
  "RD Congo",
];

const types = ["all", "full-time", "part-time", "contract", "internship", "freelance"];

const stacks = ["all", "React", "TypeScript", "Go", "Python", "Flutter", "Rust", "Django"];

export function JobsSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [stack, setStack] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);
  // Publication d'une offre : bouton toujours visible, modale unique.
  const [createOpen, setCreateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthStore((s) => s.openAuth);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country !== "all") params.set("country", country);
    if (type !== "all") params.set("type", type);
    if (stack !== "all") params.set("stack", stack);
    if (remoteOnly) params.set("remote", "true");
    try {
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [country, type, stack, remoteOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.jobs")}
        title={t("jobs.title")}
        subtitle={t("jobs.subtitle")}
        className="mb-8"
      >
        <div className="mt-4">
          <Button
            onClick={() => (user ? setCreateOpen(true) : openAuth("login"))}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("create.job")}
          </Button>
        </div>
      </SectionHeader>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("jobs.filter.country.all")}
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? t("jobs.filter.country.all") : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("jobs.filter.type.all")}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {tp === "all"
                      ? t("jobs.filter.type.all")
                      : t(`jobs.type.${tp}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("jobs.filter.stack.all")}
            </Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stacks.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? t("jobs.filter.stack.all") : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="remote"
                checked={remoteOnly}
                onCheckedChange={setRemoteOnly}
              />
              <Label htmlFor="remote" className="text-sm cursor-pointer">
                {t("jobs.remote_only")}
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Job cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("jobs.empty")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => setSelected(job)}
              className="text-start group"
            >
              <Card className="h-full p-5 hover:border-foreground/50 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-11 w-11 rounded-md bg-ink/5 dark:bg-background/10 border border-border flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-foreground transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {job.company}
                    </p>
                  </div>
                  {job.remote && (
                    <Tag label="Remote" variant="outline" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                  {job.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location || job.country}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {t(`jobs.type.${job.type}`)}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {job.salary}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {job.description}
                </p>

                {job.stack && (
                  <div className="flex flex-wrap gap-1">
                    {job.stack
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((s) => (
                        <Tag key={s} label={s} variant="default" />
                      ))}
                  </div>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Job detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto scroll-pretty">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-md bg-ink/5 border border-border flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="font-bold text-2xl">
                      {selected.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selected.company}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground py-3 border-y border-border">
                {selected.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selected.location || selected.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {t(`jobs.type.${selected.type}`)}
                </span>
                {selected.remote && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Globe className="h-4 w-4" />
                    Remote OK
                  </span>
                )}
                {selected.salary && (
                  <span className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {selected.salary}
                  </span>
                )}
              </div>

              {selected.stack && (
                <div className="flex flex-wrap gap-1.5 py-2">
                  {selected.stack
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <Tag key={s} label={s} />
                    ))}
                </div>
              )}

              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar
                    name={selected.author.name}
                    color={selected.author.profile?.avatarColor}
                    size="xs"
                  />
                  <span>
                    {t("jobs.posted_by")} {selected.author.name}
                  </span>
                </div>
                <Button
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90"
                  size="sm"
                >
                  <a
                    href={selected.applyUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("jobs.apply")}
                    <ArrowUpRight className="h-4 w-4 ms-1" />
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Publication d'une offre (G) — un seul composant pour les 4 contenus. */}
      <ContentDialog<Job>
        kind="job"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(job) => setJobs((prev) => [job, ...prev])}
      />
    </div>
  );
}
