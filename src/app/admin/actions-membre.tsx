"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { userId: number; banni: boolean };

export default function ActionsMembre({ userId, banni }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function basculer() {
    setBusy(true);
    try {
      const chemin = banni ? "debannir" : "bannir";
      await fetch(`/api/admin/membres/${userId}/${chemin}`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={busy}
      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
        banni ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
      }`}
    >
      {banni ? "Débannir" : "Bannir"}
    </button>
  );
}
