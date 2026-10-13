import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  evenementsDemo,
  membresDemo,
  offresDemo,
  projetsDemo,
  sujetsDemo,
  tutosDemo,
  type SeedMember,
} from "@/lib/seed-data";

const MOT_DE_PASSE_COMMUN = "CodeXchange2026!";

export type SeedResult = {
  users: number;
  posts: number;
  replies: number;
  jobs: number;
  applications: number;
  projects: number;
  events: number;
  tutorials: number;
  mentors: number;
};

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export async function runSeed(db: typeof prisma = prisma): Promise<SeedResult> {
  // Vider (children → parents).
  await db.rsvp.deleteMany();
  await db.like.deleteMany();
  await db.reply.deleteMany();
  await db.application.deleteMany();
  await db.projectMember.deleteMany();
  await db.mentorRequest?.deleteMany?.().catch(() => {});
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
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]!;
    const auteur = byIndex(i + 3);
    await db.reply.create({
      data: { corps: "Merci, ça m'a aidé à avancer !", postId: p.id, authorId: auteur.id },
    });
    replies += 1;
  }
  // likes sur les 10 premiers sujets.
  for (let i = 0; i < 10; i++) {
    const likedBy = byIndex(i + 5);
    if (likedBy.id === posts[i]!.auteur.id) continue;
    await db.like.create({ data: { userId: likedBy.id, postId: posts[i]!.id } }).catch(() => {});
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

  return {
    users: users.length,
    posts: posts.length,
    replies,
    jobs: jobs.length,
    applications,
    projects: projects.length,
    events: events.length,
    tutorials: tutorials.length,
    mentors,
  };
}
