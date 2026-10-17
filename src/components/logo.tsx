import Link from "next/link";
import { Icone } from "@/components/icones";

/**
 * Logo CodeXchange : pastille dégradée avec un chevron de code (`</>` stylisé)
 * + wordmark. Sert d'image de marque dans le header et les pages vides.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
      <span
        aria-hidden="true"
        className="inline-flex size-8 items-center justify-center rounded-lg bg-cx-primary text-cx-primary-fg shadow-sm"
      >
        {/* Chevron `</>` façon code : la marque promesse du docstring. */}
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6 4 12l5 6" />
          <path d="m15 6 5 6-5 6" />
        </svg>
      </span>
      {compact ? null : <span className="text-lg">CodeXchange</span>}
    </Link>
  );
}
