"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type Props = { avatarActuel: string };

export default function FormulaireAvatar({ avatarActuel }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [apercu, setApercu] = useState(avatarActuel);
  const [dragOver, setDragOver] = useState(false);
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  async function traiterFichier(fichier: File) {
    if (!fichier.type.startsWith("image/")) {
      toast.erreur("Format invalide", "PNG, JPEG ou WebP attendu.");
      return;
    }
    if (fichier.size > 500 * 1024) {
      toast.erreur("Image trop lourde", "Maximum 500 Ko.");
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
          toast.erreur("Échec de l'envoi", data.message);
        } else {
          setApercu(dataUrl);
          toast.succes("Avatar mis à jour");
          router.refresh();
        }
      } finally {
        setBusy(false);
      }
    };
    lecteur.readAsDataURL(fichier);
  }

  function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (fichier) void traiterFichier(fichier);
  }

  async function supprimer() {
    setBusy(true);
    setErreur("");
    try {
      await fetch("/api/moi/avatar", { method: "DELETE" });
      setApercu("");
      toast.succes("Avatar supprimé");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 transition ${dragOver ? "border-cx-primary bg-cx-primary/5" : "border-cx-border"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fichier = e.dataTransfer.files?.[0];
        if (fichier) void traiterFichier(fichier);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={choisirFichier}
      />
      <p className="mb-3 text-sm text-cx-muted-fg">
        {dragOver ? "Relâche pour importer" : "Glisse-dépose une image ici ou"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-cx-border bg-cx-card px-4 py-2 text-sm font-medium hover:bg-cx-muted disabled:opacity-60"
        >
          Choisir une image
        </button>
        {apercu ? (
          <button
            type="button"
            onClick={supprimer}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-medium text-cx-destructive hover:bg-cx-destructive/5 disabled:opacity-60"
          >
            Supprimer
          </button>
        ) : null}
      </div>
      {erreur ? <p className="mt-2 text-sm text-cx-destructive">{erreur}</p> : null}
    </div>
  );
}
