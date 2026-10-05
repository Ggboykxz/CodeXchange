"use client";

import { useEffect, useState, useCallback } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/shared/section-header";
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
  user: { id: string; name: string };
};

type ProfileDetail = Profile & {
  user: {
    id: string;
    name: string;
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
  "Burkina Faso",
];

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
  } | null>(null);

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

  useEffect(() => {
    if (!sectionParam) return;
    if (detail?.username === sectionParam) return;
    let cancelled = false;
    fetch(`/api/profiles/${sectionParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.profile) setDetail({ username: sectionParam, profile: d.profile });
        else navigate("annuaire");
      })
      .catch(() => {
        if (cancelled) return;
        setDetail({ username: sectionParam, profile: null });
      });
    return () => {
      cancelled = true;
    };
  }, [sectionParam, detail, navigate]);

  // PROFILE DETAIL VIEW
  if (sectionParam) {
    if (loadingProfile) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      );
    }
    if (!selectedProfile) return null;

    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate("annuaire")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("annuaire.back")}
        </Button>

        <Card className="p-6 lg:p-8 mb-6 paper-grain">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar
              name={selectedProfile.user.name}
              color={selectedProfile.avatarColor}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="font-bold text-3xl lg:text-4xl leading-tight">
                  {selectedProfile.user.name}
                </h1>
                {selectedProfile.available && (
                  <Tag label={t("annuaire.open_to_work")} variant="solid" />
                )}
              </div>
              {selectedProfile.headline && (
                <p className="text-base text-muted-foreground mb-2">
                  {selectedProfile.headline}
                </p>
              )}
              {selectedProfile.country && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedProfile.city}, {selectedProfile.country}
                </p>
              )}
              {selectedProfile.stack && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedProfile.stack
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <Tag key={s} label={s} />
                    ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                {selectedProfile.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://github.com/${selectedProfile.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="h-3.5 w-3.5 mr-1" />
                      GitHub
                    </a>
                  </Button>
                )}
                {selectedProfile.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${selectedProfile.twitter}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-3.5 w-3.5 mr-1" />
                      Twitter
                    </a>
                  </Button>
                )}
                {selectedProfile.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3.5 w-3.5 mr-1" />
                      Site
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {selectedProfile.bio && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Bio
              </h3>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {selectedProfile.bio}
              </p>
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedProfile.user.threads.length > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-foreground mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("annuaire.recent_threads")}
              </h3>
              <ul className="space-y-2">
                {selectedProfile.user.threads.map((th) => (
                  <li key={th.id}>
                    <button
                      onClick={() => navigate("forum", th.slug)}
                      className="text-sm text-left hover:text-foreground transition line-clamp-2"
                    >
                      {th.title}
                    </button>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        {th.upvotes}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {selectedProfile.user.projects.length > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-foreground mb-3 flex items-center gap-1.5">
                <FolderGit2 className="h-3.5 w-3.5" />
                {t("annuaire.recent_projects")}
              </h3>
              <ul className="space-y-2">
                {selectedProfile.user.projects.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="text-lg">{p.cover}</span>
                    <span className="text-sm flex-1 line-clamp-1">{p.name}</span>
                    <span className="text-[10px] font-mono flex items-center gap-0.5 text-muted-foreground">
                      <Star className="h-2.5 w-2.5" />
                      {p.stars}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {selectedProfile.user.tutorials.length > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-foreground mb-3 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {t("annuaire.recent_tutos")}
              </h3>
              <ul className="space-y-2">
                {selectedProfile.user.tutorials.map((tu) => (
                  <li key={tu.id}>
                    <button
                      onClick={() => navigate("tutos", tu.slug)}
                      className="text-sm text-left hover:text-foreground transition line-clamp-2 flex items-start gap-1.5"
                    >
                      <span>{tu.coverEmoji}</span>
                      <span className="line-clamp-2">{tu.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.annuaire")}
        title={t("annuaire.title")}
        subtitle={t("annuaire.subtitle")}
        className="mb-8"
      />

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("annuaire.filter.country.all")}
            </Label>
            <Select value={country} onValueChange={(v) => { setCountry(v); setCity("all"); }}>
              <SelectTrigger>
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
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("annuaire.filter.city.all")}
            </Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
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
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("annuaire.filter.stack.all")}
            </Label>
            <Select value={stack} onValueChange={setStack}>
              <SelectTrigger>
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
            <Label className="text-xs font-mono uppercase mb-1.5 block">
              {t("annuaire.filter.level.all")}
            </Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
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
          <Label htmlFor="available" className="text-sm cursor-pointer">
            {t("annuaire.available_only")}
          </Label>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("annuaire.empty")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles
            .filter((p) => city === "all" || p.city === city)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => navigate("annuaire", p.username)}
                className="text-left group"
              >
                <Card className="h-full p-5 hover:border-foreground/50 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      name={p.user.name}
                      color={p.avatarColor}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-foreground transition-colors">
                        {p.user.name}
                      </h3>
                      {p.headline && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {p.headline}
                        </p>
                      )}
                      {p.level && (
                        <Tag
                          label={t(`annuaire.level.${p.level}`)}
                          variant="solid"
                          className="mt-1.5"
                        />
                      )}
                    </div>
                    {p.available && (
                      <span
                        className="h-2 w-2 rounded-full bg-foreground shrink-0 mt-2"
                        title={t("annuaire.open_to_work")}
                      />
                    )}
                  </div>

                  {p.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {p.bio}
                    </p>
                  )}

                  {p.stack && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.stack
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((s) => (
                          <Tag key={s} label={s} />
                        ))}
                    </div>
                  )}

                  {p.country && (
                    <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.city}, {p.country}
                    </p>
                  )}
                </Card>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
