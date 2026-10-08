"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { Tag } from "@/components/shared/tag";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES, canAssignRoles, type Role } from "@/lib/roles";
import { ArrowLeft, Lock, Search, ShieldAlert } from "lucide-react";

/**
 * B8 — l'outil de gestion des rôles.
 *
 * Écran réservé aux administrateurs : il affiche les membres avec leur
 * rôle et permet de le changer, ligne par ligne. **La seule autorité est
 * la route `PATCH /api/admin/users/[id]`** — cette UI ne fait que
 * refléter ses refus (401 → modale de connexion, 403 → message net).
 *
 * Ce qui ne figure jamais ici : l'e-mail des membres (le sélecteur
 * admin ne le renvoie pas), ni `passwordHash`. Chercher par e-mail
 * fonctionne, le voir ne fonctionne pas.
 */

/** Ligne telle que `/api/admin/users` la renvoie. */
type AdminRow = {
  id: string;
  name: string;
  role: string;
  reputation: number;
  profile: { username: string; avatarColor: string | null } | null;
};

type ListState =
  | { status: "loading" | "error" | "forbidden" }
  | { status: "ready"; users: AdminRow[]; total: number; hasMore: boolean };

const PAGE_SIZE = 24;

export function AdminSection() {
  const t = useT();
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const openAuth = useAuthStore((s) => s.openAuth);

  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [saving, setSaving] = useState<string | null>(null);
  // Numéro de requête : une recherche rapide ne doit pas laisser une
  // réponse périmée écraser la dernière.
  const reqId = useRef(0);

  const admin = canAssignRoles(user);

  // Debounce 250 ms — la même cadence que la recherche du forum (C6).
  useEffect(() => {
    const timer = setTimeout(() => setApplied(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(
    async (query: string, pageToLoad: number, append: boolean) => {
      const id = ++reqId.current;
      if (!append) setList({ status: "loading" });
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(pageToLoad),
        });
        if (query) params.set("q", query);
        const res = await fetch(`/api/admin/users?${params}`);

        // Rôles retirés entre-temps : l'écran passe en refus net plutôt
        // qu'en liste vide silencieuse.
        if (res.status === 403) {
          if (reqId.current === id) setList({ status: "forbidden" });
          return;
        }
        if (res.status === 401) {
          openAuth("login");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (reqId.current !== id) return;
        setList((prev) => ({
          status: "ready",
          users:
            append && prev.status === "ready"
              ? [...prev.users, ...data.users]
              : data.users,
          total: data.total,
          hasMore: data.hasMore,
        }));
      } catch {
        if (reqId.current === id) setList({ status: "error" });
      }
    },
    [openAuth]
  );

  // (Re)chargement à l'entrée sur l'écran et à chaque changement de
  // recherche — jamais pendant qu'un rôle est en cours d'écriture.
  useEffect(() => {
    if (!admin) return;
    setPage(1);
    load(applied, 1, false);
  }, [admin, applied, load]);

  const applyRole = (id: string, role: string) =>
    setList((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            users: prev.users.map((u) => (u.id === id ? { ...u, role } : u)),
          }
        : prev
    );

  const changeRole = async (row: AdminRow, role: Role) => {
    const previous = row.role;
    setSaving(row.id);
    // Optimiste : le sélecteur bouge tout de suite, on annule s'il faut.
    applyRole(row.id, role);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.status === 401) {
        applyRole(row.id, previous);
        openAuth("login");
        return;
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        applyRole(row.id, previous);
        if (res.status === 403) {
          toast.error(t("admin.forbidden"), { description: body?.error });
        } else {
          toast.error(t("admin.error"), { description: body?.error });
        }
        return;
      }
      toast.success(t("admin.updated"));
    } catch {
      applyRole(row.id, previous);
      toast.error(t("admin.error"));
    } finally {
      setSaving(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Gardes — l'écran dit ce que le serveur fera de toute façon.        */
  /* ---------------------------------------------------------------- */

  // `fetchMe` remplit le store après le montage : sans cet écran tampon,
  // un admin au cache vide verrait « connecte-toi » clignoter.
  if (authLoading && !user) {
    return (
      <div
        className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-4"
        role="status"
        aria-busy="true"
      >
        <span className="sr-only">{t("common.loading")}</span>
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Card className="items-center gap-4 py-10 text-center">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("admin.login_required")}</p>
          <div className="flex gap-2">
            <Button onClick={() => openAuth("login")}>{t("nav.login")}</Button>
            <Button variant="outline" onClick={() => navigate("home")}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("nav.home")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Card className="items-center gap-4 py-10 text-center">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("admin.forbidden")}</p>
          <Button variant="outline" onClick={() => navigate("home")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("nav.home")}
          </Button>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Liste                                                             */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      <SectionHeader title={t("admin.title")} subtitle={t("admin.subtitle")} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.search")}
            aria-label={t("admin.search")}
            className="pl-9"
          />
        </div>
        {list.status === "ready" && (
          <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
            {list.total} {t("admin.members")}
          </span>
        )}
      </div>

      {list.status === "loading" && (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">{t("common.loading")}</span>
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
        </div>
      )}

      {list.status === "forbidden" && (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("admin.forbidden")}
        </p>
      )}

      {list.status === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
          <span>{t("admin.error")}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(applied, 1, false)}
          >
            {t("feed.retry")}
          </Button>
        </div>
      )}

      {list.status === "ready" && (
        <>
          {list.users.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {t("admin.empty")}
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {list.users.map((u) => {
                const isYou = u.id === user.id;
                return (
                  <div key={u.id} data-testid="admin-row" className="flex items-center gap-3 px-4 py-3">
                    <Avatar
                      name={u.name}
                      color={u.profile?.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {u.name}
                        </span>
                        {isYou && <Tag label={t("admin.you")} variant="muted" />}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        u/{u.profile?.username ?? "—"} · ★ {u.reputation}
                      </div>
                    </div>
                    {/* On ne change pas son propre rôle : le serveur le
                        refuse aussi (`canChangeRole`), l'UI ne fait que
                        l'éviter d'y aller se cogner. */}
                    <Select
                      value={u.role}
                      onValueChange={(v) => changeRole(u, v as Role)}
                      disabled={isYou || saving === u.id}
                    >
                      <SelectTrigger className="h-9 w-36 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`admin.role.${r}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}

          {list.hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  load(applied, next, true);
                }}
              >
                {t("feed.more")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
