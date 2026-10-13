import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAdminStats } from "@/lib/admin";
import BoutonModeration from "./bouton-moderation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration" };

export default async function PageAdmin() {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/connexion");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();
  const [sujets, reponses, offres] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, titre: true, createdAt: true } }),
    prisma.reply.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, corps: true, createdAt: true } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, titre: true, createdAt: true } }),
  ]);

  const cartes = [
    { label: "Membres", valeur: stats.membres },
    { label: "Sujets", valeur: stats.sujets },
    { label: "Réponses", valeur: stats.reponses },
    { label: "Offres", valeur: stats.offres },
    { label: "Projets", valeur: stats.projets },
    { label: "Événements", valeur: stats.evenements },
    { label: "Tutos", valeur: stats.tutos },
    { label: "Messages", valeur: stats.messages },
    { label: "Notifications", valeur: stats.notifications },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Administration</h1>

      <section className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {cartes.map((c) => (
          <div key={c.label} className="rounded-xl border border-cx-border bg-cx-card px-4 py-3 text-center">
            <p className="text-2xl font-black text-cx-primary">{c.valeur}</p>
            <p className="text-xs text-cx-muted-fg">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">Sujets récents</h2>
        <ul className="divide-y divide-cx-border">
          {sujets.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <Link href={`/forum/${s.id}`} className="truncate hover:text-cx-primary">{s.titre}</Link>
              <BoutonModeration type="post" id={s.id} label="ce sujet" />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">Réponses récentes</h2>
        <ul className="divide-y divide-cx-border">
          {reponses.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <span className="truncate text-cx-muted-fg">{r.corps}</span>
              <BoutonModeration type="reply" id={r.id} label="cette réponse" />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">Offres récentes</h2>
        <ul className="divide-y divide-cx-border">
          {offres.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <Link href={`/jobs/${o.id}`} className="truncate hover:text-cx-primary">{o.titre}</Link>
              <BoutonModeration type="job" id={o.id} label="cette offre" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
