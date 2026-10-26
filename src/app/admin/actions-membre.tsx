"use client";

import { useState } from "react";
import { cookieLocale, t } from "@/lib/i18n";
import { useRouter } from "next/navigation";

type Props = { userId: number; banni: boolean };

export default function ActionsMembre({ userId, banni }: Props) {
  const router = useRouter();
  const locale = cookieLocale();
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
      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
        banni ? "bg-cx-success/5 text-cx-success" : "bg-cx-destructive/5 text-cx-destructive"
      }`}
    >
      {banni ? t(locale, "admin.unban") : t(locale, "admin.ban")}
    </button>
  );
}
