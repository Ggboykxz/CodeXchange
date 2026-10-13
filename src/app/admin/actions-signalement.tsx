"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { reportId: number };

export default function ActionsSignalement({ reportId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function traiter(decision: "TRAITE" | "REJETE") {
    setBusy(true);
    try {
      await fetch(`/api/admin/signalements/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => traiter("TRAITE")}
        disabled={busy}
        className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/20"
      >
        Sanctionner
      </button>
      <button
        type="button"
        onClick={() => traiter("REJETE")}
        disabled={busy}
        className="rounded-md bg-cx-muted px-2 py-1 text-xs font-semibold text-cx-muted-fg hover:opacity-80"
      >
        Rejeter
      </button>
    </span>
  );
}
