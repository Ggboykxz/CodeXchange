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
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cx-primary to-cx-accent text-cx-primary-fg shadow-sm"
      >
        <Icone nom="projets" className="h-4.5 w-4.5" />
      </span>
      {compact ? null : <span className="text-lg">CodeXchange</span>}
    </Link>
  );
}
