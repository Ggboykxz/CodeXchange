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
        <Icone nom="projets" className="size-4.5" />
      </span>
      {compact ? null : <span className="text-lg">CodeXchange</span>}
    </Link>
  );
}
