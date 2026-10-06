"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  /** Utile pour la modération (accepter une réponse, épingler…). */
  role?: "member" | "moderator" | "admin";
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
  setUser: (u: AuthUser | null) => void;
  setLoading: (b: boolean) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
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
