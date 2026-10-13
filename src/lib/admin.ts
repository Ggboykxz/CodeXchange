import { prisma } from "./db";

export type StatsAdmin = {
  membres: number;
  sujets: number;
  reponses: number;
  offres: number;
  projets: number;
  evenements: number;
  tutos: number;
  messages: number;
  notifications: number;
};

export async function getAdminStats(): Promise<StatsAdmin> {
  const [membres, sujets, reponses, offres, projets, evenements, tutos, messages, notifications] =
    await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.reply.count(),
      prisma.job.count(),
      prisma.project.count(),
      prisma.event.count(),
      prisma.tutorial.count(),
      prisma.message.count(),
      prisma.notification.count(),
    ]);
  return { membres, sujets, reponses, offres, projets, evenements, tutos, messages, notifications };
}

export async function adminDeletePost(postId: number): Promise<void> {
  await prisma.post.delete({ where: { id: postId } });
}

export async function adminDeleteReply(replyId: number): Promise<void> {
  await prisma.reply.delete({ where: { id: replyId } });
}

export async function adminDeleteJob(jobId: number): Promise<void> {
  await prisma.job.delete({ where: { id: jobId } });
}
