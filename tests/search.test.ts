import { describe, expect, it } from "vitest";
import { normalizeQuery, toResult, type SearchRows } from "@/lib/search";

const emptyRows: SearchRows = {
  threads: [],
  jobs: [],
  projects: [],
  tutorials: [],
  events: [],
  people: [],
};

describe("normalizeQuery — la requête qui part au serveur est stable", () => {
  it("trim et fusion des espaces", () => {
    expect(normalizeQuery("  kubernetes   coûts  ")).toBe("kubernetes coûts");
  });

  it("plafonne à 80 caractères", () => {
    expect(normalizeQuery("a".repeat(120)).length).toBe(80);
  });

  it("null / vide / blanc → chaîne vide", () => {
    expect(normalizeQuery(null)).toBe("");
    expect(normalizeQuery(undefined)).toBe("");
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("toResult — groupes formés, sections vides écartées", () => {
  it("aucun résultat → zéro groupe, zéro total", () => {
    const r = toResult("kubernetes", emptyRows);
    expect(r.groups).toEqual([]);
    expect(r.total).toBe(0);
    expect(r.query).toBe("kubernetes");
  });

  it("les href portent les vraies ancres (détail forum, sections sinon)", () => {
    const r = toResult("api", {
      ...emptyRows,
      threads: [{ title: "Comment structurer une API ?", slug: "comment-structurer-une-api", category: "backend", upvotes: 7 }],
      jobs: [{ title: "Backend Node", company: "Wave" }],
      projects: [{ name: "codexchange", tagline: "réseau dev africain" }],
      tutorials: [{ title: "API REST propre", readTime: 6 }],
      events: [{ title: "Meetup Abidjan", date: new Date(Date.UTC(2026, 9, 15, 18)), location: "Abidjan", online: false }],
      people: [{ name: "Aïcha", username: "aicha.diallo" }],
    });

    expect(r.total).toBe(6);
    const hrefs = r.groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toEqual([
      "#forum/comment-structurer-une-api",
      "#jobs",
      "#projects",
      "#tutos",
      "#tutos",
      "#annuaire/aicha.diallo",
    ]);
  });

  it("les sous-titres remplissent l'information utile", () => {
    const r = toResult("k", {
      ...emptyRows,
      threads: [{ title: "K", slug: "k", category: "devops", upvotes: 12 }],
      events: [{ title: "Conf", date: new Date(Date.UTC(2026, 9, 15)), location: null, online: true }],
      people: [{ name: "Ada", username: "ada" }],
    });
    const byKind = Object.fromEntries(r.groups.map((g) => [g.kind, g.items[0]]));
    expect(byKind.threads.sub).toBe("devops · 12 upvotes");
    expect(byKind.events.sub).toContain("en ligne");
    expect(byKind.people.sub).toBe("@ada");
  });

  it("une section sans élément disparaît, les groupes restants gardent l'ordre", () => {
    const r = toResult("x", {
      ...emptyRows,
      projects: [{ name: "p", tagline: "" }],
      events: [{ title: "e", date: new Date(0), location: "Dakar", online: false }],
    });
    expect(r.groups.map((g) => g.kind)).toEqual(["projects", "events"]);
    expect(r.total).toBe(2);
  });

  it("l'événement à lieu donne sa date en français et son lieu", () => {
    const r = toResult("c", {
      ...emptyRows,
      events: [{ title: "Conférence", date: new Date(Date.UTC(2026, 9, 15)), location: "Libreville", online: false }],
    });
    expect(r.groups[0].items[0].sub).toContain("Libreville");
    expect(r.groups[0].items[0].sub).toContain("2026");
  });
});
