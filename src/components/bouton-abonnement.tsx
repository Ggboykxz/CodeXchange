"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { RAYON } from "@/lib/design";
import { useToast } from "./toast";
import { useRouter } from "next/navigation";

export default function BoutonAbonnement({ tag, initial }: { tag: string; initial: boolean }) {
  const [suivi, setSuivi] = useState(initial);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function basculer() {
    setBusy(true);
    try {
      const r = await fetch("/api/tags/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      const data = await r.json();
      if (typeof data.following === "boolean") {
        setSuivi(data.following);
        toast.succes(data.following ? "Abonnement activé" : "Abonnement retiré");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void basculer()}
      disabled={busy}
      aria-busy={busy}
      className={cn(
        "inline-flex min-h-[44px] cursor-pointer items-center justify-center px-3 py-1 text-xs font-semibold transition disabled:opacity-60 active:scale-[0.97]",
        RAYON.md,
        suivi
          ? "bg-cx-primary text-cx-primary-fg hover:opacity-90"
          : "border border-cx-border text-cx-muted-fg hover:bg-cx-muted",
      )}
    >
      {suivi ? "Abonné" : "S'abonner"}
    </button>
  );
}
