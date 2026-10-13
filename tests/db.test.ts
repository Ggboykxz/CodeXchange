import { afterAll, expect, test } from "vitest";
import { prisma } from "../src/lib/db";

test("le client Prisma expose les modèles du spec", async () => {
  const modeles = [
    "user",
    "session",
    "post",
    "reply",
    "like",
    "job",
    "application",
    "project",
    "projectMember",
    "event",
    "rsvp",
    "tutorial",
    "mentorRequest",
    "notification",
  ] as const;
  for (const m of modeles) {
    expect(typeof (prisma[m] as { count: unknown }).count).toBe("function");
  }
  await expect(prisma.user.count()).resolves.toBeTypeOf("number");
});

afterAll(async () => {
  await prisma.$disconnect();
});
