"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";

const CLASS_CHAMP = "w-full rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

export default function PageMotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.succes("Si le compte existe, un lien a été envoyé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">Mot de passe oublié</h1>
      <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="aicha@example.com"
          className={CLASS_CHAMP}
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-lg bg-cx-primary px-4 py-2.5 text-sm font-semibold text-cx-primary-fg transition disabled:opacity-60 active:scale-[0.97]"
        >
          Envoyer le lien
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/connexion" className="text-cx-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
