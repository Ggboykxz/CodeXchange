"use client";

import { useEffect, useState } from "react";
import { useT, useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { ContentDialog } from "@/components/shared/content-forms";
import { Tag, tagColors, type TagTone } from "@/components/shared/tag";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  Cloud,
  Cpu,
  Hash,
  Layout,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Server,
  Smartphone,
  Users,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { timeAgo, timeAgoLong } from "@/lib/time";

type Profile = {
  id: string;
  username: string;
  avatarColor: string | null;
  country: string | null;
};

type Tutorial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string | null;
  coverEmoji: string;
  readTime: number;
  createdAt: string;
  author: { id: string; name: string; profile: Profile | null };
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  location: string | null;
  online: boolean;
  url: string | null;
  coverEmoji: string;
  attendees: number;
  organizer: { id: string; name: string; profile: Profile | null };
};

const tutorialCategories = ["all", "frontend", "backend", "mobile", "devops", "ai", "career", "general"];

/**
 * Accent de chaque catégorie — aligné sur `tagColors` du fil et du forum,
 * pour qu'une catégorie garde la même couleur d'un écran à l'autre.
 */
const categoryTone: Record<string, TagTone | "default"> = {
  frontend: "terracotta",
  backend: "sun",
  mobile: "sage",
  devops: "clay",
  ai: "baobab",
  career: "maroon",
  general: "default",
};

/** Icône de la même arborescence, pour l'arbre des catégories de la barre latérale. */
const categoryIcon: Record<string, typeof Layout> = {
  all: BookOpen,
  frontend: Layout,
  backend: Server,
  mobile: Smartphone,
  devops: Cloud,
  ai: Cpu,
  career: Briefcase,
  general: Layers,
};

/**
 * Tags les plus cités — comptés sur les tutos réellement chargés, aucun
 * chiffre codé en dur. Tri : occurrences puis alphabétique.
 */
