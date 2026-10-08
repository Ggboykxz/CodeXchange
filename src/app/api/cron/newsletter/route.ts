import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import {
  digestHtml,
  digestSubject,
  digestText,
  monthLabel,
  nlToken,
  unsubscribeUrl,
  type DigestData,
} from "@/lib/newsletter";

/** Fenêtre du digest : le mois glissant couvert par le prochain envoi. */
const WINDOW_DAYS = 30;

/**
 * GET /api/cron/newsletter — digest mensuel (I5).
 *
 * Déclenché par le cron Vercel (`vercel.json`, le 1er du mois à 06:00
 * UTC) avec `Authorization: Bearer ${CRON_SECRET}`. **Fail closed** :
 * sans `CRON_SECRET` posé, ou avec un en-tête absent/faux, c'est 401 —
 * jamais d'envoi non autorisé, jamais d'envoi « par défaut ».
 *
 * `?dryRun=1` construit le digest et compte les destinataires **sans
 * rien envoyer** : la vérification de prod se fait sans courrier risqué.
 *
 * Sans SMTP (I4), `sendMail` résout `preview` : le contenu complet est
 * alors imprimé dans le journal, ce qui permet de relire le digest en
 * dev comme en prod avant que le SMTP ne soit posé.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const auth = req.headers.get("authorization") ?? "";
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const origin = req.nextUrl.origin;
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
    const now = new Date();

    const [threads, jobs, projects, tutorials, events, newMembers, subscribers] =
      await Promise.all([
        db.thread.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { upvotes: "desc" },
          take: 5,
          select: { title: true, slug: true, upvotes: true },
        }),
        db.job.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { title: true, company: true },
        }),
        db.project.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { stars: "desc" },
          take: 3,
          select: { name: true, slug: true, tagline: true },
        }),
        db.tutorial.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { title: true, slug: true, readTime: true },
        }),
        db.event.findMany({
          where: { date: { gte: now } },
          orderBy: { date: "asc" },
          take: 3,
          select: { title: true, date: true, location: true, online: true },
        }),
        db.user.count({ where: { createdAt: { gte: since } } }),
        db.newsletterSubscriber.findMany({
          where: { unsubscribedAt: null },
          select: { email: true },
        }),
      ]);

    const dateLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

    const data: DigestData = {
      month: monthLabel(now),
      threads: threads.map((t) => ({
        title: t.title,
        url: `${origin}/forum/${t.slug}`,
        meta: t.upvotes > 0 ? `${t.upvotes} upvote${t.upvotes > 1 ? "s" : ""}` : undefined,
      })),
      jobs: jobs.map((j) => ({ title: j.title, url: `${origin}/jobs`, meta: j.company })),
      projects: projects.map((p) => ({
        title: p.name,
        url: `${origin}/projects`,
        meta: p.tagline,
      })),
      tutorials: tutorials.map((t) => ({
        title: t.title,
        url: `${origin}/tutos`,
        meta: `${t.readTime} min de lecture`,
      })),
      events: events.map((e) => ({
        title: e.title,
        url: `${origin}/tutos`,
        meta: `${dateLabel.format(e.date)} · ${e.online ? "en ligne" : e.location ?? "sur place"}`,
      })),
      newMembers,
    };

    const subject = digestSubject(data);
    const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

    if (dryRun) {
      return NextResponse.json(
        {
          ok: true,
          dryRun: true,
          subject,
          subscribers: subscribers.length,
          sections: {
            threads: data.threads.length,
            jobs: data.jobs.length,
            projects: data.projects.length,
            tutorials: data.tutorials.length,
            events: data.events.length,
          },
          newMembers,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    let sent = 0;
    let preview = 0;
    for (const subscriber of subscribers) {
      const url = unsubscribeUrl(origin, nlToken(subscriber.email));
      const result = await sendMail({
        to: subscriber.email,
        subject,
        html: digestHtml(data, url),
        text: digestText(data, url),
      });
      if (result === "sent") sent++;
      else preview++;
    }

    logger.info(
      `Newsletter digest « ${subject} » — ${subscribers.length} abonné(s) actif(s), ${sent} envoyé(s), ${preview} aperçu(s)`
    );
    return NextResponse.json(
      { ok: true, subject, total: subscribers.length, sent, preview },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logger.route("Newsletter cron error", e);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
