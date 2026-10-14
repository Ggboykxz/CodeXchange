"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MESSAGE_FR } from "@/lib/errors";
import { cookieLocale, t, type Locale } from "@/lib/i18n";
import { validerEmail, validerMotDePasse, validerObligatoire } from "@/lib/validation";
import { useToast } from "@/components/toast";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

const CLASSE_ERREUR = "mt-1 text-xs font-medium text-cx-destructive";

/** Message d'erreur inline d'un champ (affiché seulement si touché). */
function ErreurChamp({ id, message, actif }: { id: string; message: string | null; actif: boolean }) {
  if (!actif || !message) return null;
  return (
    <p id={`erreur-${id}`} className={CLASSE_ERREUR}>
      {message}
    </p>
  );
}

export default function PageInscription() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [locale] = useState<Locale>(cookieLocale);
  const router = useRouter();
  const toast = useToast();
  const [enCours, setEnCours] = useState(false);

  const [valeurs, setValeurs] = useState({
    nom: "",
    email: "",
    password: "",
    ville: "",
    pays: "",
    titre: "",
  });
  const [touches, setTouches] = useState<Record<string, boolean>>({});

  const champ = (nom: keyof typeof valeurs) => ({
    value: valeurs[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValeurs((v) => ({ ...v, [nom]: e.target.value })),
    onBlur: () => setTouches((t) => ({ ...t, [nom]: true })),
  });

  const erreurs = {
    nom: validerObligatoire(valeurs.nom, "Le nom", 2, 80),
    email: validerEmail(valeurs.email),
    password: validerMotDePasse(valeurs.password),
    ville: validerObligatoire(valeurs.ville, "La ville", 2, 80),
    pays: validerObligatoire(valeurs.pays, "Le pays", 2, 80),
    titre: validerObligatoire(valeurs.titre, "Le titre", 2, 80),
  };

  async function envoyerFormulaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const premiere = Object.values(erreurs).find((x) => x !== null);
    if (premiere) {
      setTouches({ nom: true, email: true, password: true, ville: true, pays: true, titre: true });
      setEnCours(false);
      return;
    }

    try {
      const reponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valeurs),
      });
      if (!reponse.ok) {
        const corps = (await reponse.json().catch(() => null)) as { message?: string } | null;
        setErreur(corps?.message ?? MESSAGE_FR.AUTH_DUPLICATE_EMAIL);
        toast.erreur("Inscription refusée", corps?.message ?? undefined);
        return;
      }
      toast.succes("Compte créé, bienvenue !");
      router.push("/");
    } catch {
      setErreur(t(locale, "auth.server_error"));
      toast.erreur("Inscription impossible", t(locale, "auth.server_error"));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "auth.register_title")}</h1>
      <p className="mt-2 text-sm text-[var(--cx-muted)]">
        {t(locale, "home.hero_sub")}
      </p>

      <form onSubmit={envoyerFormulaire} className="mt-8 flex flex-col gap-4" noValidate>
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
            aria-invalid={touches.nom && erreurs.nom !== null}
            aria-describedby={touches.nom && erreurs.nom ? "erreur-nom" : undefined}
            className={CLASS_CHAMP}
            {...champ("nom")}
          />
          <ErreurChamp id="nom" message={erreurs.nom} actif={Boolean(touches.nom)} />
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
            aria-invalid={touches.email && erreurs.email !== null}
            aria-describedby={touches.email && erreurs.email ? "erreur-email" : undefined}
            className={CLASS_CHAMP}
            {...champ("email")}
          />
          <ErreurChamp id="email" message={erreurs.email} actif={Boolean(touches.email)} />
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
            autoComplete="new-password"
            placeholder="8 caractères, lettres et chiffres"
            aria-invalid={touches.password && erreurs.password !== null}
            aria-describedby={touches.password && erreurs.password ? "erreur-password" : undefined}
            className={CLASS_CHAMP}
            {...champ("password")}
          />
          <ErreurChamp id="password" message={erreurs.password} actif={Boolean(touches.password)} />
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
              aria-invalid={touches.ville && erreurs.ville !== null}
              className={CLASS_CHAMP}
              {...champ("ville")}
            />
            <ErreurChamp id="ville" message={erreurs.ville} actif={Boolean(touches.ville)} />
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
              aria-invalid={touches.pays && erreurs.pays !== null}
              className={CLASS_CHAMP}
              {...champ("pays")}
            />
            <ErreurChamp id="pays" message={erreurs.pays} actif={Boolean(touches.pays)} />
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
            aria-invalid={touches.titre && erreurs.titre !== null}
            className={CLASS_CHAMP}
            {...champ("titre")}
          />
          <ErreurChamp id="titre" message={erreurs.titre} actif={Boolean(touches.titre)} />
        </div>

        {erreur ? (
          <p
            role="alert"
            className="rounded-lg bg-cx-destructive/10 px-3 py-2 text-sm font-medium text-cx-destructive"
          >
            {erreur}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 rounded-lg bg-[var(--cx-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {enCours ? t(locale, "common.loading") : t(locale, "auth.register_submit")}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--cx-muted)]">
        {t(locale, "auth.has_account")}{" "}
        <Link href="/connexion" className="font-medium text-[var(--cx-accent)]">
          {t(locale, "auth.login_link")}
        </Link>
      </p>
    </main>
  );
}
