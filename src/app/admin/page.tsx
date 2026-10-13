import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAdminStats } from "@/lib/admin";
import { listReports, listBannedUsers } from "@/lib/reports";
import { localeCourante, t } from "@/lib/i18n";
import BoutonModeration from "./bouton-moderation";
import CartesStats from "./cartes-stats";
import ActionsSignalement from "./actions-signalement";
import ActionsMembre from "./actions-membre";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration" };

export default async function PageAdmin() {
  const [userId, locale] = await Promise.all([getSessionUserId(), localeCourante()]);
  if (userId === null) redirect("/connexion");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();
  const [signalements, bannis, membres] = await Promise.all([
    listReports(),
    listBannedUsers(),
    prisma.user.findMany({
      orderBy: { nom: "asc" },
      take: 100,
      select: { id: true, nom: true, titre: true, bannedAt: true },
    }),
  ]);
  const [sujets, reponses, offres] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, titre: true, createdAt: true } }),
    prisma.reply.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, corps: true, createdAt: true } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, titre: true, createdAt: true } }),
  ]);


  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">{t(locale, "admin.title")}</h1>

      <CartesStats statsInitiaux={stats} />

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">{t(locale, "admin.recent_posts")}</h2>
        <ul className="divide-y divide-cx-border">
          {sujets.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <Link href={`/forum/${s.id}`} className="truncate hover:text-cx-primary">{s.titre}</Link>
              <BoutonModeration type="post" id={s.id} label={t(locale, "admin.posts")} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">{t(locale, "admin.recent_replies")}</h2>
        <ul className="divide-y divide-cx-border">
          {reponses.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <span className="truncate text-cx-muted-fg">{r.corps}</span>
              <BoutonModeration type="reply" id={r.id} label={t(locale, "admin.replies")} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">{t(locale, "admin.recent_jobs")}</h2>
        <ul className="divide-y divide-cx-border">
          {offres.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
              <Link href={`/jobs/${o.id}`} className="truncate hover:text-cx-primary">{o.titre}</Link>
              <BoutonModeration type="job" id={o.id} label={t(locale, "admin.jobs")} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">
          {t(locale, "admin.reports")} ({signalements.length})
        </h2>
        {signalements.length === 0 ? (
          <p className="px-5 py-4 text-sm text-cx-muted-fg">{t(locale, "admin.reports_none")}</p>
        ) : (
          <ul className="divide-y divide-cx-border">
            {signalements.map((rep) => (
              <li key={rep.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{rep.kind} #{rep.targetId} — {rep.reporter.nom}</p>
                  <p className="truncate text-cx-muted-fg">{rep.raison}</p>
                </div>
                {rep.statut === "PENDING" ? (
                  <ActionsSignalement reportId={rep.id} />
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-cx-muted-fg">{rep.statut === "PENDING" ? t(locale, "admin.reports") : t(locale, "admin.reject")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">
          {t(locale, "admin.banned")} ({bannis.length})
        </h2>
        {bannis.length === 0 ? (
          <p className="px-5 py-4 text-sm text-cx-muted-fg">{t(locale, "admin.banned_none")}</p>
        ) : (
          <ul className="divide-y divide-cx-border">
            {bannis.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{m.nom}</p>
                  <p className="truncate text-cx-muted-fg">{m.email}</p>
                </div>
                <ActionsMembre userId={m.id} banni />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-cx-border bg-cx-card">
        <h2 className="border-b border-cx-border px-5 py-3 font-semibold">
          {t(locale, "admin.manage_members")}
        </h2>
        <ul className="divide-y divide-cx-border">
          {membres.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{m.nom}</span>
                <span className="text-xs text-cx-muted-fg">{m.titre}</span>
                {m.bannedAt ? (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {t(locale, "admin.suspended")}
                  </span>
                ) : null}
              </div>
              <ActionsMembre userId={m.id} banni={Boolean(m.bannedAt)} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
