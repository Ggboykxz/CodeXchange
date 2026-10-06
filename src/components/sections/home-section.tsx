"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  MessageSquare,
  Briefcase,
  FolderGit2,
  GraduationCap,
  BookOpen,
  Users,
  Terminal,
  Copy,
  Check,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

type FeaturedDev = {
  id: string;
  username: string;
  headline: string | null;
  country: string | null;
  city: string | null;
  stack: string | null;
  avatarColor: string | null;
  level: string | null;
  user: { id: string; name: string };
};

const modules = [
  {
    section: "forum",
    icon: MessageSquare,
    title: "Forum",
    desc: "Questions, debates, architecture takes. Tech tags, clear categories, voted answers.",
    cmd: "forum",
  },
  {
    section: "jobs",
    icon: Briefcase,
    title: "Jobs",
    desc: "Verified local & remote offers: full-time, freelance, internships. Filter by country, stack, contract type.",
    cmd: "jobs",
  },
  {
    section: "projects",
    icon: FolderGit2,
    title: "Projects",
    desc: "Find tech co-founders, join open-source projects, post your idea to recruit a team.",
    cmd: "projects",
  },
  {
    section: "mentorat",
    icon: GraduationCap,
    title: "Mentorship",
    desc: "Connect with African seniors. Free sessions for local devs. Match by stack and goals.",
    cmd: "mentor",
  },
  {
    section: "tutos",
    icon: BookOpen,
    title: "Tutorials & Events",
    desc: "Tech articles, meetup replays, agenda of African conferences. Learn and participate.",
    cmd: "tutos",
  },
  {
    section: "annuaire",
    icon: Users,
    title: "Directory",
    desc: "Discover devs by country, city, stack, level. To hire, collaborate or just network.",
    cmd: "directory",
  },
];

export function HomeSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const [stats, setStats] = useState<Stats | null>(null);
  const [devs, setDevs] = useState<FeaturedDev[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
    fetch("/api/profiles?limit=3")
      .then((r) => r.json())
      .then((d) => setDevs((d.profiles || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const installCmd = "curl -fsSL https://codexchange.dev/install | bash";

  const copyCmd = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    toast.success(t("common.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const statItems = stats
    ? [
        { label: t("stats.devs"), value: "12,400+" },
        { label: t("stats.threads"), value: stats.threads.toString() },
        { label: t("stats.jobs"), value: stats.jobs.toString() },
        { label: t("stats.projects"), value: stats.projects.toString() },
        { label: t("stats.mentors"), value: stats.mentors.toString() },
        { label: t("stats.countries"), value: "54" },
      ]
    : [];

  return (
    <div>
      {/* HERO — opencode style: split layout, eyebrow + headline + paragraph + install */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("hero.eyebrow")}
              </p>
              <h1 className="display text-4xl sm:text-5xl lg:text-6xl text-balance">
                {t("hero.title")}
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {t("hero.subtitle")}
              </p>

              {/* Install command block — opencode signature */}
              <div className="pt-2">
                <div className="flex items-center gap-1 mb-2">
                  {["curl", "npm", "bun", "brew"].map((m, i) => (
                    <button
                      key={m}
                      className={cn(
                        "px-3 py-1 text-xs font-mono transition-colors",
                        i === 0
                          ? "text-foreground border-b border-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="cmd-block flex items-center justify-between gap-3">
                  <code className="text-sm text-muted-foreground truncate">
                    <span className="text-foreground">{installCmd}</span>
                  </code>
                  <button
                    onClick={copyCmd}
                    className="text-muted-foreground hover:text-foreground transition shrink-0"
                    aria-label={t("common.copy")}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                {t("hero.tagline")}
              </p>
            </div>

            {/* Side column — quick stats + featured devs */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("modules.eyebrow")}
                </p>
                {devs.length > 0 ? (
                  devs.map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => navigate("annuaire", dev.username)}
                      className="block w-full text-left group"
                    >
                      <div className="flex items-center gap-3 py-2 border-b border-border group-hover:border-foreground/30 transition-colors">
                        <Avatar
                          name={dev.user.name}
                          color={dev.avatarColor}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-foreground text-foreground">
                            {dev.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {dev.headline}
                          </p>
                          {dev.country && (
                            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {dev.city}, {dev.country}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </button>
                  ))
                ) : (
                  [0, 1, 2].map((i) => (
                    <div key={i} className="h-14 bg-muted/30 animate-pulse rounded" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      {stats && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {statItems.map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl lg:text-3xl font-bold font-mono">
                    {stat.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MISSION — opencode style: two-col layout with eyebrow labels */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("mission.eyebrow")}
              </p>
            </div>
            <div className="lg:col-span-9 space-y-4">
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-balance">
                {t("mission.title")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                {t("mission.body")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border">
            {[
              {
                title: t("mission.p1.title"),
                body: t("mission.p1.body"),
                num: "01",
              },
              {
                title: t("mission.p2.title"),
                body: t("mission.p2.body"),
                num: "02",
              },
              {
                title: t("mission.p3.title"),
                body: t("mission.p3.body"),
                num: "03",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.num}
                  </span>
                  <h3 className="text-base font-bold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES — opencode style: list with big numbers, no cards */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            <div className="lg:col-span-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("modules.eyebrow")}
              </p>
            </div>
            <div className="lg:col-span-9 space-y-4">
              <h2 className="text-2xl lg:text-4xl font-bold tracking-tight">
                {t("modules.title")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                {t("modules.subtitle")}
              </p>
            </div>
          </div>

          <div className="border-t border-border">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.section}
                  onClick={() => navigate(m.section)}
                  className="block w-full text-left group border-b border-border py-6 hover:bg-muted/30 transition-colors -mx-4 px-4 lg:-mx-6 lg:px-6"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-xs text-muted-foreground font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="col-span-1">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="col-span-7 lg:col-span-7">
                      <h3 className="text-lg lg:text-xl font-bold tracking-tight group-hover:underline">
                        {m.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        {m.desc}
                      </p>
                    </div>
                    <div className="col-span-3 lg:col-span-3 text-right">
                      <code className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                        /{m.cmd}
                      </code>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — opencode style: minimal, terminal-like */}
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="border border-border rounded-lg p-8 lg:p-12">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                ready?
              </p>
            </div>
            <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-balance mb-4 max-w-2xl">
              {t("cta.title")}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-6">
              {t("cta.subtitle")}
            </p>
            <div className="flex items-center gap-2">
              <code className="cmd-block inline-flex items-center text-sm">
                <span className="text-muted-foreground">$</span>{" "}
                <span className="text-foreground ml-1">codexchange join</span>
                <span className="cursor-blink ml-1 text-foreground">▊</span>
              </code>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 ml-2"
                onClick={() => navigate("annuaire")}
              >
                {t("cta.button")}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
