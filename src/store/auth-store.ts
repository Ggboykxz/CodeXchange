"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** Utile pour la modération (accepter une réponse, épingler…). */
  role?: "member" | "moderator" | "admin";
  /** B1 — `null` tant que l'adresse n'est pas confirmée (badge vérifié). */
  emailVerifiedAt?: string | null;
  profile?: {
    username: string;
    headline?: string | null;
    avatarColor?: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  /**
   * Modale d'authentification **unique**, pilotée depuis n'importe où
   * (en-tête, fil, 401 d'une publication…). Précédemment, chaque section
   * possédait sa propre copie : on pouvait en avoir deux d'ouvertes.
   */
  authOpen: boolean;
  authMode: "login" | "register" | "forgot";
  setUser: (u: AuthUser | null) => void;
  setLoading: (b: boolean) => void;
  openAuth: (mode?: "login" | "register" | "forgot") => void;
  closeAuth: () => void;
  switchAuthMode: () => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      authOpen: false,
      authMode: "register",
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      openAuth: (mode) => set({ authOpen: true, ...(mode ? { authMode: mode } : {}) }),
      closeAuth: () => set({ authOpen: false }),
      switchAuthMode: () => set((s) => ({ authMode: s.authMode === "login" ? "register" : "login" })),
      logout: () => {
        fetch("/api/auth/me", { method: "DELETE" }).catch(() => {});
        set({ user: null });
      },
      fetchMe: async () => {
        try {
          set({ loading: true });
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          set({ user: data.user || null, loading: false });
        } catch {
          set({ loading: false });
        }
      },
    }),
    {
      name: "codexchange-auth",
      partialize: (s) => ({ user: s.user }) as AuthState,
    }
  )
);
