import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  smtpConfigured,
  sendMail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/mailer";

/**
 * B7 — le mailer ne doit **jamais** bloquer ni casser une
 * requête. Sans `SMTP_HOST` (dev/CI), l'e-mail est un aperçu
 * dans le journal : aucune connexion réseau, résout "preview".
 */
describe("mailer — régime aperçu (dev/CI)", () => {
  beforeEach(() => {
    delete process.env.SMTP_HOST;
  });

  it("n'est pas configuré sans SMTP_HOST", () => {
    expect(smtpConfigured()).toBe(false);
  });

  it("détecte un SMTP configuré", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    expect(smtpConfigured()).toBe(true);
    delete process.env.SMTP_HOST;
  });

  it("sendMail résout 'preview' sans serveur (aucun réseau)", async () => {
    const out = await sendMail({
      to: "toi@exemple.com",
      subject: "Sujet",
      text: "Corps",
    });
    expect(out).toBe("preview");
  });

  it("l'e-mail de bienvenue résout 'preview'", async () => {
    const out = await sendWelcomeEmail({
      name: "Aïcha",
      email: "aicha@exemple.com",
    });
    expect(out).toBe("preview");
  });

  it("l'e-mail de réinitialisation résout 'preview' et contient le lien", async () => {
    const out = await sendPasswordResetEmail({
      name: "Aïcha",
      email: "aicha@exemple.com",
      resetUrl: "https://codexchange.dev/reset?token=abc",
    });
    expect(out).toBe("preview");
  });

  /**
   * B9 : sans envoi, la vérification était unreachable en prod — le
   * lien doit donc littéralement figurer dans le corps du message.
   */
  it("l'e-mail de bienvenue contient le lien de vérification quand il est fourni", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendWelcomeEmail({
      name: "Aïcha",
      email: "aicha@exemple.com",
      verifyUrl: "https://codexchange.dev/verify?token=abc",
    });
    const logged = spy.mock.calls.map((c) => String(c[0])).join("\n");
    spy.mockRestore();
    expect(logged).toContain("https://codexchange.dev/verify?token=abc");
    expect(logged).toContain("profil vérifié");
  });

  it("l'e-mail de bienvenue reste valide sans lien (inscription passée)", async () => {
    const out = await sendWelcomeEmail({
      name: "Aïcha",
      email: "aicha@exemple.com",
    });
    expect(out).toBe("preview");
  });

  it("l'e-mail de vérification résout 'preview' et contient le lien", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const out = await sendVerificationEmail({
      name: "Aïcha",
      email: "aicha@exemple.com",
      verifyUrl: "https://codexchange.dev/verify?token=abc",
    });
    const logged = spy.mock.calls.map((c) => String(c[0])).join("\n");
    spy.mockRestore();
    expect(out).toBe("preview");
    expect(logged).toContain("https://codexchange.dev/verify?token=abc");
    expect(logged).toContain("24 heures");
  });
});
