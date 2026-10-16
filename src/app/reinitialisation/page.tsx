"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast";
import { SqueletteBarre } from "@/components/skeleton";

export const dynamic = "force-dynamic";

const CLASS_CHAMP = "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

function Formulaire() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message ?? "Lien invalide");
      toast.succes("Mot de passe réinitialisé");
      router.push("/connexion");
    } catch (err) {
      toast.erreur("Réinitialisation impossible", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Au moins 8 caractères"
        className={CLASS_CHAMP}
      />
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-lg bg-cx-primary px-4 py-2.5 text-sm font-semibold text-cx-primary-fg transition disabled:opacity-60 active:scale-[0.97]"
      >
        Réinitialiser
      </button>
    </form>
  );
}

export default function PageReinitialisation() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">Nouveau mot de passe</h1>
      <Suspense fallback={<SqueletteBarre className="mt-8 h-10" />}>
        <Formulaire />
      </Suspense>
      <p className="mt-6 text-sm">
        <Link href="/connexion" className="text-cx-primary hover:underline">
          Retour
        </Link>
      </p>
    </div>
  );
}
