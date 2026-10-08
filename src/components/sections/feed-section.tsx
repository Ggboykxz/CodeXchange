"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useFeedPrefsStore } from "@/store/feed-prefs-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  CreateThreadForm,
  type NewThreadData,
} from "@/components/shared/create-thread-form";
import { ThreadCard, type ThreadCardData } from "@/components/shared/thread-card";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Clock,
  EyeOff,
  Flame,
  FolderGit2,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIME_WINDOWS, type TimeWindow } from "@/lib/ranking";

/** Page du fil — volontairement courte : le défilement reste réactif. */
const PAGE = 10;

/**
 * Les cinq tris de Reddit, dans l'ordre où il les présente : Chaud (défaut),
 * Nouveaux, Populaires (+ fenêtre temporelle), En croissance, Actifs.
 * Les formules vivent dans `lib/ranking` — ici, on ne fait qu'afficher.
 */
type Sort = "hot" | "new" | "top" | "rising" | "active";

type Stats = {
  users: number;
  threads: number;
  jobs: number;
  projects: number;
  mentors: number;
  tutorials: number;
  events: number;
  countries: number;
};

const sortOptions: { value: Sort; labelKey: string; Icon: typeof Flame }[] = [
  { value: "hot", labelKey: "feed.sort.hot", Icon: Flame },
  { value: "new", labelKey: "feed.sort.new", Icon: Clock },
  { value: "top", labelKey: "feed.sort.top", Icon: BarChart3 },
  { value: "rising", labelKey: "feed.sort.rising", Icon: TrendingUp },
  { value: "active", labelKey: "feed.sort.active", Icon: MessageSquare },
];

const timeLabels: Record<TimeWindow, string> = {
  hour: "feed.time.hour",
  day: "feed.time.day",
  week: "feed.time.week",
  month: "feed.time.month",
  year: "feed.time.year",
  all: "feed.time.all",
};

const modules = [
  { section: "forum", labelKey: "nav.forum", titleKey: "modules.forum.title", Icon: MessageSquare },
  { section: "jobs", labelKey: "nav.jobs", titleKey: "modules.jobs.title", Icon: Briefcase },
  { section: "projects", labelKey: "nav.projects", titleKey: "modules.projects.title", Icon: FolderGit2 },
  { section: "mentorat", labelKey: "nav.mentorat", titleKey: "modules.mentorat.title", Icon: Users },
  { section: "tutos", labelKey: "nav.tutos", titleKey: "modules.tutos.title", Icon: BookOpen },
  { section: "annuaire", labelKey: "nav.annuaire", titleKey: "modules.annuaire.title", Icon: MapPin },
];

/**
 * Fil d'accueil — l'écran d'entrée du réseau.
 *
 * Comme sur Reddit : tri (récents / populaires / actifs), filtre « non
 * résolus », composeur en tête, vote ↑↓ sur chaque carte, « charger plus »
 * au lieu d'une pagination au clic, et une colonne de droite qui affiche des
 * **compteurs lus en base** — jamais de chiffre codé en dur.
 */
