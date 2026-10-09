"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { Avatar } from "@/components/shared/avatar";
import { Tag, tagColors } from "@/components/shared/tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Quote,
  Send,
  Star,
  Target,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mentor = {
  id: string;
  expertise: string;
  bio: string;
  languages: string | null;
  hourlyRate: string | null;
  capacity: number;
  slotsTaken: number;
  rating: number;
  reviews: number;
  user: {
    id: string;
    name: string;
    profile: {
      username: string;
      headline: string | null;
      country: string | null;
      city: string | null;
      avatarColor: string | null;
    } | null;
  };
};

type MentorshipRow = {
  id: string;
  status: string;
  message: string;
  goal: string | null;
  createdAt: string;
  mentor: { id: string; name: string; profile: { username: string; avatarColor: string | null } | null };
  mentee: { id: string; name: string; profile: { username: string; avatarColor: string | null } | null };
};

const testimonials = [
  {
    name: "Aminata S.",
    country: "Burkina Faso",
    text: "Mon mentor m'a aidée à structurer mon portfolio et à décrocher mon premier poste frontend. 3 sessions, et tout a changé.",
    mentor: "Aïcha D.",
  },
  {
    name: "Sam K.",
    country: "Cameroun",
    text: "Le mentorat sur Go m'a fait passer de 'je copie-colle des tutos' à 'je conçois mes propres services'. Inestimable.",
    mentor: "Kwame M.",
  },
  {
    name: "Léa M.",
    country: "Gabon",
    text: "Pour une fois, des conseils de senior qui viennent d'Afrique et qui comprennent le contexte. CodeXchange a changé ma carrière.",
    mentor: "Jean-Pierre M.",
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  accepted: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  declined: "border-border bg-muted text-muted-foreground",
  completed: "border-border bg-muted text-muted-foreground",
};

/**
 * Icône de statut : la couleur n'est jamais le seul indice (WCAG 1.4.1),
 * chaque pastille porte donc aussi son glyphe.
 */
const STATUS_ICONS: Partial<Record<string, typeof Clock>> = {
  pending: Clock,
  accepted: CheckCircle2,
  declined: XCircle,
  completed: CheckCircle2,
};

/** Code de hub terminal (`LOS`, `NBO`…) déduit de la ville réelle. */
const hubCode = (hub: string) => {
  const city = hub.split("/")[0] ?? "";
  return (city.replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 3) || "SSA").toUpperCase();
};

/** Point de pulsation « vivant » — même marque que sur le fil d'accueil. */
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

/** Carte d'une demande : statut net, action disponible selon le rôle, et
 *  visio Jitsi intégrée (CSP l'autorise, le mentor et le mentee parlent
 *  depuis la même salle sans quitter CodeXchange). */
