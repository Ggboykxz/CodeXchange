"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MESSAGE_FR } from "@/lib/errors";
import { cookieLocale, t, type Locale } from "@/lib/i18n";
import { validerEmail, validerMotDePasse } from "@/lib/validation";
import { useToast } from "@/components/toast";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border-fort bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const CLASSE_ERREUR = "mt-1 text-xs font-medium text-cx-destructive";

export default function PageConnexion() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [locale] = useState<Locale>(cookieLocale);
  const router = useRouter();
  const toast = useToast();
  const [enCours, setEnCours] = useState(false);

  // Validation en direct : erreurs affichées dès la sortie du champ.
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [touches, setTouches] = useState({ email: false, motDePasse: false });

  const erreurEmail = validerEmail(email);
  const erreurMotDePasse = validerMotDePasse(motDePasse);

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    if (erreurEmail || erreurMotDePasse) {
      setTouches({ email: true, motDePasse: true });
      setEnCours(false);
      return;
    }

    try {
      const reponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: motDePasse }),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { message?: string } | null;
        setErreur(corps?.message ?? MESSAGE_FR.AUTH_INVALID);
        toast.erreur("Connexion refusée", corps?.message ?? MESSAGE_FR.AUTH_INVALID);
        return;
      }
      toast.succes("Content de vous revoir !");
      router.push("/");
    } catch {
      setErreur(t(locale, "auth.server_error"));
      toast.erreur("Connexion impossible", t(locale, "auth.server_error"));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "auth.login_title")}</h1>
      <p className="mt-2 text-sm text-cx-muted-fg">{t(locale, "home.hero_sub")}</p>

      <form onSubmit={envoyerFormulaire} className="mt-8 flex flex-col gap-4" noValidate>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouches((t) => ({ ...t, email: true }))}
            aria-invalid={touches.email && erreurEmail !== null}
            aria-describedby={touches.email && erreurEmail ? "erreur-email" : undefined}
            className={CLASS_CHAMP}
          />
          {touches.email && erreurEmail ? (
            <p id="erreur-email" className={CLASSE_ERREUR}>
              {erreurEmail}
            </p>
          ) : null}
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
            autoComplete="current-password"
            placeholder={t(locale, "auth.password")}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onBlur={() => setTouches((t) => ({ ...t, motDePasse: true }))}
            aria-invalid={touches.motDePasse && erreurMotDePasse !== null}
            aria-describedby={touches.motDePasse && erreurMotDePasse ? "erreur-mdp" : undefined}
            className={CLASS_CHAMP}
          />
          {touches.motDePasse && erreurMotDePasse ? (
            <p id="erreur-mdp" className={CLASSE_ERREUR}>
              {erreurMotDePasse}
            </p>
          ) : null}
        </div>

        {erreur ? (
          <p role="alert" className="rounded-lg bg-cx-destructive/5 px-3 py-2 text-sm font-medium text-cx-destructive">
            {erreur}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 min-h-[44px] rounded-full bg-cx-accent px-4 py-2.5 text-sm font-semibold text-cx-accent-fg transition disabled:opacity-60 active:scale-[0.97]"
        >
          {enCours ? t(locale, "common.loading") : t(locale, "auth.login_submit")}
        </button>
      </form>
      <p className="mt-4 text-sm text-cx-muted-fg">
        <Link href="/mot-de-passe-oublie" className="text-cx-primary hover:underline">
          Mot de passe oublié ?
        </Link>
      </p>

      <p className="mt-6 text-sm text-cx-muted-fg">
        {t(locale, "auth.no_account")}{" "}
        <Link href="/inscription" className="font-medium text-cx-primary">
          {t(locale, "auth.register_link")}
        </Link>
      </p>
    </div>
  );
}
