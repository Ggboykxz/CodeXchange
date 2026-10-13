"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";
import { cookieLocale, t, type Locale } from "@/lib/i18n";

const CLASS_CHAMP =
  "w-full rounded-lg border border-[var(--cx-muted)]/40 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--cx-accent)] focus:ring-2 focus:ring-[var(--cx-accent)]/30";

export default function PageInscription() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [locale] = useState<Locale>(cookieLocale);
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    const donnees = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const reponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { message?: string } | null;
        setErreur(corps?.message ?? MESSAGE_FR.FORUM_VALIDATION);
        return;
      }
      router.push( "/");
    } catch {
      setErreur("Impossible de contacter le serveur. Réessayez dans un instant.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "auth.register_title")}</h1>
      <p className="mt-2 text-sm text-[var(--cx-muted)]">
        Rejoignez la plateforme africaine des développeurs — c&apos;est gratuit.
      </p>

      <form onSubmit={envoyerFormulaire} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="nom" className="mb-1 block text-sm font-medium">
            {t(locale, "auth.name")}
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            autoComplete="name"
            placeholder="Aïcha Ondo"
            className={CLASS_CHAMP}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t(locale, "auth.email")}
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
            {t(locale, "auth.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            className={CLASS_CHAMP}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ville" className="mb-1 block text-sm font-medium">
              {t(locale, "auth.city")}
            </label>
            <input
              id="ville"
              name="ville"
              type="text"
              required
              placeholder="Libreville"
              className={CLASS_CHAMP}
            />
          </div>
          <div>
            <label htmlFor="pays" className="mb-1 block text-sm font-medium">
              {t(locale, "auth.country")}
            </label>
            <input
              id="pays"
              name="pays"
              type="text"
              required
              placeholder="Gabon"
              className={CLASS_CHAMP}
            />
          </div>
        </div>

        <div>
          <label htmlFor="titre" className="mb-1 block text-sm font-medium">
            {t(locale, "auth.job_title")}
          </label>
          <input
            id="titre"
            name="titre"
            type="text"
            required
            placeholder="Développeuse Flutter"
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
          {enCours ? t(locale, "common.loading") : t(locale, "auth.register_submit")}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--cx-muted)]">
        Déjà membre ?{" "}
        <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
          {t(locale, "auth.login_link")}
        </Link>
      </p>
    </main>
  );
}
