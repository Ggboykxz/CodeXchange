"use client";

import { useEffect, useState } from "react";
import { useT } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { SectionHeader } from "@/components/shared/section-header";
import { Avatar } from "@/components/shared/avatar";
import { Tag } from "@/components/shared/tag";
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
  Star,
  GraduationCap,
  Users,
  Globe,
  Quote,
  Send,
  Loader2,
  MapPin,
} from "lucide-react";

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

  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((d) => setMentors(d.mentors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    if (!user) {
      toast.error("Connecte-toi pour demander un mentorat");
      return;
    }
    if (!selectedMentor || !requestMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mentors/${selectedMentor.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menteeId: user.id,
          message: requestMessage,
          goal: requestGoal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Demande envoyée ! Le mentor te répondra sous 48h.");
      setSelectedMentor(null);
      setRequestMessage("");
      setRequestGoal("");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <SectionHeader
        eyebrow={t("nav.mentorat")}
        title={t("mentorat.title")}
        subtitle={t("mentorat.subtitle")}
        className="mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((m) => {
            const slotsLeft = m.capacity - m.slotsTaken;
            return (
              <Card key={m.id} className="p-5 flex flex-col hover:border-foreground/40 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar
                    name={m.user.name}
                    color={m.user.profile?.avatarColor}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight">
                      {m.user.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {m.user.profile?.headline}
                    </p>
                    {m.user.profile?.country && (
                      <p className="text-[11px] font-mono text-muted-foreground/70 mt-1 flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {m.user.profile.city}, {m.user.profile.country}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
                  {m.bio}
                </p>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                      Expertise
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {m.expertise
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((s) => (
                          <Tag key={s} label={s} variant="outline" />
                        ))}
                    </div>
                  </div>
                  {m.languages && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span className="font-mono">{m.languages}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">Note</p>
                    <p className="font-bold flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-foreground fill-foreground" />
                      {m.rating.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">
                      {t("mentorat.reviews")}
                    </p>
                    <p className="font-bold">{m.reviews}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">
                      {t("mentorat.capacity")}
                    </p>
                    <p
                      className={`font-bold ${
                        slotsLeft === 0 ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {slotsLeft}/{m.capacity}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">
                    {t("mentorat.rate")}
                  </p>
                  <p className="text-sm font-medium">
                    {m.hourlyRate || "—"}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (!user) {
                      toast.error("Connecte-toi pour demander un mentorat");
                      return;
                    }
                    setSelectedMentor(m);
                  }}
                  disabled={slotsLeft === 0}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                  variant="default"
                >
                  {slotsLeft === 0 ? "Complet" : t("mentorat.request")}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Testimonials */}
      <div className="mt-16 pt-12 border-t border-border">
        <SectionHeader
          eyebrow="Témoignages"
          title={t("mentorat.testimonials.title")}
          subtitle={t("mentorat.testimonials.subtitle")}
          className="mb-8"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((tst, i) => (
            <Card key={i} className="p-6 border-border/70">
              <Quote className="h-6 w-6 text-foreground mb-3" />
              <p className="font-mono italic leading-relaxed text-foreground/90 mb-4">
                « {tst.text} »
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
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

      {/* Request mentorship modal */}
      <Dialog open={!!selectedMentor} onOpenChange={(o) => !o && setSelectedMentor(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedMentor && (
            <>
              <DialogHeader>
                <DialogTitle className="font-bold text-2xl flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-foreground" />
                  {t("mentorat.request")}
                </DialogTitle>
                <DialogDescription>
                  Avec <strong>{selectedMentor.user.name}</strong> —{" "}
                  {selectedMentor.user.profile?.headline}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-mono uppercase">
                    Ton objectif
                  </Label>
                  <Input
                    value={requestGoal}
                    onChange={(e) => setRequestGoal(e.target.value)}
                    placeholder={t("mentorat.goal.placeholder")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase">
                    Message au mentor
                  </Label>
                  <Textarea
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
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
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
