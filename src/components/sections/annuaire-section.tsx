"use client";

import { AFRICAN_COUNTRIES } from "@/lib/countries";
import {
  badgeKey,
  computeBadges,
  reputationLevel,
  type BadgeId,
  type BadgeStats,
} from "@/lib/badges";
import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/shared/payment-dialog";
import { Tag } from "@/components/shared/tag";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Users,
  ArrowLeft,
  Github,
  Twitter,
  Globe,
  Star,
  MessageSquare,
  FolderGit2,
  BookOpen,
  Briefcase,
  Loader2,
  Pencil,
  BadgeCheck,
  Trophy,
} from "lucide-react";

type Profile = {
  id: string;
  username: string;
  headline: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  stack: string | null;
  level: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  website: string | null;
  available: boolean;
  avatarColor: string | null;
  userId: string;
  user: { id: string; name: string };
};

/** F5 — emojis des badges (thème-safe, pas de couleurs codées en dur). */
const BADGE_ICONS: Record<BadgeId, string> = {
  question: "💬",
  reponse: "✍️",
  acceptee: "✅",
  plume: "📝",
  mentor: "🎓",
};

/** Ligne du classement (`GET /api/leaderboard`). */
type LeaderRow = {
  id: string;
  name: string;
  reputation: number;
  profile: { username: string; avatarColor: string | null; level: string | null } | null;
};

type ProfileDetail = Profile & {
  user: {
    id: string;
    name: string;
    reputation: number;
    emailVerifiedAt: string | null;
    threads: Array<{
      id: string;
      title: string;
      slug: string;
      upvotes: number;
      createdAt: string;
    }>;
    projects: Array<{
      id: string;
      name: string;
      slug: string;
      stars: number;
      cover: string | null;
    }>;
    tutorials: Array<{
      id: string;
      title: string;
      slug: string;
      coverEmoji: string;
      readTime: number;
    }>;
    mentorProfile?: {
      id: string;
      expertise: string;
      hourlyRate: string | null;
      rating: number;
    } | null;
  };
};

// Liste partagée avec le formulaire d'inscription (`lib/countries.ts`) :
// 10 entrées en dur pour 21 pays au seed rendaient la moitié du continent
// inatteignable par le filtre. Le `all` n'existe que dans ce sélecteur.
// TODO : servir par un `SELECT DISTINCT country` via /api/profiles le jour
// où les pays viendront d'exports ou de comptes réels.
const countries: readonly string[] = ["all", ...AFRICAN_COUNTRIES];

const levels = ["all", "junior", "mid", "senior", "lead"];
const stacks = ["all", "React", "TypeScript", "Go", "Python", "Flutter", "Rust", "Django", "Angular"];

