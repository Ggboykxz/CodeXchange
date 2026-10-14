import Avatar from "@/components/avatar";
import { Icone } from "@/components/icones";

/**
 * Visuel du héros d'accueil : cartes d'interface flottantes sur fond dégradé
 * (profil abonné, sujet avec réactions, hashtag en tendance). Sert d'« image »
 * illustrative sans asset externe (budget zéro), et montre le produit.
 */
export default function VisuelAccueil() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto mt-12 h-72 w-full max-w-3xl sm:h-80"
    >
      {/* Fond dégradé + halos. */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cx-primary/15 via-cx-accent/10 to-cx-card border border-cx-border" />
      <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-cx-primary/20 blur-2xl" />
      <div className="absolute -bottom-8 -right-4 h-32 w-32 rounded-full bg-cx-accent/25 blur-2xl" />

      {/* Carte : profil abonné. */}
      <div className="absolute left-4 top-6 w-56 rounded-2xl border border-cx-border bg-cx-card p-3 shadow-lg sm:left-10">
        <div className="flex items-center gap-3">
          <Avatar slug="aicha-ondo" nom="Aïcha Ondo" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              Aïcha Ondo
              <Icone nom="verifie" className="h-3.5 w-3.5 shrink-0 text-cx-primary" />
            </p>
            <p className="truncate text-xs text-cx-muted-fg">Ingénieure · Cameroun</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-cx-muted-fg">
          <span className="rounded-full bg-cx-primary/5 px-2 py-0.5 font-semibold text-cx-primary">
            1 240 abonnés
          </span>
          <span className="rounded-full bg-cx-muted px-2 py-0.5">Niveau 6</span>
        </div>
      </div>

      {/* Carte : sujet avec réactions. */}
      <div className="absolute bottom-6 right-4 w-64 rounded-2xl border border-cx-border bg-cx-card p-3 shadow-lg sm:right-10">
        <p className="text-xs font-semibold text-cx-muted-fg">
          <span className="text-cx-primary">#</span>reactnative
        </p>
        <p className="mt-1 text-sm font-medium leading-snug">
          Retour d&apos;expérience : Dart isolates en prod 🚀
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-cx-muted px-2 py-0.5">👍 34</span>
          <span className="rounded-full bg-cx-muted px-2 py-0.5">🔥 21</span>
          <span className="rounded-full bg-cx-muted px-2 py-0.5">❤️ 12</span>
        </div>
      </div>

      {/* Pastille flottante : icône message. */}
      <div className="absolute right-8 top-8 hidden h-12 w-12 items-center justify-center rounded-2xl border border-cx-border bg-cx-card text-cx-primary shadow-lg sm:flex">
        <Icone nom="forum" className="h-6 w-6" />
      </div>
      <div className="absolute left-10 bottom-10 hidden h-12 w-12 items-center justify-center rounded-2xl border border-cx-border bg-cx-card text-cx-accent shadow-lg sm:flex">
        <Icone nom="annuaire" className="h-6 w-6" />
      </div>
    </div>
  );
}
