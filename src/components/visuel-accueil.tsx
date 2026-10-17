import Avatar from "@/components/avatar";
import { Icone } from "@/components/icones";
import LogoTechno, { logoTechno } from "@/components/logo-techno";

type MembreVisuel = { slug: string; nom: string; avatar?: string | null };

type Props = {
  membres?: MembreVisuel[];
  tendance?: string;
  conversation?: { titre: string; auteur: string; extrait: string };
};

export default function VisuelAccueil({ membres, tendance, conversation }: Props) {
  const membresVisibles = (membres ?? []).slice(0, 3);
  const vedette = membresVisibles[0] ?? { slug: "aicha-ondo", nom: "Aïcha Ondo", avatar: undefined };
  const tendanceAffichee = tendance ?? "flutter";
  const titreConversation = conversation?.titre ?? "Retour d'expérience : Dart isolates en prod 🚀";
  const autriceConversation = conversation?.auteur ?? "Aïcha Ondo";
  const extraitConversation = conversation?.extrait ?? "On a doublé le débit en passant au pool de threads.";

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto mt-12 h-80 w-full max-w-3xl overflow-hidden rounded-3xl border border-cx-border bg-slate-950 text-slate-100 sm:h-96 lg:mt-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,.18) 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,255,255,.14) 1px, transparent 1px)",
        backgroundSize: "28px 28px, 36px 36px",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-900/10" />

      <div className="absolute left-4 top-6 w-52 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-3 shadow-2xl sm:left-10 sm:w-56">
        <div className="flex items-center gap-3">
          <Avatar slug={vedette.slug} nom={vedette.nom} avatar={vedette.avatar ?? undefined} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              {vedette.nom}
              {membresVisibles.length > 1 ? (
                <Icone nom="verifie" className="size-3.5 shrink-0 text-orange-400" />
              ) : null}
            </p>
            <p className="truncate text-xs text-slate-300">Ingénieure · Afrique</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-orange-400">
            { (membres ?? []).length > 0 ? `${(membres ?? []).length} membres actifs` : "237 membres actifs" }
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5">Niveau 6</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-4 w-60 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-3 shadow-2xl sm:right-10 sm:w-64">
        <p className="text-xs font-semibold text-slate-300">
          <span className="text-orange-400">#</span>
          {tendanceAffichee}
          {logoTechno(tendanceAffichee) ? (
            <span className="ml-2 inline-flex align-middle">
              <LogoTechno nom={tendanceAffichee} className="size-4" />
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug">{titreConversation}</p>
        <p className="mt-1 text-[11px] text-slate-300 truncate">{autriceConversation} : {extraitConversation}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-white/5 px-2 py-0.5">👍 34</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5">🔥 21</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5">❤️ 12</span>
        </div>
      </div>

      <div className="absolute right-8 top-8 hidden size-12 items-center justify-center rounded-2xl border border-cx-border bg-cx-card text-orange-400 shadow-lg sm:flex">
        <Icone nom="forum" className="size-6" />
      </div>
      <div className="absolute left-10 bottom-10 hidden size-12 items-center justify-center rounded-2xl border border-cx-border bg-cx-card text-orange-400 shadow-lg sm:flex">
        <Icone nom="annuaire" className="size-6" />
      </div>

      {membresVisibles.length >= 2 ? (
        <div className="absolute bottom-4 left-4 hidden gap-1 sm:flex">
          {membresVisibles.slice(1).map((m) => (
            <Avatar key={m.slug} slug={m.slug} nom={m.nom} avatar={m.avatar ?? undefined} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

