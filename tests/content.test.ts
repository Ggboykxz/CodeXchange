import { describe, expect, it } from "vitest";
import {
  eventCreateSchema,
  eventUpdateSchema,
  isValidEventRange,
  jobCreateSchema,
  jobUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  readMinutes,
  tutorialCreateSchema,
  tutorialUpdateSchema,
} from "@/lib/validate";
import { slugify } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Offres d'emploi                                                      */
/* ------------------------------------------------------------------ */

const job = {
  title: "Lead Frontend Engineer",
  company: "Wave",
  location: "Dakar",
  country: "Sénégal",
  remote: true,
  type: "full-time",
  stack: "React, TypeScript, Next.js",
  salary: "3-5K EUR / month",
  description: "Tu encadres l'équipe front du wallet.",
  applyUrl: "https://wave.com/careers/123",
};

describe("jobCreateSchema", () => {
  it("accepte une offre complète", () => {
    const r = jobCreateSchema.safeParse(job);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.remote).toBe(true);
  });

  it("applique les défauts (remote, type) quand ils sont absents", () => {
    const r = jobCreateSchema.safeParse({
      title: "Dev Go",
      company: "Kora",
      description: "Backend paiements.",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ remote: true, type: "full-time", stack: "" });
  });

  it.each([
    ["titre trop court", { title: "Dev" }],
    ["entreprise absente", { company: undefined }],
    ["description vide", { description: "" }],
    ["type hors barème", { type: "night-shift" }],
  ])("refuse %s", (_label, patch) => {
    expect(jobCreateSchema.safeParse({ ...job, ...patch }).success).toBe(false);
  });

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html;base64,PHNjcmlwdD4="],
    ["sans schéma", "wave.com/careers"],
    ["trop long", "https://example.com/" + "a".repeat(400)],
  ])("refuse l'URL %s", (_label, applyUrl) => {
    expect(jobCreateSchema.safeParse({ ...job, applyUrl }).success).toBe(false);
  });

  it("accepte un lien absent ou effacé", () => {
    expect(jobCreateSchema.safeParse({ ...job, applyUrl: undefined }).success).toBe(true);
    expect(jobCreateSchema.safeParse({ ...job, applyUrl: null }).success).toBe(true);
  });
});

