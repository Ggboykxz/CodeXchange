import bcrypt from "bcryptjs";
import { REACTIONS } from "@/lib/reactions";
import { prisma } from "@/lib/db";
import {
  demandesDemo,
  evenementsDemo,
  favorisDemo,
  membresDemo,
  messagesDemo,
  notificationsDemo,
  offresDemo,
  projetsDemo,
  reponsesDemo,
  sujetsDemo,
  tutosDemo,
  type SeedMember,
} from "@/lib/seed-data";

const MOT_DE_PASSE_COMMUN = "CodeXchange2026!";

export type SeedResult = {
  users: number;
  posts: number;
  replies: number;
  reactions: number;
  jobs: number;
  applications: number;
  projects: number;
  events: number;
  tutorials: number;
  mentors: number;
  messages: number;
  notifications: number;
  favoris: number;
  mentorRequests: number;
};

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export async function runSeed(db: typeof prisma = prisma): Promise<SeedResult> {
  // Vider (children → parents).
  await db.rsvp.deleteMany();
  await db.reaction.deleteMany();
  await db.like.deleteMany();
  await db.reply.deleteMany();
  await db.application.deleteMany();
  await db.projectMember.deleteMany();
  await db.mentorRequest?.deleteMany?.().catch(() => {});
  await db.message.deleteMany();
  await db.notification.deleteMany();
  await db.favorite.deleteMany();
  await db.session.deleteMany();
  await db.post.deleteMany();
  await db.job.deleteMany();
  await db.project.deleteMany();
  await db.event.deleteMany();
  await db.tutorial.deleteMany();
  await db.user.deleteMany();

  const now = new Date();
  const hash = await bcrypt.hash(MOT_DE_PASSE_COMMUN, 12);

  const users: (SeedMember & { id: number })[] = [];
  for (const m of membresDemo) {
    const u = await db.user.create({
      data: {
        email: m.email,
        passwordHash: hash,
        nom: m.nom,
        slug: m.slug,
        titre: m.titre,
        ville: m.ville,
        pays: m.pays,
        bio: m.bio,
        stack: m.stack.join(","),
        github: m.github ?? "",
        linkedin: "",
        site: "",
        role: m.role,
        verified: m.role !== "MEMBER", // mentors + admins : badge de vérification
      },
    });
    users.push({ ...m, id: u.id });
  }
  const byIndex = (n: number) => users[n % users.length]!;

  // --- forum ---
  const posts: { id: number; auteur: (SeedMember & { id: number }) }[] = [];
  for (let i = 0; i < sujetsDemo.length; i++) {
    const s = sujetsDemo[i]!;
    const auteur = byIndex(i * 7);
    const p = await db.post.create({
      data: {
        titre: s.titre,
        corps: s.corps,
        tags: s.tags.join(","),
        authorId: auteur.id,
      },
    });
    posts.push({ id: p.id, auteur });
  }
  // 1 réponse pour chacun des 15 sujets -> Replies >= 15.
  let replies = 0;
  const reponsesCreees: { id: number; postId: number; authorId: number }[] = [];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]!;
    const auteur = byIndex(i + 3);
    const r = await db.reply.create({
      data: { corps: "Merci, ça m'a aidé à avancer !", postId: p.id, authorId: auteur.id },
    });
    reponsesCreees.push({ id: r.id, postId: p.id, authorId: auteur.id });
    replies += 1;
  }
  // likes sur les 10 premiers sujets.
  for (let i = 0; i < 10; i++) {
    const likedBy = byIndex(i + 5);
    if (likedBy.id === posts[i]!.auteur.id) continue;
    await db.like.create({ data: { userId: likedBy.id, postId: posts[i]!.id } }).catch(() => {});
  }
  // Réactions sociales : réparties sur posts et réponses, pour une démo vivante.
