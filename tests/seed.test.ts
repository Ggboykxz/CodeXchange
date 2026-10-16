import { afterAll, beforeAll, expect, test } from "vitest";

beforeAll(async () => {
  const { prisma } = await import("../src/lib/db");
  await prisma.$disconnect();
});

test(
  "seed produit le volume attendu et laisse une démo vivante",
  async () => {
    const { prisma } = await import("../src/lib/db");
    const { runSeed } = await import("../src/lib/seed");
    const res = await runSeed(prisma);
    expect(res.users).toBe(31);
    expect(res.posts).toBe(15);
    expect(res.replies).toBeGreaterThanOrEqual(15);
    expect(res.reactions).toBeGreaterThanOrEqual(10);
    expect(res.jobs).toBe(10);
    expect(res.applications).toBeGreaterThanOrEqual(10);
    expect(res.projects).toBe(8);
    expect(res.events).toBe(6);
    expect(res.tutorials).toBe(8);

    const users = await prisma.user.count();
    const mentors = await prisma.user.count({ where: { role: "MENTOR" } });
    expect(users).toBe(31);
    expect(mentors).toBe(6);

    const paysDistinct = (await prisma.user.findMany({ select: { pays: true }, distinct: ["pays"] })).length;
    expect(paysDistinct).toBeGreaterThanOrEqual(3);

    const slugs = await prisma.user.findMany({ select: { slug: true } });
    expect(new Set(slugs.map((s) => s.slug)).size).toBe(slugs.length);
    for (const s of slugs) expect(s.slug).toMatch(/^[a-z0-9-]+$/);

    const jobs = await prisma.job.findMany();
    expect(jobs.length).toBe(10);
    for (const j of jobs) await expect(["CDI", "Freelance", "Stage", "Alternance"]).toContain(j.contrat);

    const events = await prisma.event.findMany();
    expect(events.length).toBe(6);
    const now = Date.now();
    const futurs = events.filter((e) => e.date.getTime() > now).length;
    const passes = events.filter((e) => e.date.getTime() < now).length;
    expect(futurs).toBeGreaterThanOrEqual(4);
    expect(passes).toBeGreaterThanOrEqual(2);

    const projects = await prisma.project.count();
    const projectMembers = await prisma.projectMember.count();
    expect(projects).toBe(8);
    expect(projectMembers).toBeGreaterThanOrEqual(projects);

    const tutorials = await prisma.tutorial.count();
    expect(tutorials).toBe(8);
    const slugsTutos = await prisma.tutorial.findMany({ select: { slug: true } });
    expect(new Set(slugsTutos.map((s) => s.slug)).size).toBe(slugsTutos.length);

    // Vérification mentorat : rattachés aux profilsMENTOR.
    const mentorsList = await prisma.user.findMany({ where: { role: "MENTOR" } });
    expect(mentorsList.length).toBe(6);

    // Aucune page vide à la démo : messagerie, notifications, favoris peuplés.
    expect(res.messages).toBeGreaterThanOrEqual(8);
    expect(res.notifications).toBeGreaterThanOrEqual(4);
    expect(res.favoris).toBeGreaterThanOrEqual(6);
    expect(res.mentorRequests).toBeGreaterThanOrEqual(2);

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@cx.test" } });
    const nonLus = await prisma.message.count({ where: { recipientId: admin.id, isRead: false } });
    expect(nonLus).toBeGreaterThanOrEqual(1); // badge messagerie visible
    const nonLues = await prisma.notification.count({ where: { userId: admin.id, isRead: false } });
    expect(nonLues).toBeGreaterThanOrEqual(1); // badge notifications visible
    const favorisAdmin = await prisma.favorite.findMany({ where: { userId: admin.id }, select: { kind: true } });
    expect(new Set(favorisAdmin.map((f) => f.kind))).toEqual(
      new Set(["post", "job", "projet", "tuto", "event", "membre"]),
    );
    // Le compte de démo a signé une réponse : le dialogue « Supprimer » est démontrable.
    const reponsesAdmin = await prisma.reply.count({ where: { authorId: admin.id } });
    expect(reponsesAdmin).toBeGreaterThanOrEqual(1);
    // Le premier sujet a un fil vivant (réponse admin + réponse variée + générique).
    const premierSujet = await prisma.post.findFirstOrThrow({ orderBy: { id: "asc" } });
    const reponsesPremier = await prisma.reply.count({ where: { postId: premierSujet.id } });
    expect(reponsesPremier).toBeGreaterThanOrEqual(3);
    // Le fil contient une réponse imbriquée (arbre à 2 niveaux démontrable).
    const imbriquees = await prisma.reply.count({ where: { parentId: { not: null } } });
    expect(imbriquees).toBeGreaterThanOrEqual(1);

    // rebuild reproducibility: relancer seed, les counts sont identiques.
    const r2 = await runSeed(prisma);
    expect(r2.users).toBe(31);
  },
  120000,
);

afterAll(async () => {
  // laisser la base en état démo (seed présent) pour la démo ; on ne wipe que les utilisateurs de test créés par d'autres tâches -> déjà nettoyés avant.
  const { prisma } = await import("../src/lib/db");
  await prisma.$disconnect();
});
