import { describe, expect, it, beforeEach } from "vitest";
import {
  smtpConfigured,
  sendMail,
  sendWelcomeEmail,
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
});
