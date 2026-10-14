"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";

/**
 * /onboarding — choix des centres d'intérêt après l'inscription.
 * Sélection multiple de tags → abonnement en masse → redirection vers le fil.
 * Accessible : chaque chip est un `button` avec `aria-pressed`.
 */

const INTERETS = [
  { tag: "flutter", emoji: "📱", label: "Flutter" },
  { tag: "reactnative", emoji: "📲", label: "React Native" },
  { tag: "nextjs", emoji: "▲", label: "Next.js" },
  { tag: "typescript", emoji: "🟦", label: "TypeScript" },
  { tag: "nestjs", emoji: "🦁", label: "NestJS" },
  { tag: "django", emoji: "🐍", label: "Python / Django" },
  { tag: "prisma", emoji: "🗄️", label: "Prisma" },
  { tag: "vercel", emoji: "🚀", label: "Déploiement" },
  { tag: "api", emoji: "🔌", label: "API / Laravel" },
  { tag: "ia", emoji: "🤖", label: "IA & DeepSeek" },
  { tag: "business", emoji: "💼", label: "Business & SaaS" },
  { tag: "freelance", emoji: "💰", label: "Freelance" },
  { tag: "carriere", emoji: "🧭", label: "Carrière" },
  { tag: "security", emoji: "🔒", label: "Sécurité" },
  { tag: "architecture", emoji: "🏗️", label: "Architecture" },
  { tag: "test", emoji: "🧪", label: "Tests" },
];

export default function PageOnboarding() {
  const router = useRouter();
  const toast = useToast();
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [enCours, setEnCours] = useState(false);

  function basculer(tag: string) {
    setChoisis((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function terminer() {
    setEnCours(true);
    try {
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [...choisis] }),
      });
      if (r.ok) {
        toast.succes(
          "Profil personnalisé !",
          choisis.size > 0 ? `${choisis.size} intérêt(s) suivi(s).` : undefined,
        );
      }
    } catch {
      // onboarding non bloquant : on continue quand même
    } finally {
      setEnCours(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold text-cx-primary">Dernière étape</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">Que voulez-vous apprendre&nbsp;?</h1>
      <p className="mt-2 text-sm text-cx-muted-fg">
        Choisissez vos centres d&apos;intérêt : votre fil et vos tendances s&apos;adapteront.
        Vous pouvez en prendre aucun et modifier plus tard.
      </p>

      <ul className="mt-8 flex flex-wrap gap-2.5">
        {INTERETS.map((i) => {
          const actif = choisis.has(i.tag);
          return (
            <li key={i.tag}>
              <button
                type="button"
                onClick={() => basculer(i.tag)}
                aria-pressed={actif}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  actif
                    ? "border-cx-primary bg-cx-primary/5 text-cx-primary"
                    : "border-cx-border bg-cx-card text-cx-card-fg hover:border-cx-primary/60"
                }`}
              >
                <span aria-hidden>{i.emoji}</span>
                {i.label}
                {actif ? <span aria-hidden>✓</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={terminer}
          disabled={enCours}
          className="rounded-lg bg-cx-accent px-5 py-2.5 text-sm font-semibold text-cx-accent-fg transition hover:opacity-90 disabled:opacity-60 active:scale-[0.97]"
        >
          {enCours ? "Enregistrement…" : `Terminer${choisis.size > 0 ? ` (${choisis.size})` : ""}`}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm font-medium text-cx-muted-fg underline-offset-4 hover:underline"
        >
          Passer pour l&apos;instant
        </button>
      </div>
    </div>
  );
}