function popularTags(list: Tutorial[]) {
  const counts = new Map<string, number>();
  for (const tut of list) {
    for (const tag of (tut.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
}

/** Nombre de tutos d'une catégorie (`all` = tout le référentiel). */
function countCategory(list: Tutorial[], category: string) {
  return category === "all"
    ? list.length
    : list.filter((tut) => tut.category === category).length;
}

export function TutosSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const sectionParam = useAppStore((s) => s.sectionParam);
  const locale = useAppStore((s) => s.locale);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [loadingTutorial, setLoadingTutorial] = useState(false);
  // Publication : un bouton par onglet (tuto / événement), modale unique.
  const [tutoCreateOpen, setTutoCreateOpen] = useState(false);
  const [eventCreateOpen, setEventCreateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthStore((s) => s.openAuth);
  /** Bouton « Publier » : connecté → modale, sinon → connexion. */
  const publish = (open: () => void) => () => (user ? open() : openAuth("login"));

  /** Même cible que le clic sur une carte : un seul chemin de navigation. */
  const openTutorial = (tut: Tutorial) => navigate("tutos", tut.slug);

  /** Boutons « publier » — la garde de session reste dans `publish`. */
  const publishTutorial = publish(() => setTutoCreateOpen(true));
  const publishEvent = publish(() => setEventCreateOpen(true));

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((d) => setTutorials(d.tutorials || []))
      .catch(() => {});
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load specific tutorial if sectionParam is set
  useEffect(() => {
    if (!sectionParam) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingTutorial(true);
    fetch(`/api/tutorials/${sectionParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.tutorial) setSelectedTutorial(d.tutorial);
        else navigate("tutos");
      })
      .catch(() => {})
      .finally(() => setLoadingTutorial(false));
  }, [sectionParam, navigate]);

  // Clear selected tutorial when navigating back to list
  useEffect(() => {
    if (!sectionParam && selectedTutorial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTutorial(null);
    }
  }, [sectionParam, selectedTutorial]);

  /** Puces `#tag` d'un contenu — mêmes tonalités que le fil. */
  const renderTags = (raw: string | null, limit = 3) =>
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, limit)
      .map((tg) => (
        <Tag key={tg} label={`#${tg}`} variant={tagColors[tg] || "default"} />
      ));

  /** Point de pulsation « terminal vivant » (composants partagés Stitch). */
  const pulseDot = (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );

  // Tutorial detail view
  if (sectionParam) {
    if (loadingTutorial) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      );
    }
    if (!selectedTutorial) return null;

    return (
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ms-2"
          onClick={() => navigate("tutos")}
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />
          {t("tutos.back_to_list")}
        </Button>

        <header className="mb-8">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="text-brand">$</span>
            <span>cat /tutorials/{selectedTutorial.slug}</span>
            {pulseDot}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-4xl leading-none" aria-hidden="true">
              {selectedTutorial.coverEmoji}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Tag
                label={t(`forum.category.${selectedTutorial.category}`)}
                variant={categoryTone[selectedTutorial.category] || "default"}
              />
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {selectedTutorial.readTime} {t("tutos.read_time")}
              </span>
            </div>
          </div>

          <h1 className="display mt-4 text-3xl text-balance sm:text-4xl">
            {selectedTutorial.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            {selectedTutorial.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-4 text-sm text-muted-foreground">
            <Avatar
              name={selectedTutorial.author.name}
              color={selectedTutorial.author.profile?.avatarColor}
              size="sm"
            />
            <span>
              {t("tutos.by")}{" "}
              <button
                onClick={() => navigate("annuaire", selectedTutorial.author.profile?.username)}
                className="font-medium text-foreground decoration-underline underline-offset-2 transition hover:text-brand hover:underline"
              >
                {selectedTutorial.author.name}
              </button>
            </span>
            <span aria-hidden="true">·</span>
            <time
              dateTime={selectedTutorial.createdAt}
              title={timeAgoLong(selectedTutorial.createdAt, locale)}
              className="font-mono text-xs"
            >
              {timeAgo(selectedTutorial.createdAt, locale)}
            </time>
          </div>
        </header>

        <div className="prose-editorial max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {selectedTutorial.body}
          </p>
        </div>

        {selectedTutorial.tags && (
          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-dashed border-border pt-6">
            {renderTags(selectedTutorial.tags, 12)}
          </div>
        )}
      </article>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Liste — dérivés uniquement : aucun état supplémentaire.             */
  /* ------------------------------------------------------------------ */
  const visible = tutorials.filter(
    (tut) => category === "all" || tut.category === category
  );
  const featured = visible[0];
  const rest = visible.slice(1);
  const tags = popularTags(tutorials);
  const avgRead = visible.length
    ? Math.round(
        visible.reduce((sum, tut) => sum + tut.readTime, 0) / visible.length
      )
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.tutos")}
        title={t("tutos.title")}
        subtitle={t("tutos.subtitle")}
        className="mb-6"
      />

      <Tabs defaultValue="tutos" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tutos">{t("tutos.tab.tutos")}</TabsTrigger>
          <TabsTrigger value="events">{t("tutos.tab.events")}</TabsTrigger>
        </TabsList>

        {/* TUTORIALS TAB */}
        <TabsContent value="tutos" className="space-y-6">
          {/* Barre de contrôle façon terminal : requête en cours + filtres. */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-3 py-2 font-mono text-[11px]">
              <span className="font-bold text-brand">$</span>
              <span className="text-foreground">codexchange.dev/tutorials</span>
              <span className="text-muted-foreground">--cat=</span>
              <span className="text-brand">{category}</span>
              <span className="text-muted-foreground">::</span>
              <span className="text-muted-foreground">
                {visible.length} {t("common.results")}
              </span>
              <span className="ms-auto">{pulseDot}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="me-1 font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t("common.filters")}
              </span>
              {tutorialCategories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                      active
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                    )}
                  >
                    <span aria-hidden="true" className="text-brand">
                      {active ? "[x]" : "[ ]"}
                    </span>
                    {c === "all"
                      ? t("tutos.filter.category.all")
                      : t(`forum.category.${c}`)}
                  </button>
                );
              })}
              <Button
                onClick={publishTutorial}
                size="sm"
                className="ms-auto bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("create.tutorial")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* ------------------------------------------------ */}
            {/* Colonne principale                                */}
            {/* ------------------------------------------------ */}
            <div className="min-w-0 space-y-6">
              {loading ? (
                <div className="space-y-4" role="status" aria-busy="true">
                  <span className="sr-only">{t("common.loading")}</span>
                  <div className="h-56 animate-pulse rounded-xl bg-muted" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
                    ))}
                  </div>
                </div>
              ) : visible.length === 0 ? (
                <Card className="border-dashed p-10 text-center">
                  <BookOpen
                    className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-muted-foreground">{t("feed.empty")}</p>
                  <Button className="mt-4" onClick={publishTutorial}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("create.tutorial")}
                  </Button>
                </Card>
              ) : (
                <>
                  {/* Carte « à la une » — le dernier guide publié du filtre. */}
                  {featured && (
                    <article className="rise-in">
                      <div className="card-interactive overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-brand px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-brand-foreground">
                          <span className="flex items-center gap-2 font-bold">
                            <span className="relative flex h-2 w-2" aria-hidden="true">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-foreground opacity-60" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-foreground" />
                            </span>
                            {t("jobs.featured")}
                          </span>
                          <span className="normal-case tracking-normal opacity-90">
                            path: /tutorials/{featured.slug}
                          </span>
                        </div>

                        <div className="p-5 sm:p-6">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="text-2xl leading-none" aria-hidden="true">
                              {featured.coverEmoji}
                            </span>
                            <Tag
                              label={t(`forum.category.${featured.category}`)}
                              variant={categoryTone[featured.category] || "default"}
                            />
                            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {featured.readTime} {t("tutos.read_time")}
                            </span>
                          </div>

                          <h3 className="display text-xl text-balance sm:text-2xl">
                            <a
                              href={`/tutos/${featured.slug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                openTutorial(featured);
                              }}
                              className="decoration-underline underline-offset-4 transition-colors hover:text-brand"
                            >
                              {featured.title}
                            </a>
                          </h3>

                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                            {featured.excerpt}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                            <Avatar
                              name={featured.author.name}
                              color={featured.author.profile?.avatarColor}
                              size="xs"
                            />
                            <span>
                              {t("tutos.by")}{" "}
                              <span className="font-medium text-foreground">
                                {featured.author.name}
                              </span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <time
                              dateTime={featured.createdAt}
                              title={timeAgoLong(featured.createdAt, locale)}
                              className="font-mono"
                            >
                              {timeAgo(featured.createdAt, locale)}
                            </time>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button size="sm" onClick={() => openTutorial(featured)}>
                              {t("tutos.read_more")}
                              <ArrowUpRight
                                className="h-3.5 w-3.5 rtl:-scale-x-100"
                                aria-hidden="true"
                              />
                            </Button>
                            {renderTags(featured.tags, 4)}
                          </div>
                        </div>
                      </div>
                    </article>
                  )}

                  {rest.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {rest.map((tut) => (
                        <article key={tut.id} className="rise-in">
                          <Card className="card-interactive h-full p-4">
                            <div className="flex h-full flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                                <span className="font-bold uppercase tracking-widest text-brand">
                                  [{t(`forum.category.${tut.category}`)}]
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {tut.readTime} {t("tutos.read_time")}
                                </span>
                              </div>

                              <span className="text-xl leading-none" aria-hidden="true">
                                {tut.coverEmoji}
                              </span>

                              <h4 className="text-base font-bold leading-snug">
                                <a
                                  href={`/tutos/${tut.slug}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openTutorial(tut);
                                  }}
                                  className="decoration-underline underline-offset-4 transition-colors hover:text-brand"
                                >
                                  {tut.title}
                                </a>
                              </h4>

                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {tut.excerpt}
                              </p>

                              <div className="mt-auto space-y-2.5">
                                <div className="flex flex-wrap gap-1.5">
                                  {renderTags(tut.tags, 3)}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-2.5 text-xs text-muted-foreground">
                                  <Avatar
                                    name={tut.author.name}
                                    color={tut.author.profile?.avatarColor}
                                    size="xs"
                                  />
                                  <span className="min-w-0 truncate">
                                    {t("tutos.by")} {tut.author.name}
                                  </span>
                                  <time
                                    dateTime={tut.createdAt}
                                    title={timeAgoLong(tut.createdAt, locale)}
                                    className="ms-auto font-mono"
                                  >
                                    {timeAgo(tut.createdAt, locale)}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ------------------------------------------------ */}
            {/* Barre latérale                                   */}
            {/* ------------------------------------------------ */}
            <aside className="space-y-4" aria-label={t("feed.sidebar_label")}>
              {/* Publier — le CTA de la page. */}
              <div className="rounded-xl border-2 border-brand/40 bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-brand">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("create.tutorial")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t("tutos.subtitle")}
                </p>
                <Button className="mt-4 w-full" onClick={publishTutorial}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t("create.submit")}
                </Button>
              </div>

              {/* Arborescence des catégories — compteurs réels. */}
              <Card className="p-4">
                <h2 className="mb-3 flex items-center gap-2 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("feed.sidebar_explore")}
                </h2>
                <ul className="space-y-1">
                  {tutorialCategories.map((c, i) => {
                    const active = category === c;
                    const Icon = categoryIcon[c] || Layers;
                    return (
                      <li key={c}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => setCategory(c)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                            active
                              ? "bg-brand/10 font-bold text-brand"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <span className="text-[10px] tabular-nums opacity-70">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-start">
                            {c === "all"
                              ? t("tutos.filter.category.all")
                              : t(`forum.category.${c}`)}
                          </span>
                          <span className="font-bold tabular-nums">
                            {countCategory(tutorials, c)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Tags les plus utilisés. */}
              <Card className="p-4">
                <h2 className="mb-3 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("feed.tech_stack")}
                </h2>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.slice(0, 12).map(([tag, count]) => (
                      <Tag
                        key={tag}
                        label={`#${tag} (${count})`}
                        variant={tagColors[tag] || "default"}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* Métriques — calculées sur les données chargées. */}
              <Card className="p-4">
                <h2 className="mb-3 flex items-center gap-2 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {pulseDot}
                  {t("feed.sidebar_stats")}
                </h2>
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("tutos.tab.tutos")}
                    </dt>
                    <dd className="font-mono text-2xl font-bold tabular-nums text-brand">
                      {tutorials.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("tutos.read_time")}
                    </dt>
                    <dd className="font-mono text-2xl font-bold tabular-nums text-brand">
                      {avgRead}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("tutos.create.category")}
                    </dt>
                    <dd className="font-mono text-2xl font-bold tabular-nums text-brand">
                      {new Set(tutorials.map((tut) => tut.category)).size}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("tutos.create.tags")}
                    </dt>
                    <dd className="font-mono text-2xl font-bold tabular-nums text-brand">
                      {tags.length}
                    </dd>
                  </div>
                </dl>
              </Card>
            </aside>
          </div>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 font-mono text-[11px]">
            <span className="font-bold text-brand">$</span>
            <span className="text-foreground">codexchange.dev/events</span>
            <span className="text-muted-foreground">::</span>
            <span className="text-muted-foreground">
              {events.length} {t("common.results")}
            </span>
            <span className="ms-auto">{pulseDot}</span>
            <Button
              onClick={publishEvent}
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("create.event")}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="border-dashed p-12 text-center">
              <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">{t("events.empty")}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <Card key={evt.id} className="card-interactive p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted/50 px-3 py-2 font-mono dark:bg-background/30">
                      <span className="text-[10px] uppercase tracking-widest text-foreground">
                        {format(new Date(evt.date), "MMM")}
                      </span>
                      <span className="text-2xl font-bold leading-none">
                        {format(new Date(evt.date), "dd")}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {format(new Date(evt.date), "yyyy")}
                      </span>
                    </div>

                    <div className="text-2xl shrink-0" aria-hidden="true">
                      {evt.coverEmoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-lg font-bold leading-tight">
                          {evt.title}
                        </h3>
                        {evt.online && (
                          <Tag label={t("events.online")} variant="outline" />
                        )}
                      </div>
                      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                        {evt.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {format(new Date(evt.date), "HH:mm")} UTC
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {evt.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          {evt.attendees} {t("events.attendees")}
                        </span>
                      </div>
                    </div>

                    {evt.url && (
                      <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0">
                        <a href={evt.url} target="_blank" rel="noopener noreferrer">
                          {evt.online ? <Video className="h-3.5 w-3.5 me-1" aria-hidden="true" /> : null}
                          {t("events.rsvp")}
                          <ArrowUpRight className="h-3 w-3 ms-1" aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Publications (G) — le même composant pour les quatre contenus. */}
      <ContentDialog<Tutorial>
        kind="tutorial"
        open={tutoCreateOpen}
        onOpenChange={setTutoCreateOpen}
        onCreated={(tut) => setTutorials((prev) => [tut, ...prev])}
      />
      <ContentDialog<EventItem>
        kind="event"
        open={eventCreateOpen}
        onOpenChange={setEventCreateOpen}
        onCreated={(evt) => setEvents((prev) => [evt, ...prev])}
      />
    </div>
  );
}
