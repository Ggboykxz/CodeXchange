"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";

const CLASS_CHAMP =
  "w-full rounded-lg border border-cx-border bg-cx-card px-3 py-2 text-sm outline-none focus:border-cx-primary focus:ring-2 focus:ring-cx-primary/30";

type Profil = {
  nom: string;
  titre: string;
  ville: string;
  pays: string;
  bio: string;
  stack: string;
  github: string;
  linkedin: string;
  site: string;
  notifEmail: boolean;
};

type Props = { profil: Profil };

export default function FormulaireParametres({ profil }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [profilState, setProfilState] = useState<Profil>(profil);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/compte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilState),
      });
      if (!r.ok) throw new Error("Échec de la sauvegarde");
      toast.succes("Profil mis à jour");
      router.refresh();
    } catch (err) {
      toast.erreur("Sauvegarde impossible", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/compte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasseActuel: actuel, nouveauMotDePasse: nouveau }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message ?? "Impossible");
      toast.succes("Mot de passe modifié", "Reconnecte-toi à ta prochaine visite.");
      setActuel("");
      setNouveau("");
    } catch (err) {
      toast.erreur("Modification refusée", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function supprimerCompte() {
    setConfirmationSuppression(false);
    setBusy(true);
    try {
      const r = await fetch("/api/compte", { method: "DELETE" });
      if (!r.ok) throw new Error("Impossible");
      toast.succes("Compte supprimé");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.erreur("Suppression impossible", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  function champ(cle: keyof Profil, label: string) {
    if (cle === "notifEmail") return null;
    return (
      <div key={cle}>
        <label className="mb-1 block text-sm font-medium">{label}</label>
        <input
          value={profilState[cle] as string}
          onChange={(e) =>
            setProfilState((s) => ({ ...s, [cle]: e.target.value } as Profil))
          }
          className={CLASS_CHAMP}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-cx-border bg-cx-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Profil</h2>
        <form onSubmit={enregistrerProfil} className="flex flex-col gap-3">
          {champ("nom", "Nom")}
          {champ("titre", "Titre")}
          {champ("ville", "Ville")}
          {champ("pays", "Pays")}
          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea
              rows={4}
              value={profilState.bio}
              onChange={(e) => setProfilState((s) => ({ ...s, bio: e.target.value }))}
              className={`${CLASS_CHAMP} resize-y`}
            />
          </div>
          {champ("stack", "Stack (séparé par des virgules)")}
          {champ("github", "GitHub")}
          {champ("linkedin", "LinkedIn")}
          {champ("site", "Site")}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profilState.notifEmail}
              onChange={(e) =>
                setProfilState((s) => ({ ...s, notifEmail: e.target.checked }))
              }
            />
            Recevoir les emails de notification
          </label>
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Sécurité</h2>
        <form onSubmit={changerMotDePasse} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Mot de passe actuel</label>
            <input
              type="password"
              value={actuel}
              onChange={(e) => setActuel(e.target.value)}
              className={CLASS_CHAMP}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nouveau mot de passe</label>
            <input
              type="password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              className={CLASS_CHAMP}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="self-start rounded-lg bg-cx-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Changer
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-cx-destructive/40 bg-cx-destructive/5 p-5">
        <h2 className="mb-2 text-lg font-semibold text-cx-destructive">Zone de danger</h2>
        <p className="mb-4 text-sm text-cx-muted-fg">
          Supprime définitivement ton compte et toutes tes données associées.
        </p>
        <button
          type="button"
          onClick={() => setConfirmationSuppression(true)}
          className="rounded-lg bg-cx-destructive px-4 py-2 text-sm font-semibold text-cx-destructive-fg"
        >
          Supprimer mon compte
        </button>
      </section>

      <ConfirmDialog
        open={confirmationSuppression}
        titre="Supprimer ton compte ?"
        description="Cette action est définitive. Toutes tes données seront effacées."
        confirmer={() => void supprimerCompte()}
        annuler={() => setConfirmationSuppression(false)}
        labelConfirmer="Supprimer"
      />
    </div>
  );
}
