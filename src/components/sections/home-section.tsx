"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/shared/section-header";
import { Avatar } from "@/components/shared/avatar";
import { Tag } from "@/components/shared/tag";
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
  Sparkles,
  Quote,
  MapPin,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

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

export function HomeSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const [stats, setStats] = useState<Stats | null>(null);
  const [devs, setDevs] = useState<FeaturedDev[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});

    fetch("/api/profiles?limit=4")
      .then((r) => r.json())
      .then((d) => {
        const sliced = (d.profiles || []).slice(0, 4);
        setDevs(sliced);
      })
      .catch(() => {});
  }, []);

  const modules = [
    {
      section: "forum",
      icon: MessageSquare,
      title: t("modules.forum.title"),
      desc: t("modules.forum.desc"),
      color: "terracotta",
    },
    {
      section: "jobs",
      icon: Briefcase,
      title: t("modules.jobs.title"),
      desc: t("modules.jobs.desc"),
      color: "sun",
    },
    {
      section: "projects",
      icon: FolderGit2,
      title: t("modules.projects.title"),
      desc: t("modules.projects.desc"),
      color: "clay",
    },
    {
      section: "mentorat",
      icon: GraduationCap,
      title: t("modules.mentorat.title"),
      desc: t("modules.mentorat.desc"),
      color: "baobab",
    },
    {
      section: "tutos",
      icon: BookOpen,
      title: t("modules.tutos.title"),
      desc: t("modules.tutos.desc"),
      color: "terracotta",
    },
    {
      section: "annuaire",
      icon: Users,
      title: t("modules.annuaire.title"),
      desc: t("modules.annuaire.desc"),
      color: "sun",
    },
  ];

  const statItems = stats
    ? [
        { label: t("stats.devs"), value: `${Math.max(12000, stats.users * 1000)}+`, suffix: "" },
        { label: t("stats.threads"), value: stats.threads, suffix: "" },
        { label: t("stats.jobs"), value: stats.jobs, suffix: "" },
        { label: t("stats.projects"), value: stats.projects, suffix: "" },
        { label: t("stats.mentors"), value: stats.mentors, suffix: "" },
        { label: t("stats.countries"), value: 54, suffix: "" },
      ]
    : [];

  return (
    <div className="paper-grain">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/10 border border-terracotta/30">
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                <span className="text-xs font-mono uppercase tracking-widest text-terracotta">
                  {t("hero.eyebrow")}
                </span>
              </div>

              <h1 className="display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-balance">
                {t("hero.title")}
              </h1>

              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed text-pretty max-w-2xl">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-terracotta hover:bg-terracotta/90 text-base px-6 h-12"
                  onClick={() => navigate("annuaire")}
                >
                  {t("hero.cta.join")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-6 h-12"
                  onClick={() => navigate("forum")}
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  {t("hero.cta.explore")}
                </Button>
              </div>

              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground pt-4">
                {t("hero.tagline")}
              </p>
            </div>

            {/* Hero visual: featured devs collage */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Decorative editorial number */}
                <div className="absolute -top-8 -left-2 text-9xl font-serif text-terracotta/10 select-none pointer-events-none">
                  01
                </div>

                <div className="relative space-y-3">
                  {devs.length > 0 ? (
                    devs.slice(0, 3).map((dev, i) => (
                      <button
                        key={dev.id}
                        onClick={() => navigate("annuaire", dev.username)}
                        className="w-full text-left group"
                        style={{ marginLeft: i === 1 ? "1.5rem" : i === 2 ? "3rem" : "0" }}
                      >
                        <Card className="p-4 hover:shadow-md transition-shadow border-border/70 group-hover:border-terracotta/50">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={dev.user.name}
                              color={dev.avatarColor}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-semibold text-sm truncate">
                                {dev.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {dev.headline}
                              </p>
                              {dev.country && (
                                <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {dev.city}, {dev.country}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </button>
                    ))
                  ) : (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-20 rounded-lg bg-muted animate-pulse"
                          style={{
                            marginLeft: i === 1 ? "1.5rem" : i === 2 ? "3rem" : "0",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Quote box */}
                <div className="mt-6 p-5 border-l-4 border-terracotta bg-muted/30">
                  <Quote className="h-5 w-5 text-terracotta mb-2" />
                  <p className="font-serif italic text-base lg:text-lg leading-relaxed">
                    «&nbsp;Pendant trop longtemps on a dû chercher ailleurs. Aujourd'hui
                    on construit ici, ensemble.&nbsp;»
                  </p>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-3">
                    — La communauté CodeXchange
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      {stats && (
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {statItems.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-serif text-3xl lg:text-4xl font-bold text-terracotta">
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MISSION */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <SectionHeader
              eyebrow={t("mission.eyebrow")}
              title={t("mission.title")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <Card key={i} className="p-6 border-border/70 hover:border-terracotta/40 transition-colors">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-serif text-3xl font-bold text-terracotta/40">
                    {item.num}
                  </span>
                  <h3 className="font-serif text-xl font-semibold">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="py-16 lg:py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t("modules.eyebrow")}
            title={t("modules.title")}
            subtitle={t("modules.subtitle")}
            className="mb-12"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.section}
                  onClick={() => navigate(m.section)}
                  className="text-left group"
                >
                  <Card className="h-full p-6 border-border/70 hover:border-terracotta/50 hover:shadow-lg transition-all relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 text-9xl font-serif text-terracotta/5 select-none group-hover:text-terracotta/10 transition">
                      {modules.indexOf(m) + 1 < 10 ? "0" : ""}
                      {modules.indexOf(m) + 1}
                    </div>
                    <div className="relative">
                      <div className="h-12 w-12 rounded-lg bg-terracotta/10 border border-terracotta/20 flex items-center justify-center mb-4 group-hover:bg-terracotta group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5 text-terracotta group-hover:text-white" />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold mb-2">
                        {m.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {m.desc}
                      </p>
                      <div className="mt-4 inline-flex items-center text-xs font-mono uppercase tracking-widest text-terracotta opacity-0 group-hover:opacity-100 transition">
                        Explorer
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden bg-ink text-background border-ink">
            <div className="absolute inset-0 opacity-10">
              <div className="kente-divider h-full w-full" />
            </div>
            <div className="relative p-8 lg:p-12 text-center">
              <h2 className="display text-3xl sm:text-4xl lg:text-5xl text-balance">
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-lg text-background/70 max-w-2xl mx-auto">
                {t("cta.subtitle")}
              </p>
              <Button
                size="lg"
                className="mt-8 bg-sun text-ink hover:bg-sun/90 h-12 px-6 text-base"
                onClick={() => {
                  toast.info("Ouvre la modale d'inscription en haut à droite ↗");
                  const trigger = document.querySelector<HTMLElement>("[data-auth-trigger]");
                  if (trigger) trigger.click();
                }}
              >
                {t("cta.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
