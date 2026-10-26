"use client";
import { cookieLocale, t } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  type: "post" | "reply" | "job";
  id: number;
  label: string;
};

export default function BoutonModeration({ type, id, label }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const locale = cookieLocale();

  async function supprimer() {
    setConfirmation(false);
    setBusy(true);
    try {
      await fetch(`/api/admin/${type}s/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        disabled={busy}
        className="rounded-full px-2 py-1 text-xs font-medium text-cx-destructive transition hover:bg-cx-destructive/5 disabled:opacity-60"
      >
        {t(locale, "admin.delete")}
      </button>
      <ConfirmDialog
        open={confirmation}
        titre={t(locale, "admin.delete_question")}
        description={`${label} — ${t(locale, "admin.delete_warning")}`}
        confirmer={() => void supprimer()}
        annuler={() => setConfirmation(false)}
        labelConfirmer={t(locale, "admin.delete")}
      />
    </>
  );
}
