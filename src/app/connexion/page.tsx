"use client";

import Link from "next/link";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

export default function PageConnexion() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const donnees = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const reponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { message?: string } | null;
        setErreur(corps?.message ?? MESSAGE_FR.AUTH_INVALID);
        return;
      }
      window.location.href = "/";
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">Connexion</h1>
      <p className="mt-2 text-sm text-[var(--cx-muted)]">
        Content de vous revoir sur CodeXchange.
      </p>

      <form onSubmit={envoyerFormulaire} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="aicha@example.com"
            className={CLASS_CHAMP}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className={CLASS_CHAMP}
          />
        </div>

        {erreur && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--cx-muted)]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-[var(--cx-accent)]">
          S&apos;inscrire
        </Link>
      </p>
    </main>
  );
}