export function FeedSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const openAuth = useAuthStore((s) => s.openAuth);

  const [threads, setThreads] = useState<ThreadCardData[]>([]);
  const [sort, setSort] = useState<Sort>("hot");
  /** Fenêtre de `Populaires` (heure → tout) : n'est lue que par ce tri. */
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [unsolved, setUnsolved] = useState(false);
  /** Saisie instantanée de la barre de recherche… */
  const [searchInput, setSearchInput] = useState("");
  /** …et requête réellement envoyée, différée de 300 ms (debounce). */
  const [q, setQ] = useState("");
  const [error, setError] = useState(false);
  /**
   * Clé réellement chargée (`tri|filtre|recherche`). Tant qu'elle diffère de
   * la clé courante, on affiche le squelette : pas besoin d'un état « loading »
   * posé dans un effet (ce qui provoquerait un rendu en cascade).
   */
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const key = `${sort}|${timeWindow}|${unsolved}|${q}`;
  const pending = loadedKey !== key;

  const [createOpen, setCreateOpen] = useState(false);

  // Masquages (« ⋯ → Masquer ») : le fil **filtre** dessus, donc « Annuler »
  // et « Tout réafficher » agissent instantanément, sans rechargement.
  const hiddenIds = useFeedPrefsStore((s) => s.hidden);
  const restoreAll = useFeedPrefsStore((s) => s.restoreAll);
  const visible = threads.filter((th) => !hiddenIds.includes(th.id));

  /** Longueur courante : nécessaire pour calculer la page suivante. */
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current = threads.length;
  }, [threads.length]);
  /** Numéro de requête : une réponse tardive ne doit pas écraser la nouvelle. */
  const reqRef = useRef(0);

  // Recherche : on ne repasse le fil en mode « chargement » qu'après 300 ms
  // sans frappe, sinon chaque caractère provoquerait un squelette.
  useEffect(() => {
    const id = setTimeout(() => setQ(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  /** Ouvre la modale d'auth **unique** (store partagé avec l'en-tête). */
  const askSignIn = (mode: "login" | "register") => openAuth(mode);

  /* ---------------------------------------------------------------- */
  /* Chargement du fil                                                 */
  /* ---------------------------------------------------------------- */

  const load = useCallback(
    async (mode: "reset" | "more") => {
      const id = ++reqRef.current;
      try {
        const page =
          mode === "more" ? Math.floor(countRef.current / PAGE) + 1 : 1;
        const params = new URLSearchParams({
          limit: String(PAGE),
          page: String(page),
          sort,
        });
        // `?t=` ne concerne que `top`, comme le sélecteur d'échéance de Reddit.
        if (sort === "top" && timeWindow !== "all") params.set("t", timeWindow);
        if (unsolved) params.set("solved", "false");
        if (q) params.set("q", q);

        const res = await fetch(`/api/threads?${params.toString()}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (id !== reqRef.current) return; // réponse obsolète

        setThreads((prev) =>
          mode === "more" ? [...prev, ...(data.threads ?? [])] : data.threads ?? []
        );
        setHasMore(Boolean(data.hasMore));
        setError(false);
        setLoadedKey(key);
      } catch {
        if (id !== reqRef.current) return;
        if (mode === "more") {
          // La liste est déjà affichée : on n'efface pas tout pour une page
          // qui n'a pas pu être récupérée.
          toast.error(t("common.network_error"));
        } else {
          setError(true);
          setLoadedKey(key); // stoppe le squelette, sinon il tourne à l'infini
        }
      } finally {
        if (id === reqRef.current) setLoadingMore(false);
      }
    },
    [key, sort, timeWindow, unsolved, q, t]
  );

  // Recharge à chaque changement de tri/filtre (et au premier rendu), ainsi
  // qu'après une connexion/déconnexion : `myVote` vient de la session, les
  // flèches ↑↓ doivent donc se réaligner dès que l'identité change.
  const userId = user?.id;
  useEffect(() => {
    load("reset");
  }, [load, userId]);

  // Compteurs réels — une seule requête, mise en cache 60 s côté CDN.
  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (alive && d?.stats) setStats(d.stats);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Votes — optimistes, puis réalignés sur le serveur                 */
  /* ---------------------------------------------------------------- */

  const handleVote = async (
    thread: ThreadCardData,
    value: 1 | -1 | 0
  ) => {
    if (!user) {
      askSignIn("login");
      return;
    }
    const before = { upvotes: thread.upvotes, myVote: thread.myVote ?? 0 };
    const optimistic = before.upvotes - before.myVote + value;

    setThreads((prev) =>
      prev.map((x) =>
        x.id === thread.id ? { ...x, myVote: value, upvotes: optimistic } : x
      )
    );

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "thread", targetId: thread.id, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "vote");
      setThreads((prev) =>
        prev.map((x) =>
          x.id === thread.id
            ? { ...x, upvotes: data.upvotes, myVote: data.value }
            : x
        )
      );
    } catch (e) {
      setThreads((prev) =>
        prev.map((x) =>
          x.id === thread.id
            ? { ...x, upvotes: before.upvotes, myVote: before.myVote }
            : x
        )
      );
      toast.error(e instanceof Error && e.message ? e.message : t("common.error"));
    }
  };

  /* ---------------------------------------------------------------- */
  /* Publication                                                       */
  /* ---------------------------------------------------------------- */

  const handleCreate = async (data: NewThreadData) => {
    if (!user) {
      askSignIn("register");
      return;
    }
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || t("common.error"));
        return;
      }
      toast.success(t("forum.thread_created"));
      setCreateOpen(false);
      navigate("forum", result.thread.slug);
    } catch {
      toast.error(t("common.network_error"));
    }
  };

  const openCreate = () => (user ? setCreateOpen(true) : askSignIn("register"));

  /* ---------------------------------------------------------------- */

  const statsRows = [
    { label: t("stats.devs"), value: stats?.users },
    { label: t("stats.threads"), value: stats?.threads },
    { label: t("stats.jobs"), value: stats?.jobs },
    { label: t("stats.countries"), value: stats?.countries },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------------------------------------------------- */}
        {/* Fil                                                         */}
        {/* ---------------------------------------------------------- */}
        <div className="min-w-0">
          {/* Hero — visiteurs non connectés. Copie i18n existante (hero.*),
              accent de marque, fond pointillé « terminal ». Un seul message
              clé, un CTA principal, un secondaire. */}
          {!user && (
            <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative p-6 sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
                />
                <div className="relative">
                  <p className="eyebrow mb-2 flex items-center gap-1.5">
                    <span className="text-brand">$</span> {t("hero.eyebrow")}
                  </p>
                  <h1 className="display text-2xl text-balance sm:text-3xl">
                    {t("hero.title")}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                    {t("hero.subtitle")}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button onClick={() => askSignIn("register")}>
                      {t("hero.cta.join")}
                      <ArrowRight
                        className="h-4 w-4 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                    </Button>
                    <Button variant="outline" onClick={() => navigate("annuaire")}>
                      {t("hero.cta.explore")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1"
              role="group"
              aria-label={t("feed.sort_label")}
            >
              {sortOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={sort === o.value}
                  aria-label={t(o.labelKey)}
                  title={t(o.labelKey)}
                  onClick={() => setSort(o.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                    sort === o.value
                      ? "bg-brand/10 text-brand shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <o.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {/* Libellés masqués sous `sm` : les 5 onglets tiennent
                      alors sur un écran de 390 px, icônes seules. */}
                  <span className="hidden sm:inline">{t(o.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Échéance — n'apparaît que sur `Populaires`, comme sur Reddit. */}
            {sort === "top" && (
              <Select
                value={timeWindow}
                onValueChange={(v) => setTimeWindow(v as TimeWindow)}
              >
                <SelectTrigger
                  className="h-9 w-[168px] text-xs"
                  aria-label={t("feed.time.label")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {t(timeLabels[w])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <button
              type="button"
              aria-pressed={unsolved}
              onClick={() => setUnsolved((v) => !v)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
                unsolved
                  ? "border-brand bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("feed.filter.unsolved")}
            </button>

            <div className="relative min-w-0 flex-1 sm:ms-auto sm:max-w-64">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label={t("common.search")}
                placeholder={t("nav.search")}
                className="h-9 ps-8 text-sm"
              />
            </div>

            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("feed.compose")}
            </Button>
          </div>

          {error && !pending ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">{t("common.error")}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => load("reset")}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("feed.retry")}
              </Button>
            </Card>
          ) : pending ? (
            <div className="space-y-3" role="status" aria-busy="true">
              <span className="sr-only">{t("common.loading")}</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <Sparkles
                className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">
                {q ? t("forum.empty") : t("feed.empty")}
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("feed.compose")}
              </Button>
            </Card>
          ) : visible.length === 0 ? (
            /* Tout a été masqué : on le dit et on propose de revenir en
               arrière, plutôt que de laisser un fil vide sans explication. */
            <Card className="p-10 text-center border-dashed">
              <EyeOff
                className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">{t("feed.all_hidden")}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={restoreAll}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t("feed.show_hidden")}
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {visible.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    onOpen={(th) => navigate("forum", th.slug)}
                    onVote={handleVote}
                  />
                ))}
              </div>

              <div className="mt-5 flex justify-center">
                {hasMore ? (
                  <Button
                    variant="outline"
                    disabled={loadingMore}
                    onClick={() => {
                      setLoadingMore(true);
                      load("more");
                    }}
                  >
                    {loadingMore && (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {t("feed.more")}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("feed.no_more")}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Colonne de droite                                           */}
        {/* ---------------------------------------------------------- */}
        <aside className="space-y-4" aria-label={t("feed.sidebar_label")}>
          {!user && (
            <Card className="p-5">
              <h2 className="text-lg font-bold">{t("cta.title")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("cta.subtitle")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={() => askSignIn("register")} className="w-full">
                  {t("cta.button")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("annuaire")}
                >
                  {t("hero.cta.explore")}
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {t("feed.sidebar_stats")}
            </h2>
            <dl className="grid grid-cols-2 gap-3">
              {statsRows.map((r) => (
                <div key={r.label}>
                  <dt className="text-xs text-muted-foreground">{r.label}</dt>
                  <dd className="font-mono text-xl font-bold tabular-nums">
                    {r.value === undefined ? "—" : r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {t("feed.sidebar_explore")}
            </h2>
            <ul className="space-y-1">
              {modules.map(({ section, labelKey, titleKey, Icon }) => (
                <li key={section}>
                  <a
                    href={section === "home" ? "/" : `/${section}`}
                    className="group flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {t(titleKey)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t(labelKey)}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      {/* Composeur */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {t("forum.create.title")}
            </DialogTitle>
          </DialogHeader>
          <CreateThreadForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