const EMOJIS = REACTIONS.map((reaction) => reaction.emoji);
  let reactions = 0;
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]!;
    // 2 à 3 réacteurs différents par post (jamais l'auteur lui-même).
    for (let k = 0; k < 3; k++) {
      const reacteur = byIndex(i * 2 + k + 1);
      if (reacteur.id === post.auteur.id) continue;
      const emoji = EMOJIS[(i + k) % EMOJIS.length]!;
      await db.reaction
        .create({ data: { userId: reacteur.id, kind: "post", targetId: post.id, emoji } })
        .then(() => { reactions += 1; })
        .catch(() => {});
    }
  }
  for (const r of reponsesCreees) {
    for (let k = 0; k < 2; k++) {
      const reacteur = byIndex(r.id + k + 4);
      if (reacteur.id === r.authorId) continue;
      const emoji = EMOJIS[(r.id + k) % EMOJIS.length]!;
      await db.reaction
        .create({ data: { userId: reacteur.id, kind: "reply", targetId: r.id, emoji } })
        .then(() => { reactions += 1; })
        .catch(() => {});
    }
  }

  // --- jobs + candidatures ---
  let applications = 0;
  const jobs: { id: number }[] = [];
  for (let i = 0; i < offresDemo.length; i++) {
    const o = offresDemo[i]!;
    const auteur = byIndex(i * 11);
    const job = await db.job.create({
      data: {
        titre: o.titre,
        entreprise: o.entreprise,
        contrat: o.contrat,
        remote: o.remote,
        pays: o.pays,
        ville: o.ville,
        lien: o.lien,
        authorId: auteur.id,
      },
    });
    jobs.push({ id: job.id });
    // 2 candidatures distinctes par offre.
    const candidats = [byIndex(i + 1), byIndex(i + 19)].filter((u) => u.id !== auteur.id);
    for (const c of candidats.slice(0, 2)) {
      await db.application
        .create({ data: { jobId: job.id, userId: c.id } })
        .then(() => {
          applications += 1;
        })
        .catch(() => {});
    }
  }

  // --- projets + membres ---
  const projects: { id: number }[] = [];
  for (let i = 0; i < projetsDemo.length; i++) {
    const pr = projetsDemo[i]!;
    const auteur = byIndex(i * 13);
    const project = await db.project.create({
      data: {
        titre: pr.titre,
        description: pr.description,
        stack: pr.stack.join(","),
        cherche: pr.cherche.join(","),
        lien: pr.lien ?? "",
        authorId: auteur.id,
      },
    });
    projects.push({ id: project.id });
    const m1 = byIndex(i + 2);
    const m2 = byIndex(i + 9);
    for (const m of [m1, m2]) {
      if (m.id === auteur.id) continue;
      await db.projectMember
        .create({ data: { projectId: project.id, userId: m.id } })
        .catch(() => {});
    }
  }

  // --- événements + RSVP ---
  const events: { id: number }[] = [];
  for (let i = 0; i < evenementsDemo.length; i++) {
    const e = evenementsDemo[i]!;
    const ev = await db.event.create({
      data: {
        titre: e.titre,
        description: e.description,
        date: addDays(now, e.decalageJours),
        format: e.format,
        ville: e.ville,
        pays: e.pays,
        lien: e.lien,
      },
    });
    events.push({ id: ev.id });
  }
  // 3 RSVP par événement.
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]!;
    for (let k = 0; k < 3; k++) {
      const u = byIndex(i + k * 6);
      await db.rsvp.create({ data: { eventId: ev.id, userId: u.id } }).catch(() => {});
    }
  }

  // --- tutos ---
  const tutorials: { id: number }[] = [];
  for (let i = 0; i < tutosDemo.length; i++) {
    const t = tutosDemo[i]!;
    const auteur = byIndex(i * 17);
    const tut = await db.tutorial.create({
      data: {
        slug: t.slug,
        titre: t.titre,
        resume: t.resume,
        corps: t.corps,
        tags: t.tags.join(","),
        dureeMin: t.dureeMin,
        authorId: auteur.id,
      },
    });
    tutorials.push({ id: tut.id });
  }

  const mentors = membresDemo.filter((m) => m.role === "MENTOR").length;

  // --- réponses variées (au-delà du « Merci » générique) ---
  const baseReponses = reponsesCreees.length;
  for (let i = 0; i < reponsesDemo.length; i++) {
    const rep = reponsesDemo[i]!;
    const sujet = posts[rep.sujetIndex];
    const auteur = users[rep.auteurIndex];
    if (!sujet || !auteur) continue;
    // `repondA` : index (dans reponsesDemo) de la réponse parente pour un fil imbriqué.
    const parentId = rep.repondA !== undefined ? reponsesCreees[baseReponses + rep.repondA]?.id : undefined;
    const r = await db.reply.create({
      data: { corps: rep.corps, postId: sujet.id, authorId: auteur.id, parentId },
    });
    reponsesCreees.push({ id: r.id, postId: sujet.id, authorId: auteur.id });
    replies += 1;
  }

  // --- demandes de mentorat ---
  const parEmail = (email: string) => users.find((u) => u.email === email);
  let mentorRequests = 0;
  for (const d of demandesDemo) {
    const demandeur = parEmail(d.demandeur);
    const mentor = parEmail(d.mentor);
    if (!demandeur || !mentor) continue;
    await db.mentorRequest
      .create({ data: { mentorId: mentor.id, requesterId: demandeur.id, message: d.message } })
      .then(() => { mentorRequests += 1; })
      .catch(() => {});
  }

  // --- messagerie : fils de discussion du compte de démo (et d'autres membres) ---
  let messages = 0;
  for (const m of messagesDemo) {
    const de = parEmail(m.de);
    const vers = parEmail(m.vers);
    if (!de || !vers) continue;
    await db.message.create({
      data: {
        senderId: de.id,
        recipientId: vers.id,
        corps: m.corps,
        isRead: m.lu,
        createdAt: addDays(now, m.jours),
      },
    });
    messages += 1;
  }

  // --- notifications (2 non lues, réparties sur aujourd'hui / semaine / plus ancien) ---
  const liens: Record<string, string> = {
    "@sujet0": `/forum/${posts[0]!.id}`,
    "@job0": `/jobs/${jobs[0]!.id}`,
    "@mentorat": "/mentorat",
  };
  let notifications = 0;
  for (const n of notificationsDemo) {
    const destinataire = parEmail(n.destinataire);
    if (!destinataire) continue;
    await db.notification.create({
      data: {
        userId: destinataire.id,
        type: n.type,
        text: n.text,
        lien: liens[n.lien] ?? n.lien,
        isRead: n.lue,
        createdAt: addDays(now, n.jours),
      },
    });
    notifications += 1;
  }

  // --- favoris (un de chaque type pour le compte de démo) ---
  const ciblesFavoris: Record<string, number[]> = {
    post: posts.map((p) => p.id),
    job: jobs.map((j) => j.id),
    projet: projects.map((p) => p.id),
    tuto: tutorials.map((t) => t.id),
    event: events.map((e) => e.id),
    membre: users.map((u) => u.id),
  };
  let favoris = 0;
  for (const f of favorisDemo) {
    const proprietaire = parEmail(f.utilisateur);
    const targetId = ciblesFavoris[f.kind]?.[f.cibleIndex];
    if (!proprietaire || targetId === undefined) continue;
    await db.favorite
      .create({ data: { userId: proprietaire.id, kind: f.kind, targetId } })
      .then(() => { favoris += 1; })
      .catch(() => {});
  }

  return {
    users: users.length,
    posts: posts.length,
    replies,
    reactions,
    jobs: jobs.length,
    applications,
    projects: projects.length,
    events: events.length,
    tutorials: tutorials.length,
    mentors,
    messages,
    notifications,
    favoris,
    mentorRequests,
  };
}