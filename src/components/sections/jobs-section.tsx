"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { ContentDialog } from "@/components/shared/content-forms";
import { Tag, tagColors } from "@/components/shared/tag";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  Globe,
  MapPin,
  Plus,
  Search,
  Star,
  Terminal,
  TrendingUp,
  Users,
} from "lucide-react";
import { timeAgo, timeAgoLong } from "@/lib/time";
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
  featured: boolean;
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
  const locale = useAppStore((s) => s.locale);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [stack, setStack] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  // G4 — recherche texte (debounce 150 ms déjà porté par l'effet de load).
  const [q, setQ] = useState("");
  // G5 — devise sélectionnée + codes réellement présents (renvoyés par l'API).
  const [currency, setCurrency] = useState("all");
  const [currencies, setCurrencies] = useState<string[]>([]);
  // G6 — verrou pendant le PATCH « à la une » (staff).
  const [featuring, setFeaturing] = useState(false);
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
    if (q.trim()) params.set("q", q.trim());
    if (currency !== "all") params.set("currency", currency);
    try {
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setCurrencies(Array.isArray(data.currencies) ? data.currencies : []);
    } catch {
      setJobs([]);
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }, [country, type, stack, remoteOnly, q, currency]);

  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [load]);

  /** G6 — staff uniquement : épingle/retire l'offre de la vitrine. */
  const toggleFeatured = async () => {
    if (!selected || featuring) return;
    setFeaturing(true);
    try {
      const res = await fetch(`/api/jobs/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !selected.featured }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || "Erreur");
        return;
      }
      const next: Job = { ...selected, featured: !selected.featured };
      setSelected(next);
      setJobs((prev) => prev.map((j) => (j.id === next.id ? next : j)));
      toast.success(next.featured ? t("jobs.featured_on") : t("jobs.unfeature"));
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setFeaturing(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Télémétrie dérivée du tampon courant                             */
  /* ---------------------------------------------------------------- */

  /** Drapeaux réellement appliqués — affichés tels quels dans le bandeau. */
  const activeFlags = [
    country !== "all" ? `country=${country}` : null,
    type !== "all" ? `type=${type}` : null,
    remoteOnly ? "remote=true" : null,
    stack !== "all" ? `stack=${stack}` : null,
    currency !== "all" ? `currency=${currency}` : null,
    q.trim() ? `q=${q.trim()}` : null,
  ].filter(Boolean) as string[];

  /** Employeurs du tampon, triés par nombre d'offres ouvertes. */
  const employers = useMemo(() => {
    const byCompany = new Map<string, number>();
    for (const job of jobs) {
      const name = job.company?.trim();
      if (name) byCompany.set(name, (byCompany.get(name) ?? 0) + 1);
    }
    return [...byCompany.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [jobs]);

  /** Stack la plus demandée dans le tampon (compteur réel, pas de chiffre figé). */
  const demandedStack = useMemo(() => {
    const byStack = new Map<string, number>();
    for (const job of jobs) {
      for (const raw of (job.stack ?? "").split(",")) {
        const tag = raw.trim().toLowerCase();
        if (tag) byStack.set(tag, (byStack.get(tag) ?? 0) + 1);
      }
    }
    return [...byStack.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [jobs]);

  const openCreate = () => (user ? setCreateOpen(true) : openAuth("login"));

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
            onClick={openCreate}
            size="sm"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("create.job")}
          </Button>
        </div>
      </SectionHeader>

      {/* ---------------------------------------------------------- */}
      {/* Bandeau d'état — ligne de commande vivante                  */}
      {/* ---------------------------------------------------------- */}
      <div
        className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground"
      >
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-bold text-brand">$ codexchange.dev/jobs</span>
        <span className="min-w-0 truncate">
          --filter={activeFlags.length > 0 ? activeFlags.join(" ") : "all"}
        </span>
        <span className="ms-auto inline-flex items-center gap-1.5 uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          live sync
        </span>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Matrice de filtres                                         */}
      {/* ---------------------------------------------------------- */}
      <Card className="mb-6 p-4 sm:p-5">
        {/* G4 — recherche titre / entreprise / description / stack,
            habillée en `grep` de terminal. */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 transition-colors focus-within:border-brand/60 focus-within:ring-[3px] focus-within:ring-ring/40">
            <span
              className="shrink-0 font-mono text-xs font-bold text-brand"
              aria-hidden="true"
            >
              &gt; grep -in
            </span>
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("jobs.search")}
              aria-label={t("jobs.search")}
              className="h-10 border-0 bg-transparent ps-0 font-mono text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-dashed border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="eyebrow mb-1.5 flex items-center gap-1.5">
              <span className="text-brand" aria-hidden="true">
                $
              </span>
              {t("jobs.filter.country.all")}
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger
                className="w-full font-mono text-xs"
                aria-label={t("jobs.filter.country.all")}
              >
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
            <Label className="eyebrow mb-1.5 flex items-center gap-1.5">
              <span className="text-brand" aria-hidden="true">
                $
              </span>
              {t("jobs.filter.type.all")}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger
                className="w-full font-mono text-xs"
                aria-label={t("jobs.filter.type.all")}
              >
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
            <Label className="eyebrow mb-1.5 flex items-center gap-1.5">
              <span className="text-brand" aria-hidden="true">
                $
              </span>
              {t("jobs.filter.stack.all")}
            </Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger
                className="w-full font-mono text-xs"
                aria-label={t("jobs.filter.stack.all")}
              >
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
          {/* Mode de travail — l'interrupteur lui-même porte l'état ; la
              bordure terracotta ne fait que le rendre visible d'un coup d'œil. */}
          <div>
            <span className="eyebrow mb-1.5 flex items-center gap-1.5">
              <span className="text-brand" aria-hidden="true">
                $
              </span>
              {t("jobs.remote_only")}
            </span>
            <div
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border px-3 transition-colors",
                remoteOnly
                  ? "border-brand bg-brand/10"
                  : "border-input bg-background"
              )}
            >
              <Switch
                id="remote"
                checked={remoteOnly}
                onCheckedChange={setRemoteOnly}
              />
              <Label
                htmlFor="remote"
                className="cursor-pointer font-mono text-[11px] uppercase tracking-widest"
              >
                {remoteOnly ? "remote=true" : "remote=false"}
              </Label>
            </div>
          </div>
        </div>
        {/* G5 — puces de devise : affichées seulement quand le contexte de
            filtres porte ≥ 2 codes réels (pas de pastille décorative). */}
        {currencies.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-dashed border-border">
            <span className="eyebrow me-1 flex items-center gap-1.5">
              <span className="text-brand" aria-hidden="true">
                $
              </span>
              {t("jobs.currency")}
            </span>
            {["all", ...currencies].map((code) => {
              const active = currency === code;
              return (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                    active
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                  )}
                >
                  <span aria-hidden="true" className="font-bold">
                    {active ? "[x]" : "[ ]"}
                  </span>
                  {code === "all" ? t("jobs.currency.all") : code}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------------- */}
      {/* Flux + colonne latérale                                    */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* En-tête du tampon — compteur réel, pas de chiffre codé. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5" aria-live="polite">
              <span className="text-brand" aria-hidden="true">
                {"//"}
              </span>
              {t("stats.jobs")}
              <span className="font-bold tabular-nums text-foreground">
                {jobs.length}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              live sync
            </span>
          </div>

          {loading ? (
            <div className="space-y-4" role="status" aria-busy="true">
              <span className="sr-only">{t("common.loading")}</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("jobs.empty")}</p>
            </Card>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => {
                const hub =
                  job.location && job.country ? job.country.toUpperCase() : null;
                const stackTags = (job.stack ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 5);
                return (
                  <li key={job.id} className="rise-in">
                    <article
                      onClick={() => setSelected(job)}
                      className="cursor-pointer"
                    >
                      <Card
                        className={cn(
                          "card-interactive gap-0 overflow-hidden p-0",
                          job.featured && "border-s-4 border-s-brand"
                        )}
                      >
                        {/* Bandeau d'état : vitrine, remote, référentiel. */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-border bg-muted/30 px-4 py-2 sm:px-5">
                          {job.featured && (
                            <Tag
                              label={t("jobs.featured")}
                              tone="terracotta"
                              className="uppercase tracking-widest"
                            >
                              <Star
                                className="h-3 w-3 fill-current"
                                aria-hidden="true"
                              />
                            </Tag>
                          )}
                          {job.remote && (
                            <Tag label="Remote" variant="outline">
                              <Globe className="h-3 w-3" aria-hidden="true" />
                            </Tag>
                          )}
                          <span
                            className="ms-auto font-mono text-[11px] text-muted-foreground"
                            aria-hidden="true"
                          >
                            #{job.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold leading-snug sm:text-lg">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(job);
                                  }}
                                  className="rounded-sm text-start decoration-2 underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                                >
                                  {job.title}
                                </button>
                              </h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  {job.company}
                                </span>
                                {hub && (
                                  <>
                                    <span aria-hidden="true">•</span>
                                    <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
                                      [HUB: {hub}]
                                    </span>
                                  </>
                                )}
                                {(job.location || job.country) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                    {job.location || job.country}
                                  </span>
                                )}
                              </div>
                            </div>
                            {job.salary && (
                              <div className="shrink-0 md:text-end">
                                <p className="flex items-center gap-1 font-mono text-sm font-bold text-brand md:justify-end">
                                  <DollarSign
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                  {job.salary}
                                </p>
                                <p className="font-mono text-[11px] text-muted-foreground">
                                  {t(`jobs.type.${job.type}`)}
                                </p>
                              </div>
                            )}
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground text-pretty">
                            {job.description}
                          </p>

                          {stackTags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                              {stackTags.map((s) => (
                                <Tag
                                  key={s}
                                  label={`#${s}`}
                                  variant={tagColors[s.toLowerCase()] || "default"}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pied de carte — le clic ne doit pas ouvrir le
                            détail en même temps que l'action. */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border bg-muted/20 px-4 py-2.5 sm:px-5"
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                            <time
                              dateTime={job.createdAt}
                              title={timeAgoLong(job.createdAt, locale)}
                              className="flex items-center gap-1"
                            >
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {timeAgo(job.createdAt, locale)}
                            </time>
                            <span aria-hidden="true">•</span>
                            <span className="flex items-center gap-1.5">
                              <Avatar
                                name={job.author.name}
                                color={job.author.profile?.avatarColor}
                                size="xs"
                              />
                              {t("jobs.posted_by")} {job.author.name}
                            </span>
                          </div>
                          {job.applyUrl ? (
                            <Button
                              asChild
                              size="sm"
                              variant={job.featured ? "default" : "outline"}
                              className="font-mono text-xs"
                            >
                              <a
                                href={job.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t("jobs.apply")}
                                <ArrowUpRight
                                  className="h-3.5 w-3.5 rtl:-scale-x-100"
                                  aria-hidden="true"
                                />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(job)}
                              className="font-mono text-xs"
                            >
                              {t("jobs.view")}
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------------ */}
        {/* Colonne latérale — télémétrie dérivée du tampon        */}
        {/* ------------------------------------------------------ */}
        <aside className="space-y-4" aria-label={t("feed.sidebar_label")}>
          {/* Employeurs qui recrutent dans le tampon courant. */}
          {employers.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <Users className="h-4 w-4 text-brand" aria-hidden="true" />
                TOP EMPLOYERS
              </h2>
              <ul className="space-y-2">
                {employers.map(({ name, count }) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => setQ(name)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-start font-mono text-xs transition-colors hover:border-brand/50 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                    >
                      <span className="min-w-0 flex-1 truncate font-bold text-foreground">
                        {name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {count} {t("common.results")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Stack la plus demandée — puces cliquables (recherche). */}
          {demandedStack.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-brand" aria-hidden="true" />
                {t("feed.tech_stack")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {demandedStack.map((s) => (
                  <Tag
                    key={s}
                    label={`#${s}`}
                    variant={tagColors[s] || "default"}
                    onClick={() => setQ(s)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Terminal recruteur — la même action que l'en-tête, dans son
              contexte (Stitch : `$ codexchange post --hire`). */}
          <Card className="gap-0 border-brand/50 p-5">
            <h2 className="mb-3 flex items-center gap-2 border-b border-dashed border-brand/40 pb-2 font-mono text-xs font-bold text-brand">
              <Terminal className="h-4 w-4" aria-hidden="true" />
              $ codexchange post --hire
            </h2>
            <p className="mb-4 text-sm text-muted-foreground text-pretty">
              {t("jobs.subtitle")}
            </p>
            <Button onClick={openCreate} className="w-full">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("create.job")}
            </Button>
          </Card>
        </aside>
      </div>

      {/* Job detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto scroll-pretty">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-brand" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {selected.featured && (
                        <Tag
                          label={t("jobs.featured")}
                          tone="terracotta"
                          className="uppercase tracking-widest"
                        >
                          <Star
                            className="h-3 w-3 fill-current"
                            aria-hidden="true"
                          />
                        </Tag>
                      )}
                      {selected.remote && (
                        <Tag label="Remote" variant="outline">
                          <Globe className="h-3 w-3" aria-hidden="true" />
                        </Tag>
                      )}
                    </div>
                    <DialogTitle className="font-bold text-2xl text-balance">
                      {selected.title}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selected.company}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground py-3 border-y border-border">
                {selected.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {selected.location || selected.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" aria-hidden="true" />
                  {t(`jobs.type.${selected.type}`)}
                </span>
                {selected.remote && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    Remote OK
                  </span>
                )}
                {selected.salary && (
                  <span className="flex items-center gap-1 font-medium text-brand">
                    <DollarSign className="h-3 w-3" aria-hidden="true" />
                    {selected.salary}
                  </span>
                )}
                <time
                  dateTime={selected.createdAt}
                  title={timeAgoLong(selected.createdAt, locale)}
                  className="ms-auto flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {timeAgo(selected.createdAt, locale)}
                </time>
              </div>

              {selected.stack && (
                <div className="flex flex-wrap gap-1.5 py-2">
                  {selected.stack
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <Tag key={s} label={`#${s}`} variant={tagColors[s.toLowerCase()] || "default"} />
                    ))}
                </div>
              )}

              <div>
                <h4 className="eyebrow mb-2 flex items-center gap-1.5">
                  <span className="text-brand" aria-hidden="true">
                    $
                  </span>
                  {t("jobs.create.description")}
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground me-auto">
                  <Avatar
                    name={selected.author.name}
                    color={selected.author.profile?.avatarColor}
                    size="xs"
                  />
                  <span>
                    {t("jobs.posted_by")} {selected.author.name}
                  </span>
                </div>
                {/* G6 — la vitrine se pilote depuis le détail, staff seul. */}
                {user && (user.role === "admin" || user.role === "moderator") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={featuring}
                    aria-pressed={selected.featured}
                    onClick={toggleFeatured}
                  >
                    <Star
                      className={cn("h-4 w-4 me-1", selected.featured && "fill-current")}
                      aria-hidden="true"
                    />
                    {selected.featured ? t("jobs.unfeature") : t("jobs.featured")}
                  </Button>
                )}
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
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
