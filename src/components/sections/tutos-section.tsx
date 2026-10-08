"use client";

import { useEffect, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  ArrowUpRight,
  ArrowLeft,
  Video,
  Loader2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

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

export function TutosSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const sectionParam = useAppStore((s) => s.sectionParam);
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
  const publish = (open: () => void) => (user ? open() : openAuth("login"));

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
          <div className="text-5xl mb-4">{selectedTutorial.coverEmoji}</div>
          <div className="flex items-center gap-2 mb-3">
            <Tag label={t(`forum.category.${selectedTutorial.category}`)} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {selectedTutorial.readTime} {t("tutos.read_time")}
            </span>
          </div>
          <h1 className="display text-4xl lg:text-5xl text-balance mb-4">
            {selectedTutorial.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            {selectedTutorial.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border">
            <Avatar
              name={selectedTutorial.author.name}
              color={selectedTutorial.author.profile?.avatarColor}
              size="sm"
            />
            <span className="text-sm">
              {t("tutos.by")}{" "}
              <button
                onClick={() => navigate("annuaire", selectedTutorial.author.profile?.username)}
                className="font-medium hover:text-foreground transition"
              >
                {selectedTutorial.author.name}
              </button>
            </span>
          </div>
        </header>

        <div className="prose-editorial max-w-none">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {selectedTutorial.body}
          </p>
        </div>

        {selectedTutorial.tags && (
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-1.5">
            {selectedTutorial.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((tg) => (
                <Tag key={tg} label={tg} />
              ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.tutos")}
        title={t("tutos.title")}
        subtitle={t("tutos.subtitle")}
        className="mb-8"
      />

      <Tabs defaultValue="tutos" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tutos">{t("tutos.tab.tutos")}</TabsTrigger>
          <TabsTrigger value="events">{t("tutos.tab.events")}</TabsTrigger>
        </TabsList>

        {/* TUTORIALS TAB */}
        <TabsContent value="tutos" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-xs font-mono uppercase">
              {t("tutos.filter.category.all")}
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tutorialCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all"
                      ? t("tutos.filter.category.all")
                      : t(`forum.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => publish(() => setTutoCreateOpen(true))}
              size="sm"
              className="ms-auto bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("create.tutorial")}
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorials
                .filter(
                  (tut) => category === "all" || tut.category === category
                )
                .map((tut) => (
                  <button
                    key={tut.id}
                    onClick={() => navigate("tutos", tut.slug)}
                    className="text-start group"
                  >
                    <Card className="h-full p-5 hover:border-foreground/50 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-3xl shrink-0">{tut.coverEmoji}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg leading-tight group-hover:text-foreground transition-colors">
                            {tut.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag label={t(`forum.category.${tut.category}`)} />
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {tut.readTime} {t("tutos.read_time")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {tut.excerpt}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar
                          name={tut.author.name}
                          color={tut.author.profile?.avatarColor}
                          size="xs"
                        />
                        <span>{t("tutos.by")} {tut.author.name}</span>
                      </div>
                    </Card>
                  </button>
                ))}
            </div>
          )}
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => publish(() => setEventCreateOpen(true))}
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("create.event")}
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("events.empty")}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <Card key={evt.id} className="p-5 hover:border-foreground/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-16 shrink-0 bg-muted/50 dark:bg-background/30 border border-border rounded-md py-2">
                      <span className="text-[10px] font-mono uppercase text-foreground">
                        {format(new Date(evt.date), "MMM")}
                      </span>
                      <span className="font-bold text-2xl font-bold leading-none">
                        {format(new Date(evt.date), "dd")}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {format(new Date(evt.date), "yyyy")}
                      </span>
                    </div>

                    <div className="text-2xl shrink-0">{evt.coverEmoji}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-lg leading-tight">
                          {evt.title}
                        </h3>
                        {evt.online && (
                          <Tag label={t("events.online")} variant="outline" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {evt.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(evt.date), "HH:mm")} UTC
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {evt.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {evt.attendees} {t("events.attendees")}
                        </span>
                      </div>
                    </div>

                    {evt.url && (
                      <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90 shrink-0">
                        <a href={evt.url} target="_blank" rel="noopener noreferrer">
                          {evt.online ? <Video className="h-3.5 w-3.5 me-1" /> : null}
                          {t("events.rsvp")}
                          <ArrowUpRight className="h-3 w-3 ms-1" />
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
