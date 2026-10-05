"use client";

import { useAppStore } from "@/store/app-store";
import { Locale, localeFlags, localeLabels, locales } from "@/i18n/dictionaries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{localeFlags[locale]}</span>
          <span className="hidden sm:inline text-xs uppercase font-mono">
            {locale}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((l: Locale) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{localeFlags[l]}</span>
              <span>{localeLabels[l]}</span>
            </span>
            {locale === l && <Check className="h-3.5 w-3.5 text-terracotta" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
