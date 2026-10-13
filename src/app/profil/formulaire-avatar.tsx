"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { avatarActuel: string };

export default function FormulaireAvatar({ avatarActuel }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState(avatarActuel);
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  async function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    if (fichier.size > 500 * 1024) {
      setErreur("Image trop lourde (max 500 Ko).");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = async () => {
      const dataUrl = String(lecteur.result ?? "");
      setBusy(true);
      setErreur("");
      try {
        const r = await fetch("/api/moi/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        const data = await r.json();
        if (!r.ok) {
          setErreur(data.message ?? "Échec de l'envoi.");
        } else {
          setApercu(dataUrl);
          router.refresh();
        }
      } finally {
        setBusy(false);
      }
    };
    lecteur.readAsDataURL(fichier);
  }

  async function supprimer() {
    setBusy(true);
    setErreur("");
    try {
      await fetch("/api/moi/avatar", { method: "DELETE" });
      setApercu("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={choisirFichier} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-cx-border bg-cx-card px-4 py-2 text-sm font-medium hover:bg-cx-muted"
        >
          Choisir une image
        </button>
        {apercu ? (
          <button
            type="button"
            onClick={supprimer}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
          >
            Supprimer
          </button>
        ) : null}
      </div>
      {erreur ? <p className="text-sm text-red-500">{erreur}</p> : null}
    </div>
  );
}
