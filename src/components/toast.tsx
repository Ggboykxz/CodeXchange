"use client";

import { IconeAnimee } from "./icone-animee";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type Toast = {
  id: number;
  titre: string;
  description?: string;
  /** Action « annuler » (ex. restaurer une suppression). */
  action?: { label: string; onClick: () => void };
  ton: "succes" | "erreur" | "info";
};

type ContexteToast = {
  notifier: (toast: Omit<Toast, "id" | "ton"> & { ton?: Toast["ton"] }) => void;
  succes: (titre: string, description?: string) => void;
  erreur: (titre: string, description?: string) => void;
  info: (titre: string, description?: string) => void;
  avecAction: (titre: string, action: NonNullable<Toast["action"]>, description?: string) => void;
};

const Contexte = createContext<ContexteToast | null>(null);

const DUREE_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const compteur = useRef(0);

  const retirer = useCallback((id: number) => {
    setToasts((liste) => liste.filter((t) => t.id !== id));
  }, []);

  const notifier = useCallback<ContexteToast["notifier"]>(
    (toast) => {
      compteur.current += 1;
      const id = compteur.current;
      setToasts((liste) => [...liste.slice(-3), { ...toast, id, ton: toast.ton ?? "succes" }]);
      window.setTimeout(() => retirer(id), DUREE_MS);
    },
    [retirer],
  );

  const valeur = useMemo<ContexteToast>(
    () => ({
      notifier,
      succes: (titre, description) => notifier({ titre, description, ton: "succes" }),
      erreur: (titre, description) => notifier({ titre, description, ton: "erreur" }),
      info: (titre, description) => notifier({ titre, description, ton: "info" }),
      avecAction: (titre, action, description) => notifier({ titre, description, action, ton: "info" }),
    }),
    [notifier],
  );

  return (
    <Contexte.Provider value={valeur}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition ${
              toast.ton === "erreur"
                ? "border-cx-destructive/40 bg-cx-destructive/10 text-cx-fg"
                : toast.ton === "info"
                  ? "border-cx-primary/40 bg-cx-primary/10 text-cx-fg"
                  : "border-cx-success/40 bg-cx-success/10 text-cx-fg"
            }`}
          >
            <span aria-hidden="true" className="mt-0.5">
              <IconeAnimee nom={toast.ton === "erreur" ? "erreur" : toast.ton === "info" ? "info" : "succes"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.titre}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs text-cx-muted-fg">{toast.description}</p>
              ) : null}
            </div>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  retirer(toast.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-bold text-cx-primary hover:bg-cx-primary/10"
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => retirer(toast.id)}
              aria-label="Fermer"
              className="shrink-0 rounded-md px-1 text-cx-muted-fg hover:bg-cx-muted"
            >
              <IconeAnimee nom="fermer" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Contexte.Provider>
  );
}

export function useToast(): ContexteToast {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return contexte;
}