describe("jobUpdateSchema — PATCH partiel", () => {
  it("n'impose que les champs fournis", () => {
    expect(jobUpdateSchema.safeParse({ salary: "4-6K EUR" }).success).toBe(true);
  });

  it("les champs absents valent undefined (inchangés), jamais null", () => {
    const r = jobUpdateSchema.safeParse({ title: "Senior Frontend" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("Senior Frontend");
      // Aucun défaut ne doit fuir dans un PATCH : sinon `remote`, `type` et
      // `stack` repassaient à leur valeur de création à chaque édition.
      expect(r.data.remote).toBeUndefined();
      expect(r.data.type).toBeUndefined();
      expect(r.data.stack).toBeUndefined();
      expect(r.data.company).toBeUndefined();
      // Seul `title` est réellement fourni → une seule colonne modifiée.
      expect(Object.entries(r.data).filter(([, v]) => v !== undefined)).toEqual([
        ["title", "Senior Frontend"],
      ]);
    }
  });

  it("un PATCH vide ne change strictement rien", () => {
    const r = jobUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(Object.values(r.data).every((v) => v === undefined)).toBe(true);
    }
  });

  it("valide les champs fournis comme à la création", () => {
    expect(jobUpdateSchema.safeParse({ type: "night-shift" }).success).toBe(false);
    expect(jobUpdateSchema.safeParse({ applyUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Projets                                                              */
/* ------------------------------------------------------------------ */

const project = {
  name: "Kora API",
  tagline: "Paiements mobiles pour l'Afrique de l'Ouest",
  description: "Une API de collecte, paiement et KYC.",
  repoUrl: "https://github.com/kora/api",
  demoUrl: "https://kora.dev",
  stack: "Go, PostgreSQL",
  status: "beta",
  lookingFor: "backend,design",
};

describe("projectCreateSchema", () => {
  it("accepte un projet complet", () => {
    expect(projectCreateSchema.safeParse(project).success).toBe(true);
  });

  it("normalise les listes en CSV propre", () => {
    const r = projectCreateSchema.safeParse({ ...project, stack: " Go ,  Postgres ,, " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.stack).toBe("Go,Postgres");
  });

  it("n'envoie jamais de tableau au client : la liste reste un CSV", () => {
    const r = projectCreateSchema.safeParse({ ...project, lookingFor: ["backend"] });
    expect(r.success).toBe(false);
  });

  it.each([
    ["nom trop court", { name: "K" }],
    ["slogan trop court", { tagline: "OK" }],
    ["statut hors barème", { status: "dead" }],
  ])("refuse %s", (_label, patch) => {
    expect(projectCreateSchema.safeParse({ ...project, ...patch }).success).toBe(false);
  });

  it("le PATCH n'exige rien d'autre que le champ envoyé", () => {
    expect(projectUpdateSchema.safeParse({ status: "live" }).success).toBe(true);
    expect(projectUpdateSchema.safeParse({ status: "nope" }).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Tutoriels                                                            */
/* ------------------------------------------------------------------ */

const tutorial = {
  title: "Déployer Next.js sur Vercel",
  excerpt: "Du `git push` à la production en dix minutes.",
  body: "Étape 1 : relier le dépôt. ".repeat(40),
  category: "devops",
  tags: "nextjs, vercel",
  coverEmoji: "🚀",
};

describe("tutorialCreateSchema", () => {
  it("accepte un tuto complet", () => {
    expect(tutorialCreateSchema.safeParse(tutorial).success).toBe(true);
  });

  it.each([
    ["titre trop court", { title: "Next" }],
    ["extrait trop court", { excerpt: "Court" }],
    ["catégorie hors barème", { category: "crypto" }],
  ])("refuse %s", (_label, patch) => {
    expect(tutorialCreateSchema.safeParse({ ...tutorial, ...patch }).success).toBe(false);
  });

  it("borne l'émoji de couverture (pas une image distante)", () => {
    expect(tutorialCreateSchema.safeParse({ ...tutorial, coverEmoji: "🚀" }).success).toBe(true);
    expect(
      tutorialCreateSchema.safeParse({ ...tutorial, coverEmoji: "x".repeat(9) }).success
    ).toBe(false);
  });

  it("le PATCH n'impose que le champ envoyé", () => {
    expect(tutorialUpdateSchema.safeParse({ category: "ai" }).success).toBe(true);
    expect(tutorialUpdateSchema.safeParse({ category: "ai", body: "" }).success).toBe(false);
  });
});

describe("readMinutes — temps de lecture dérivé", () => {
  it("est au moins une minute et suit la longueur du corps", () => {
    expect(readMinutes("Une phrase.")).toBe(1);
    expect(readMinutes("mot ".repeat(400))).toBe(2);
    expect(readMinutes("mot ".repeat(2000))).toBe(10);
  });

  it("ne dépend que du texte réel (jamais saisi par l'auteur)", () => {
    const long = "word ".repeat(1000);
    expect(readMinutes(long)).toBe(5);
  });
});

/* ------------------------------------------------------------------ */
/* Événements                                                           */
/* ------------------------------------------------------------------ */

const event = {
  title: "DevFest Dakar 2026",
  description: "Une journée de conférences au Grand Théâtre.",
  date: "2026-11-14T09:00:00.000Z",
  endDate: "2026-11-14T18:00:00.000Z",
  location: "Dakar, Sénégal",
  online: false,
  url: "https://devfest.dakar.sn",
  coverEmoji: "🎤",
};

describe("eventCreateSchema", () => {
  it("accepte un événement complet", () => {
    expect(eventCreateSchema.safeParse(event).success).toBe(true);
  });

  it.each([
    ["date illisible", { date: "pas-une-date" }],
    ["date trop longue", { date: "x".repeat(50) }],
    ["fin illisible", { endDate: "demain matin" }],
    ["titre trop court", { title: "Dev" }],
  ])("refuse %s", (_label, patch) => {
    expect(eventCreateSchema.safeParse({ ...event, ...patch }).success).toBe(false);
  });

  it("accepte une fin absente", () => {
    expect(eventCreateSchema.safeParse({ ...event, endDate: null }).success).toBe(true);
  });

  it("le PATCH partiel tolère une seule date", () => {
    expect(eventUpdateSchema.safeParse({ location: "Abidjan" }).success).toBe(true);
    expect(eventUpdateSchema.safeParse({ date: "n'importe quoi" }).success).toBe(false);
  });
});

describe("isValidEventRange — la fin ne précède jamais le début", () => {
  const start = new Date("2026-11-14T09:00:00.000Z");

  it("accepte une fin postérieure ou absente", () => {
    expect(isValidEventRange(start, new Date("2026-11-14T18:00:00.000Z"))).toBe(true);
    expect(isValidEventRange(start, null)).toBe(true);
    expect(isValidEventRange(start, undefined)).toBe(true);
    expect(isValidEventRange(start, start)).toBe(true);
  });

  it("refuse une fin antérieure", () => {
    expect(isValidEventRange(start, new Date("2026-11-14T08:00:00.000Z"))).toBe(false);
  });

  it("refuse toute date invalide de part et d'autre", () => {
    expect(isValidEventRange(new Date("invalide"))).toBe(false);
    expect(isValidEventRange(start, new Date("invalide"))).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Slugs                                                                */
/* ------------------------------------------------------------------ */

describe("slugify", () => {
  it.each([
    ["Déployer en prod !", "deployer-en-prod"],
    ["  Espaces   partout  ", "espaces-partout"],
    ["Café & Croissant", "cafe-croissant"],
  ])("normalise %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("retombe sur un fallback quand il ne reste rien d'ASCII", () => {
    expect(slugify("日本語だけ", "projet")).toBe("projet");
    expect(slugify("???", "tuto")).toBe("tuto");
  });

  it("borne la longueur pour rester lisible dans l'URL", () => {
    expect(slugify("mot ".repeat(200)).length).toBeLessThanOrEqual(60);
  });
});