function MentorshipCard({
  m,
  role,
  acting,
  showVisio,
  setShowVisio,
  onAct,
  t,
}: {
  m: MentorshipRow;
  role: "mentor" | "mentee";
  acting: string | null;
  showVisio: string | null;
  setShowVisio: (id: string | null) => void;
  onAct: (id: string, action: "accept" | "decline" | "complete") => void;
  t: (key: string) => string;
}) {
  const other = role === "mentor" ? m.mentee : m.mentor;
  const visioUrl = `https://meet.jit.si/CodeXchange-${m.id.replace(/[^a-z0-9]/gi, "")}`;
  const inMeeting = m.status === "accepted" || m.status === "active";
  const StatusIcon = STATUS_ICONS[m.status] ?? Clock;
  return (
    <Card className="card-interactive gap-0 p-4">
      {/* En-tête : identité, statut, sens de la demande. */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            name={other.name}
            color={other.profile?.avatarColor ?? undefined}
            size="sm"
          />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold",
                  STATUS_COLORS[m.status] ?? STATUS_COLORS.completed
                )}
              >
                <StatusIcon className="h-3 w-3" aria-hidden="true" />
                {t(`mentorat.status.${m.status}`)}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                id: {m.id.slice(0, 8)}
              </span>
            </div>
            <h4 className="truncate text-sm font-bold leading-tight">
              {other.name}
            </h4>
            {other.profile?.username && (
              <p className="font-mono text-[11px] text-muted-foreground">
                @{other.profile.username}
              </p>
            )}
          </div>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {role === "mentor"
            ? t("mentorat.requests_incoming")
            : t("mentorat.requests_sent")}
        </p>
      </div>

      {/* Message — bloc « diff » : filet de marque à gauche, comme l'agenda
          d'une session dans le terminal. */}
      <div className="my-3 border-s-2 border-brand bg-muted/40 px-3 py-2">
        <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// MESSAGE"}
        </span>
        <p className="line-clamp-3 font-mono text-xs leading-relaxed text-foreground text-pretty">
          {m.message}
        </p>
      </div>

      {m.goal && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Target className="h-3 w-3 shrink-0 text-brand" aria-hidden="true" />
          {m.goal}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {role === "mentor" && m.status === "pending" && (
          <>
            <Button
              size="sm"
              disabled={acting === m.id}
              onClick={() => onAct(m.id, "accept")}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {acting === m.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t("mentorat.accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={acting === m.id}
              onClick={() => onAct(m.id, "decline")}
            >
              {acting === m.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t("mentorat.decline")}
            </Button>
          </>
        )}
        {inMeeting && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={acting === m.id}
              onClick={() => onAct(m.id, "complete")}
            >
              {acting === m.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t("mentorat.complete")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVisio(showVisio === m.id ? null : m.id)}
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              {showVisio === m.id ? t("mentorat.hide_visio") : t("mentorat.join_visio")}
            </Button>
          </>
        )}
      </div>

      {showVisio === m.id && (
        <iframe
          src={visioUrl}
          allow="camera; microphone; fullscreen"
          title={`Visio — ${other.name}`}
          className="mt-3 h-72 w-full rounded border border-border"
        />
      )}
    </Card>
  );
}

export function MentoratSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestGoal, setRequestGoal] = useState("");
  const [sending, setSending] = useState(false);
  // H5/H6 — inbox du mentor + mes demandes, avec décision et visio.
  const [mentorships, setMentorships] = useState<{ incoming: MentorshipRow[]; mine: MentorshipRow[] } | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showVisio, setShowVisio] = useState<string | null>(null);
  const sectionParam = useAppStore((s) => s.sectionParam);

  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((d) => setMentors(d.mentors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // H4 — depuis le profil public, `#mentorat/<mentorId>` ouvre la modale.
  useEffect(() => {
    if (!sectionParam) return;
    const match = mentors.find((m) => m.id === sectionParam);
    if (match) setSelectedMentor(match);
  }, [sectionParam, mentors]);

  // H5 — charges le mentorats reçus (mentor) et envoyés (mentee).
  // Sans session, la route répond bien par deux listes vides : le bloc
  // se réduit naturellement. À chaque changement d'utilisateur → ré-fetch.
  useEffect(() => {
    fetch("/api/mentorships")
      .then((r) => r.json())
      .then((d) => setMentorships(d))
      .catch(() => setMentorships(null));
  }, [user]);

  /** H5 — action du rôle concerné, rafraîchissement de la liste après. */
  const respond = async (id: string, action: "accept" | "decline" | "complete") => {
    setActing(id);
    try {
      const res = await fetch(`/api/mentorships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data && data.error) || "Erreur");
        return;
      }
      toast.success(
        action === "accept"
          ? t("mentorat.status.accepted")
          : action === "decline"
            ? t("mentorat.status.declined")
            : t("mentorat.status.completed")
      );
      setMentorships(await fetch("/api/mentorships").then((r) => r.json()).catch(() => null));
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setActing(null);
    }
  };

  const handleRequest = async () => {
    if (!user) {
      toast.error(t("mentorat.sign_in"));
      return;
    }
    if (!selectedMentor || !requestMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mentors/${selectedMentor.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: requestMessage,
          goal: requestGoal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(t("mentorat.request_sent"));
      setSelectedMentor(null);
      setRequestMessage("");
      setRequestGoal("");
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setSending(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Agrégats — lus dans les données réelles, jamais codés en dur.    */
  /* ---------------------------------------------------------------- */

  const scrollTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  const incoming = mentorships?.incoming ?? [];
  const mine = mentorships?.mine ?? [];
  const rows = [...incoming, ...mine];

  const activeCount = rows.filter(
    (r) => r.status === "accepted" || r.status === "active"
  ).length;
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const completedCount = rows.filter((r) => r.status === "completed").length;

  const openMentors = mentors.filter((m) => m.capacity - m.slotsTaken > 0).length;
  const openSlots = mentors.reduce(
    (sum, m) => sum + Math.max(0, m.capacity - m.slotsTaken),
    0
  );
  const totalReviews = mentors.reduce((sum, m) => sum + m.reviews, 0);
  const avgRating = mentors.length
    ? mentors.reduce((sum, m) => sum + m.rating, 0) / mentors.length
    : 0;
  const countries = new Set(
    mentors.map((m) => m.user.profile?.country).filter(Boolean)
  ).size;
  const languages = [
    ...new Set(
      mentors.flatMap((m) =>
        (m.languages ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ),
  ].sort((a, b) => a.localeCompare(b));

  /** Piles les plus représentées dans les expertises déclarées. */
  const stackCounts = new Map<string, number>();
  for (const m of mentors) {
    for (const s of m.expertise
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)) {
      stackCounts.set(s, (stackCounts.get(s) ?? 0) + 1);
    }
  }
  const topStacks = [...stackCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  /** Hubs `ville / pays` les mieux représentés — ligne `PEERING`. */
  const hubCounts = new Map<string, number>();
  for (const m of mentors) {
    const p = m.user.profile;
    if (!p) continue;
    const hub = [p.city, p.country].filter(Boolean).join(" / ");
    if (hub) hubCounts.set(hub, (hubCounts.get(hub) ?? 0) + 1);
  }
  const topHubs = [...hubCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);

  /** Navigation interne — liens de la colonne de droite. */
  const jumpLinks: {
    id: string;
    label: string;
    Icon: typeof GraduationCap;
    show: boolean;
  }[] = [
    {
      id: "my-mentorships",
      label: t("mentorat.my_mentorships"),
      Icon: Users,
      show: Boolean(user) && rows.length > 0,
    },
    {
      id: "find-a-mentor",
      label: t("mentorat.request"),
      Icon: GraduationCap,
      show: true,
    },
    {
      id: "testimonials",
      label: t("mentorat.testimonials.title"),
      Icon: Quote,
      show: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ---------------------------------------------------------- */}
      {/* Hero — matrice de points, accent de marque, un CTA         */}
      {/* ---------------------------------------------------------- */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div className="relative">
            {/* Chrome du terminal : prompt, états réels des sessions,
                voyant « vivant » et hubs les mieux représentés. */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 font-mono text-xs text-muted-foreground">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <LiveDot />
                <span className="font-bold text-brand">$</span>
                <span className="truncate">codexchange.dev/mentorat</span>
                <span className="hidden sm:inline">--mode=all</span>
                {user && mentorships && (
                  <span className="border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    [ ACTIVE: {activeCount}{" //"}{" "}
                    <span className="text-brand">PENDING: {pendingCount}</span>{" "}
                    {"// COMPLETED: "}
                    {completedCount} ]
                  </span>
                )}
              </div>
              {topHubs.length > 0 && (
                <p className="hidden text-[10px] uppercase tracking-wider md:block">
                  PEERING:{" "}
                  {topHubs.map(([hub, n], i) => (
                    <span key={hub}>
                      {i > 0 ? " | " : ""}
                      <span className="font-bold text-brand">
                        {hubCode(hub)}-{n}
                      </span>
                    </span>
                  ))}
                </p>
              )}
            </div>

            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <span className="text-brand">$</span> {t("nav.mentorat")}
            </p>
            <h1 className="display text-2xl text-balance sm:text-3xl">
              {t("mentorat.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {t("mentorat.subtitle")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate("annuaire")}>
                {t("hero.cta.explore")}
                <ArrowRight
                  className="h-4 w-4 rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollTo("find-a-mentor")}
              >
                {t("mentorat.request")}
              </Button>
            </div>
            {topStacks.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
                <span className="me-1 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  STACK:
                </span>
                {topStacks.map(([s, n]) => (
                  <Tag
                    key={s}
                    label={`#${s} · ${n}`}
                    variant={tagColors[s] || "outline"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* -------------------------------------------------------- */}
        {/* Colonne principale                                       */}
        {/* -------------------------------------------------------- */}
        <div className="min-w-0 space-y-8">
          {/* ---- Mes mentorats : décider, suivre, visio ---- */}
          {user &&
            mentorships &&
            (incoming.length > 0 || mine.length > 0) && (
              <section
                id="my-mentorships"
                aria-label={t("mentorat.my_mentorships")}
                className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* En-tête de buffer : compteurs réels des sessions. */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span className="text-brand">#</span>
                    {t("mentorat.my_mentorships")}
                  </h2>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    [ ACTIVE: {activeCount}{" //"}{" "}
                    <span className="font-bold text-brand">
                      PENDING: {pendingCount}
                    </span>{" "}
                    {"// COMPLETED: "}
                    {completedCount} ]
                  </p>
                </div>

                <div className="space-y-5 p-4">
                  {incoming.length > 0 && (
                    <section aria-label={t("mentorat.requests_incoming")}>
                      <h3 className="eyebrow mb-2">
                        {t("mentorat.requests_incoming")}{" "}
                        <span className="font-mono text-brand">
                          ({incoming.length})
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {incoming.map((m) => (
                          <MentorshipCard
                            key={`in-${m.id}`}
                            m={m}
                            role="mentor"
                            acting={acting}
                            showVisio={showVisio}
                            setShowVisio={setShowVisio}
                            onAct={respond}
                            t={t}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                  {mine.length > 0 && (
                    <section aria-label={t("mentorat.requests_sent")}>
                      <h3 className="eyebrow mb-2">
                        {t("mentorat.requests_sent")}{" "}
                        <span className="font-mono text-brand">({mine.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {mine.map((m) => (
                          <MentorshipCard
                            key={`out-${m.id}`}
                            m={m}
                            role="mentee"
                            acting={acting}
                            showVisio={showVisio}
                            setShowVisio={setShowVisio}
                            onAct={respond}
                            t={t}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </section>
            )}

          {/* ---- Find a mentor ---- */}
          <section id="find-a-mentor" className="scroll-mt-20">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-brand">#</span>
                <h2 className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
                  <Users
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {t("mentorat.title")}
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  [ {openMentors}/{mentors.length} {t("common.results")} ]
                </span>
              </div>
              {!loading && mentors.length > 0 && (
                <p className="hidden font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:block">
                  {t("mentorat.capacity")}: {openSlots}
                </p>
              )}
            </div>

            {loading ? (
              <div
                className="grid grid-cols-1 gap-4 xl:grid-cols-2"
                role="status"
                aria-busy="true"
              >
                <span className="sr-only">{t("common.loading")}</span>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse rounded-xl border border-border bg-muted"
                  />
                ))}
              </div>
            ) : mentors.length === 0 ? (
              <Card className="border-dashed p-10 text-center">
                <GraduationCap
                  className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground">{t("feed.empty")}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {mentors.map((m) => {
                  const slotsLeft = m.capacity - m.slotsTaken;
                  const full = slotsLeft <= 0;
                  const hub = [m.user.profile?.city, m.user.profile?.country]
                    .filter(Boolean)
                    .join(" / ");
                  return (
                    <article key={m.id} className="rise-in">
                      <Card className="card-interactive gap-0 p-4">
                        {/* Identité + tarif */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <Avatar
                              name={m.user.name}
                              color={m.user.profile?.avatarColor}
                              size="lg"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold leading-tight">
                                  {m.user.name}
                                </h3>
                                {m.user.profile?.username && (
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    @{m.user.profile.username}
                                  </span>
                                )}
                              </div>
                              {m.user.profile?.headline && (
                                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground text-pretty">
                                  {m.user.profile.headline}
                                </p>
                              )}
                              {hub && (
                                <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                  <MapPin
                                    className="h-3 w-3 shrink-0"
                                    aria-hidden="true"
                                  />
                                  [HUB: {hub.toUpperCase()}]
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="flex items-center gap-0.5 font-mono font-bold text-brand">
                                  <Star
                                    className="h-3 w-3 fill-brand"
                                    aria-hidden="true"
                                  />
                                  {m.rating.toFixed(2)}
                                </span>
                                <span className="text-muted-foreground">
                                  ({m.reviews} {t("mentorat.reviews")})
                                </span>
                                {m.languages && (
                                  <>
                                    <span
                                      className="text-muted-foreground/50"
                                      aria-hidden="true"
                                    >
                                      |
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Globe
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                      />
                                      {t("mentorat.languages")}: {m.languages}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-start sm:text-end">
                            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              {t("mentorat.rate")}
                            </span>
                            <span className="font-mono text-base font-bold tabular-nums text-brand">
                              {m.hourlyRate || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Bio */}
                        {m.bio && (
                          <p className="line-clamp-2 py-3 text-sm text-muted-foreground text-pretty">
                            {m.bio}
                          </p>
                        )}

                        {/* Expertises + disponibilité */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                          <div className="flex flex-wrap gap-1">
                            {m.expertise
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .slice(0, 5)
                              .map((s) => (
                                <Tag
                                  key={s}
                                  label={`#${s}`}
                                  variant={tagColors[s] || "outline"}
                                />
                              ))}
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 font-mono text-[11px] font-bold",
                              full
                                ? "text-muted-foreground"
                                : "text-emerald-700 dark:text-emerald-400"
                            )}
                          >
                            {full ? (
                              <Clock className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <LiveDot className="h-1.5 w-1.5" />
                            )}
                            [ {slotsLeft}/{m.capacity} {t("mentorat.capacity")} ]
                          </span>
                        </div>

                        {/* CTA */}
                        <div className="border-t border-border pt-3">
                          <Button
                            onClick={() => {
                              if (!user) {
                                toast.error(t("mentorat.sign_in"));
                                return;
                              }
                              setSelectedMentor(m);
                            }}
                            disabled={full}
                            className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto"
                            variant="default"
                          >
                            {t("mentorat.request")}
                          </Button>
                        </div>
                      </Card>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* -------------------------------------------------------- */}
        {/* Colonne de droite                                        */}
        {/* -------------------------------------------------------- */}
        <aside className="space-y-4" aria-label={t("mentorat.title")}>
          {/* Télémétrie — chaque nombre vient des données chargées. */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <span className="text-brand">&gt;&gt;</span>
                {t("mentorat.title")}
              </h2>
              <span className="inline-flex items-center gap-1 border border-emerald-600/40 bg-emerald-600/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <LiveDot className="h-1.5 w-1.5" />
                LIVE
              </span>
            </div>
            <dl className="space-y-2 p-4 font-mono text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted-foreground">{t("stats.mentors")}</dt>
                <dd className="font-bold tabular-nums">{mentors.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted-foreground">
                  {t("stats.countries")}
                </dt>
                <dd className="font-bold tabular-nums">{countries}</dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted-foreground">avg rating</dt>
                <dd className="flex items-center gap-0.5 font-bold tabular-nums text-brand">
                  <Star className="h-3 w-3 fill-brand" aria-hidden="true" />
                  {avgRating.toFixed(2)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <dt className="text-muted-foreground">{t("mentorat.reviews")}</dt>
                <dd className="font-bold tabular-nums">{totalReviews}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">
                  {t("mentorat.capacity")}
                </dt>
                <dd className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {openSlots}
                </dd>
              </div>
              {topStacks.length > 0 && (
                <div className="border-t border-border pt-2">
                  <dt className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("feed.tech_stack")}
                  </dt>
                  <dd className="space-y-1">
                    {topStacks.map(([s, n]) => (
                      <div
                        key={s}
                        className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1"
                      >
                        <span className="text-foreground">#{s}</span>
                        <span className="font-bold tabular-nums text-muted-foreground">
                          {n}
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Langues déclarées par les mentors affichés. */}
          {languages.length > 0 && (
            <Card className="gap-0 overflow-hidden p-0">
              <div className="border-b border-border bg-muted/50 px-4 py-2">
                <h2 className="flex items-center gap-1.5 text-sm font-bold">
                  <Globe
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {t("mentorat.languages")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5 p-4">
                {languages.slice(0, 12).map((l) => (
                  <Tag key={l} label={l} variant="outline" />
                ))}
              </div>
            </Card>
          )}

          {/* Navigation interne de la page. */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="border-b border-border bg-muted/50 px-4 py-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <span className="text-brand">&gt;&gt;</span>
                {t("feed.sidebar_explore")}
              </h2>
            </div>
            <ul className="space-y-1 p-2">
              {jumpLinks
                .filter((item) => item.show)
                .map(({ id, label, Icon }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(id)}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-brand"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </Card>
        </aside>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Témoignages                                                */}
      {/* ---------------------------------------------------------- */}
      <div id="testimonials" className="mt-12 scroll-mt-20 border-t border-border pt-10">
        <SectionHeader
          eyebrow={t("nav.mentorat")}
          title={t("mentorat.testimonials.title")}
          subtitle={t("mentorat.testimonials.subtitle")}
          className="mb-8"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((tst, i) => (
            <Card key={i} className="card-interactive gap-0 p-5">
              <Quote className="mb-3 h-5 w-5 text-brand" aria-hidden="true" />
              <p className="mb-4 flex-1 border-s-2 border-brand ps-3 font-mono text-sm italic leading-relaxed text-foreground/90 text-pretty">
                « {tst.text} »
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{tst.name}</strong>
                  <span className="text-muted-foreground/70"> · {tst.country}</span>
                </span>
                <span className="font-mono">mentor: {tst.mentor}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Modale de demande de mentorat                             */}
      {/* ---------------------------------------------------------- */}
      <Dialog open={!!selectedMentor} onOpenChange={(o) => !o && setSelectedMentor(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedMentor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <GraduationCap
                    className="h-5 w-5 text-brand"
                    aria-hidden="true"
                  />
                  {t("mentorat.request")}
                </DialogTitle>
                <DialogDescription className="text-pretty">
                  <span className="font-bold text-foreground">
                    {selectedMentor.user.name}
                  </span>
                  {selectedMentor.user.profile?.headline &&
                    ` — ${selectedMentor.user.profile.headline}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label
                    className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
                    htmlFor="mentorat-goal"
                  >
                    GOAL
                  </Label>
                  <Input
                    id="mentorat-goal"
                    value={requestGoal}
                    onChange={(e) => setRequestGoal(e.target.value)}
                    placeholder={t("mentorat.goal.placeholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
                    htmlFor="mentorat-message"
                  >
                    MESSAGE
                  </Label>
                  <Textarea
                    id="mentorat-message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder={t("mentorat.message.placeholder")}
                    rows={5}
                    className="mt-1 resize-y"
                  />
                </div>
                <Button
                  onClick={handleRequest}
                  disabled={!requestMessage.trim() || sending}
                  className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t("mentorat.send")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