export function AnnuaireSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const sectionParam = useAppStore((s) => s.sectionParam);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [stack, setStack] = useState("all");
  const [level, setLevel] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  // Profile detail is cached by username so view state is derived, not
  // mutated from an effect.
  const [detail, setDetail] = useState<{
    username: string;
    profile: ProfileDetail | null;
    stats: BadgeStats | null;
  } | null>(null);
  // F5 — classement des contributeurs (top 10 par réputation réelle).
  const [top, setTop] = useState<LeaderRow[]>([]);

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Edition du profil (B4) — formulaire contrôlé, rempli à l'ouverture.
  const [editOpen, setEditOpen] = useState(false);
  // P1 — dialogue paiement mobile money depuis le profil mentor.
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    headline: "",
    bio: "",
    country: "",
    city: "",
    stack: "",
    level: "junior",
    github: "",
    twitter: "",
    linkedin: "",
    website: "",
    available: false,
  });

  const setField = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openEdit = (p: ProfileDetail) => {
    setForm({
      name: p.user.name ?? "",
      headline: p.headline ?? "",
      bio: p.bio ?? "",
      country: p.country ?? "",
      city: p.city ?? "",
      stack: p.stack ?? "",
      level: p.level ?? "junior",
      github: p.github ?? "",
      twitter: p.twitter ?? "",
      linkedin: p.linkedin ?? "",
      website: p.website ?? "",
      available: p.available,
    });
    setEditOpen(true);
  };

  const saveProfile = async (p: ProfileDetail) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          headline: form.headline.trim(),
          bio: form.bio,
          country: form.country.trim() || null,
          city: form.city.trim() || null,
          stack: form.stack,
          level: form.level,
          github: form.github.trim() || null,
          twitter: form.twitter.trim() || null,
          linkedin: form.linkedin.trim() || null,
          website: form.website.trim() || null,
          available: form.available,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || t("common.error"));
        return;
      }
      setDetail((prev) =>
        prev?.profile
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                ...data.profile,
                user: { ...prev.profile.user, name: data.profile.user.name },
              },
            }
          : prev
      );
      if (user && data.user) setUser({ ...user, name: data.user.name });
      toast.success(t("annuaire.profile_saved"));
      setEditOpen(false);
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setSaving(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country !== "all") params.set("country", country);
    if (stack !== "all") params.set("stack", stack);
    if (level !== "all") params.set("level", level);
    if (availableOnly) params.set("available", "true");
    try {
      const res = await fetch(`/api/profiles?${params}`);
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [country, stack, level, availableOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 150);
    return () => clearTimeout(timer);
  }, [load]);

  // Cities based on filtered country
  const cities = Array.from(
    new Set(
      profiles
        .map((p) => p.city)
        .filter((c): c is string => !!c)
    )
  ).sort();

  const selectedProfile =
    sectionParam && detail && detail.username === sectionParam
      ? detail.profile
      : null;
  const loadingProfile =
    !!sectionParam && (!detail || detail.username !== sectionParam);

  // F5 — un seul appel, mis en cache côté état : le classement vit dans la
  // vue liste, il n'a pas besoin d'être refetché à chaque profil ouvert.
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setTop(Array.isArray(d.top) ? d.top : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sectionParam) return;
    if (detail?.username === sectionParam) return;
    let cancelled = false;
    fetch(`/api/profiles/${sectionParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.profile)
          setDetail({
            username: sectionParam,
            profile: d.profile,
            stats: d.stats ?? null,
          });
        else navigate("annuaire");
      })
      .catch(() => {
        if (cancelled) return;
        setDetail({ username: sectionParam, profile: null, stats: null });
      });
    return () => {
      cancelled = true;
    };
  }, [sectionParam, detail, navigate]);

  // PROFILE DETAIL VIEW
  if (sectionParam) {
    if (loadingProfile) {
      return (
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
          aria-busy="true"
        >
          <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-hidden="true" />
        </div>
      );
    }
    if (!selectedProfile) return null;

    const isMe = !!user && selectedProfile.userId === user.id;

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ms-2"
          onClick={() => navigate("annuaire")}
        >
          <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" aria-hidden="true" />
          {t("annuaire.back")}
        </Button>

        {/* Dossier du profil — la même « spotlight » que la barre latérale du
            design : liseré de marque + en-tête de terminal, jamais de fond
            ajouté, tout vit dans les tokens. */}
        <Card className="p-0 mb-6 overflow-hidden border-brand/40">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="text-brand" aria-hidden="true">$</span>
              {t("annuaire.title")}
              <span className="text-muted-foreground/60">::</span>
              <span className="text-foreground break-all">/dev/{selectedProfile.username}</span>
            </span>
            {selectedProfile.available && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t("annuaire.open_to_work")}
              </span>
            )}
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar
                name={selectedProfile.user.name}
                color={selectedProfile.avatarColor}
                size="xl"
                className="rounded-lg border-2 border-brand/40"
              />
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h1 className="display text-2xl lg:text-3xl text-balance">
                    {selectedProfile.user.name}
                  </h1>
                  {isMe && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => openEdit(selectedProfile)}
                    >
                      <Pencil className="h-3.5 w-3.5 me-1" aria-hidden="true" />
                      {t("annuaire.edit_profile")}
                    </Button>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  u/{selectedProfile.username}
                </p>
                {selectedProfile.headline && (
                  <p className="text-base text-muted-foreground mt-2 mb-2 text-pretty">
                    {selectedProfile.headline}
                  </p>
                )}
                {(selectedProfile.city || selectedProfile.country) && (
                  <p className="text-sm font-mono text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                    {[selectedProfile.city, selectedProfile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {selectedProfile.user.emailVerifiedAt && (
                    <span
                      className="inline-flex items-center gap-1 rounded border border-emerald-600/40 bg-emerald-600/10 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:text-emerald-400"
                      title={t("annuaire.verified_hint")}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("annuaire.verified")}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs"
                    title={t("annuaire.reputation_hint")}
                  >
                    <Star className="h-3 w-3 text-chart-2" aria-hidden="true" />
                    <span className="sr-only">{t("annuaire.reputation")} : </span>
                    <span className="font-bold tabular-nums text-brand">
                      {selectedProfile.user.reputation ?? 0}
                    </span>
                    <span className="text-muted-foreground">
                      {t("annuaire.reputation")}
                    </span>
                  </span>
                  {selectedProfile.level && (
                    <Tag label={t(`annuaire.level.${selectedProfile.level}`)} />
                  )}
                  <span
                    className="inline-flex items-center gap-1 rounded border border-foreground/30 bg-foreground/5 px-2 py-0.5 font-mono text-xs font-medium"
                    title={t("annuaire.reputation_hint")}
                  >
                    <Trophy className="h-3 w-3 text-chart-2" aria-hidden="true" />
                    {t(reputationLevel(selectedProfile.user.reputation ?? 0).key)}
                  </span>
                </div>
                {/* F5 — jalons réellement mérités (compteurs servis par l'API). */}
                {detail?.stats && computeBadges(detail.stats).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="eyebrow me-1">
                      {t("annuaire.badges")}
                    </span>
                    {computeBadges(detail.stats).map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-2 py-0.5 text-xs font-mono"
                      >
                        <span aria-hidden="true">{BADGE_ICONS[id]}</span>
                        {t(badgeKey(id))}
                      </span>
                    ))}
                  </div>
                )}
                {selectedProfile.stack && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedProfile.stack
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <Tag key={s} label={`#${s}`} variant="outline" />
                      ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProfile.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://github.com/${selectedProfile.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3.5 w-3.5 me-1" aria-hidden="true" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {selectedProfile.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://twitter.com/${selectedProfile.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-3.5 w-3.5 me-1" aria-hidden="true" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {/^https?:\/\//i.test(selectedProfile.website ?? "") && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedProfile.website ?? ""} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3.5 w-3.5 me-1" aria-hidden="true" />
                        {t("annuaire.site")}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {selectedProfile.bio && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="eyebrow mb-2">{t("annuaire.bio")}</h2>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-pretty">
                  {selectedProfile.bio}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* H4b — un membre avec mentorat profilé peut être sollicité
            directement depuis son profil, sans retour à la section. */}
        {selectedProfile.user.mentorProfile && user && selectedProfile.userId !== user.id && (
          <Card className="p-0 mb-6 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <span className="text-brand" aria-hidden="true">$</span>
                mentorat --request
              </span>
              <Trophy className="h-3.5 w-3.5 text-chart-2" aria-hidden="true" />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-semibold leading-tight">
                  {t("mentorat.title")} · {selectedProfile.user.mentorProfile.expertise}
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {selectedProfile.user.mentorProfile.hourlyRate ?? "—"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className="shrink-0 bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => navigate("mentorat", selectedProfile.user.mentorProfile!.id)}
                >
                  {t("mentorat.request")}
                </Button>
                {selectedProfile.user.mentorProfile.hourlyRate &&
                  selectedProfile.user.mentorProfile.hourlyRate !== "Free" &&
                  selectedProfile.user.mentorProfile.hourlyRate !== "—" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setPayOpen(true)}
                    >
                      {t("payment.pay_session")}
                    </Button>
                  )}
              </div>
            </div>
          </Card>
        )}

        {/* P1 — dialogue paiement mobile money */}
        <PaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          targetId={selectedProfile.user.mentorProfile?.id ?? ""}
          targetLabel={
            selectedProfile.user.mentorProfile
              ? `${t("mentorat.title")} · ${selectedProfile.user.mentorProfile.expertise}`
              : ""
          }
          amount={
            parseInt(
              (selectedProfile.user.mentorProfile?.hourlyRate ?? "0").replace(
                /[^0-9]/g,
                ""
              ),
              10
            ) || 0
          }
          currency={
            (selectedProfile.user.mentorProfile?.hourlyRate ?? "")
              .replace(/[0-9\s,.-]/g, "")
              .trim() || "XOF"
          }
        />

        {/* I2 — démarrer une conversation privée depuis le profil public
            (même geste que le CTA mentorat ci-dessus, indépendant de lui). */}
        {user && selectedProfile.userId !== user.id && (
          <div className="flex justify-end mb-6">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("messages", selectedProfile.userId)}
            >
              <MessageSquare
                className="h-4 w-4 me-1 rtl:-scale-x-100"
                aria-hidden="true"
              />
              {t("annuaire.send_message")}
            </Button>
          </div>
        )}

        {/* Recent activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedProfile.user.threads.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <h3 className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {t("annuaire.recent_threads")}
              </h3>
              <ul className="p-4 space-y-3">
                {selectedProfile.user.threads.map((th) => (
                  <li key={th.id}>
                    <button
                      onClick={() => navigate("forum", th.slug)}
                      className="w-full text-start text-sm hover:text-brand transition-colors line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1 rounded"
                    >
                      {th.title}
                    </button>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" aria-hidden="true" />
                        {th.upvotes}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {selectedProfile.user.projects.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <h3 className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <FolderGit2 className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {t("annuaire.recent_projects")}
              </h3>
              <ul className="p-4 space-y-3">
                {selectedProfile.user.projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{p.cover}</span>
                    <span className="text-sm flex-1 line-clamp-1">{p.name}</span>
                    <span className="text-[10px] font-mono flex items-center gap-0.5 shrink-0 text-muted-foreground">
                      <Star className="h-2.5 w-2.5" aria-hidden="true" />
                      {p.stars}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {selectedProfile.user.tutorials.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <h3 className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {t("annuaire.recent_tutos")}
              </h3>
              <ul className="p-4 space-y-3">
                {selectedProfile.user.tutorials.map((tu) => (
                  <li key={tu.id}>
                    <button
                      onClick={() => navigate("tutos", tu.slug)}
                      className="w-full text-start text-sm hover:text-brand transition-colors line-clamp-2 flex items-start gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                    >
                      <span aria-hidden="true">{tu.coverEmoji}</span>
                      <span className="line-clamp-2">{tu.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Edition du profil (B4) */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("annuaire.edit_profile")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pf-name">{t("auth.name")}</Label>
                <Input
                  id="pf-name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pf-headline">{t("annuaire.headline")}</Label>
                <Input
                  id="pf-headline"
                  value={form.headline}
                  onChange={(e) => setField("headline", e.target.value)}
                  maxLength={140}
                  placeholder="Senior Frontend Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-country">{t("annuaire.country")}</Label>
                <Input
                  id="pf-country"
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-city">{t("annuaire.city")}</Label>
                <Input
                  id="pf-city"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-stack">{t("annuaire.stack")}</Label>
                <Input
                  id="pf-stack"
                  value={form.stack}
                  onChange={(e) => setField("stack", e.target.value)}
                  placeholder="React, Go, PostgreSQL"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-level">{t("annuaire.level")}</Label>
                <Select value={form.level} onValueChange={(v) => setField("level", v)}>
                  <SelectTrigger id="pf-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels
                      .filter((l) => l !== "all")
                      .map((l) => (
                        <SelectItem key={l} value={l}>
                          {t(`annuaire.level.${l}`)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-github">GitHub</Label>
                <Input
                  id="pf-github"
                  value={form.github}
                  onChange={(e) => setField("github", e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-twitter">Twitter / X</Label>
                <Input
                  id="pf-twitter"
                  value={form.twitter}
                  onChange={(e) => setField("twitter", e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-linkedin">LinkedIn</Label>
                <Input
                  id="pf-linkedin"
                  value={form.linkedin}
                  onChange={(e) => setField("linkedin", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-website">{t("annuaire.site")}</Label>
                <Input
                  id="pf-website"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  maxLength={255}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pf-bio">{t("annuaire.bio")}</Label>
                <Textarea
                  id="pf-bio"
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-y"
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pf-available"
                    checked={form.available}
                    onCheckedChange={(v) => setField("available", v)}
                  />
                  <Label htmlFor="pf-available" className="cursor-pointer">
                    {t("annuaire.open_to_work")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setEditOpen(false)}>
                    {t("forum.create.cancel")}
                  </Button>
                  <Button
                    onClick={() => saveProfile(selectedProfile)}
                    disabled={saving || !form.name.trim()}
                  >
                    {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />}
                    {t("annuaire.save")}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Bandeau terminal — la même ligne de commande que le design :
          aucune valeur en dur, uniquement l'état réel des filtres. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-brand" aria-hidden="true">$</span>
          <span className="truncate">
            grep --profiles
            {country !== "all" ? ` --country="${country}"` : ""}
            {city !== "all" ? ` --city="${city}"` : ""}
            {level !== "all" ? ` --level=${level}` : ""}
            {stack !== "all" ? ` --stack=${stack}` : ""}
            {availableOnly ? " --available" : ""}
          </span>
          <span
            className="inline-block h-3 w-1.5 shrink-0 animate-pulse bg-brand/70"
            aria-hidden="true"
          />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {loading ? t("common.loading") : `${profiles.length} ${t("common.results")}`}
        </span>
      </div>

      {/* Hero — visiteurs et membres : un seul message clé, les chiffres du
          registre sont ceux renvoyés par /api/profiles. */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 font-mono text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t("hero.tagline")}
              </div>
              <p className="eyebrow mb-2 flex items-center gap-1.5">
                <span className="text-brand">$</span> {t("nav.annuaire")}
              </p>
              <h1 className="display text-2xl text-balance sm:text-3xl">
                {t("annuaire.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
                {t("annuaire.subtitle")}
              </p>
            </div>
            {/* Télémétrie du registre — 4 chiffres lus dans la réponse
                courante, aucun nombre codé en dur. */}
            <dl className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-72">
              {[
                { label: t("stats.devs"), value: profiles.length },
                {
                  label: t("annuaire.available_only"),
                  value: profiles.filter((p) => p.available).length,
                },
                {
                  label: t("stats.countries"),
                  value: new Set(profiles.map((p) => p.country).filter(Boolean)).size,
                },
                { label: t("annuaire.leaderboard"), value: top.length },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-border bg-background/70 px-3 py-2"
                >
                  <dt className="mb-0.5 text-[10px] uppercase leading-tight tracking-widest text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="font-mono text-xl font-bold tabular-nums text-brand">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <Card className="p-0 mb-6 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            grep --filter
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {profiles.length} {t("common.results")}
          </span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label
                htmlFor="flt-country"
                className="eyebrow mb-1.5 block"
              >
                {t("annuaire.filter.country.all")}
              </Label>
              <Select value={country} onValueChange={(v) => { setCountry(v); setCity("all"); }}>
                <SelectTrigger id="flt-country" className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "all" ? t("annuaire.filter.country.all") : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="flt-city"
                className="eyebrow mb-1.5 block"
              >
                {t("annuaire.filter.city.all")}
              </Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="flt-city" className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("annuaire.filter.city.all")}</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="flt-stack"
                className="eyebrow mb-1.5 block"
              >
                {t("annuaire.filter.stack.all")}
              </Label>
              <Select value={stack} onValueChange={setStack}>
                <SelectTrigger id="flt-stack" className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stacks.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? t("annuaire.filter.stack.all") : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="flt-level"
                className="eyebrow mb-1.5 block"
              >
                {t("annuaire.filter.level.all")}
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="flt-level" className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l === "all"
                        ? t("annuaire.filter.level.all")
                        : t(`annuaire.level.${l}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Switch
              id="available"
              checked={availableOnly}
              onCheckedChange={setAvailableOnly}
            />
            <Label htmlFor="available" className="text-sm font-mono cursor-pointer">
              {t("annuaire.available_only")}
            </Label>
          </div>
        </div>
      </Card>

      {/* F5 — classement : top 10 par réputation réellement cumulée. */}
      {top.length > 0 && (
        <Card className="p-0 mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
            <h2 className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-chart-2" aria-hidden="true" />
              {t("annuaire.leaderboard")}
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              top {top.length}
            </span>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
            {top.map((row, i) => (
              <li key={row.id}>
                <button
                  onClick={() =>
                    row.profile?.username &&
                    navigate("annuaire", row.profile.username)
                  }
                  disabled={!row.profile?.username}
                  className="flex w-full items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-start transition-colors hover:border-brand/40 hover:bg-muted/60 disabled:cursor-default disabled:hover:border-border/60 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                >
                  <span className="font-mono text-xs text-muted-foreground w-6 shrink-0 tabular-nums">
                    #{i + 1}
                  </span>
                  <Avatar
                    name={row.name}
                    color={row.profile?.avatarColor ?? null}
                    size="xs"
                  />
                  <span className="text-sm font-medium truncate flex-1">
                    {row.name}
                  </span>
                  {row.profile?.level && (
                    <Tag
                      label={t(`annuaire.level.${row.profile.level}`)}
                      variant="outline"
                    />
                  )}
                  <span className="font-mono text-xs flex items-center gap-1 shrink-0 text-brand">
                    <Star className="h-3 w-3 text-chart-2" aria-hidden="true" />
                    {row.reputation}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">{t("annuaire.empty")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles
            .filter((p) => city === "all" || p.city === city)
            .map((p) => (
              <article
                key={p.id}
                onClick={() => navigate("annuaire", p.username)}
                className="rise-in group cursor-pointer"
              >
                <Card className="card-interactive flex h-full flex-col p-0 overflow-hidden">
                  {/* En-tête de terminal : identifiant de registre + hub. */}
                  <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                    <span className="truncate">#dev-{p.id.slice(0, 6)}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand" aria-hidden="true" />
                      {[p.city, p.country].filter(Boolean).join(" / ")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar
                        name={p.user.name}
                        color={p.avatarColor}
                        size="lg"
                        className="border-2 border-brand/40"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight">
                          <a
                            href={`/annuaire/${p.username}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigate("annuaire", p.username);
                            }}
                            className="decoration-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1 rounded"
                          >
                            {p.user.name}
                          </a>
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          @{p.username}
                        </p>
                      </div>
                      {p.available && (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          {t("annuaire.open_to_work")}
                        </span>
                      )}
                    </div>

                    {p.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 text-pretty">
                        {p.headline}
                      </p>
                    )}

                    {p.bio && (
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 text-pretty">
                        {p.bio}
                      </p>
                    )}

                    {p.stack && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.stack
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((s) => (
                            <Tag key={s} label={`#${s}`} variant="outline" />
                          ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                      {p.level ? (
                        <Tag label={t(`annuaire.level.${p.level}`)} />
                      ) : (
                        <span />
                      )}
                      <span
                        className="font-mono text-[11px] text-brand underline-offset-4 group-hover:underline"
                        aria-hidden="true"
                      >
                        {t("annuaire.view_profile")}
                      </span>
                    </div>

                    {/* Liens externes — arrêtent la propagation pour ne pas
                        ouvrir le dossier en plus de la cible. */}
                    {(p.github || p.twitter || p.linkedin || /^https?:\/\//i.test(p.website ?? "")) && (
                      <div className="mt-3 flex items-center gap-2">
                        {p.github && (
                          <a
                            href={`https://github.com/${p.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1 text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                            title="GitHub"
                          >
                            <Github className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">GitHub</span>
                          </a>
                        )}
                        {p.twitter && (
                          <a
                            href={`https://twitter.com/${p.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1 text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                            title="Twitter"
                          >
                            <Twitter className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">Twitter</span>
                          </a>
                        )}
                        {/^https?:\/\//i.test(p.website ?? "") && (
                          <a
                            href={p.website ?? ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1 text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                            title={t("annuaire.site")}
                          >
                            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="sr-only">{t("annuaire.site")}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
