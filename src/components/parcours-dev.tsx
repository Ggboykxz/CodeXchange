import Link from "next/link";
import { Icone } from "@/components/icones";
import type { EtapeParcours } from "@/lib/parcours";

/**
 * Parcours « dev & web » : étapes réellement accomplies (ou non) par le
 * membre. Servant de fil rouge sur l'accueil et le profil.
 */
export default function ParcoursDev({ etapes }: { etapes: EtapeParcours[] }) {
  const accomplies = etapes.filter((e) => e.fait).length;

  return (
    <section className="rounded-2xl border border-cx-border bg-cx-card/60 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Ton parcours dev</h2>
          <p className="text-xs text-cx-muted-fg">
            {accomplies}/{etapes.length} étapes accomplies — la communauté avance avec toi.
          </p>
        </div>
        <span className="rounded-full bg-cx-primary/5 px-3 py-1 text-xs font-bold text-cx-primary tabular-nums">
          {Math.round((accomplies / etapes.length) * 100)} %
        </span>
      </div>

      {/* Barre de progression. */}
      <div
        role="progressbar"
        aria-valuenow={accomplies}
        aria-valuemin={0}
        aria-valuemax={etapes.length}
        aria-label="Progression du parcours"
        className="mt-3 h-2 overflow-hidden rounded-full bg-cx-muted"
      >
        <div
          className="h-full rounded-full bg-cx-primary motion-reduce:transition-none"
          style={{ width: `${(accomplies / etapes.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {etapes.map((e) => (
          <li key={e.id}>
            <Link
              href={e.href}
              className={`flex items-start gap-3 rounded-lg px-2 py-2 transition ${
                e.fait ? "hover:bg-cx-muted" : "hover:bg-cx-muted/60"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  e.fait
                    ? "border-cx-primary bg-cx-primary text-cx-primary-fg"
                    : "border-cx-border text-cx-muted-fg"
                }`}
                aria-hidden="true"
              >
                {e.fait ? <Icone nom="coche" className="size-3.5" /> : "○"}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${e.fait ? "text-cx-fg" : "text-cx-muted-fg"}`}>
                  {e.libelle}
                </span>
                <span className="block text-xs text-cx-muted-fg">{e.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
