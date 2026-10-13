"use client";
import { cookieLocale, t } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  type: "post" | "reply" | "job";
  id: number;
  label: string;
};

export default function BoutonModeration({ type, id, label }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const locale = cookieLocale();

  async function supprimer() {
    if (!confirm(`${t(locale, "common.report")} ${label} ?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/${type}s/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={supprimer}
      disabled={busy}
      className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10"
    >
      {t(locale, "common.report")}
    </button>
  );
}
