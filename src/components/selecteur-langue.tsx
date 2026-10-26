"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n";

/** Sélecteur de langue (cookie `cx_locale`, 1 an). */
export default function SelecteurLangue({ localeActuelle }: { localeActuelle: Locale }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(localeActuelle);

  // Écrit le cookie dans un effet (une écriture est un effet de bord).
  useEffect(() => {
    document.cookie = `cx_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  function changer(nouvelle: Locale) {
    setLocale(nouvelle);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-cx-border p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => changer(l)}
          aria-pressed={locale === l}
          className={`inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
            locale === l ? "bg-cx-primary text-cx-primary-fg" : "text-cx-muted-fg hover:bg-cx-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
