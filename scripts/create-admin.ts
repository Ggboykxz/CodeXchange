/**
 * Crée — ou repasse en admin — le compte d'administration de la plateforme.
 *
 * Usage :
 *   npx tsx scripts/create-admin.ts                        # dev : mdp de démo
 *   ADMIN_PASSWORD=… npx tsx scripts/create-admin.ts       # prod : mdp fort
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… npx tsx scripts/create-admin.ts
 *
 * **Idempotent** : si l'adresse existe déjà, on force `role = admin` et on
 * ne touche au mot de passe que si `ADMIN_PASSWORD` est fourni (relancer le
 * script en dev ne réinitialise donc jamais un mdp de prod).
 *
 * Pourquoi un script dédié plutôt que le seed : ce script s'adresse aux
 * bases **déjà peuplées** (Neon avant B8) où relancer le seed détruirait
 * le contenu. Créer le premier admin ne doit jamais coûter une réinitialisation.
 *
 * Ne pas importer `scripts/seed.ts` depuis ici : il exécute `main()` à
 * l'import et régénérerait tout le jeu de données.
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@codexchange.dev").toLowerCase();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "codex.admin";

/** Repli = mot de passe de démo du seed (`SEED_PASSWORD`, README). */
const DEMO_PASSWORD = "codexchange2026";

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn(
      "⚠️  ADMIN_PASSWORD absent : mot de passe de DÉMO utilisé " +
        "(correct en local, à éviter en production)."
    );
  }

  const existing = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: "admin",
        // Un mdp déjà posé (prod) ne se réinitialise pas par inadvertance.
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
    console.log(`✅ ${ADMIN_EMAIL} → role=admin${password ? " (mot de passe réinitialisé)" : ""}.`);
  } else {
    await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Équipe CodeXchange",
        passwordHash: await hashPassword(password ?? DEMO_PASSWORD),
        role: "admin",
        // Compte d'équipe déjà confirmé : sinon l'écran afficherait
        // « adresse non vérifiée » à l'administrateur lui-même.
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            username: ADMIN_USERNAME,
            headline: "Staff · Modération et gestion des rôles",
            bio: "Compte de l'équipe : modération générale, gestion des rôles et contact pour la plateforme.",
            country: "Sénégal",
            city: "Dakar",
            stack: "TypeScript,Node,PostgreSQL",
            level: "lead",
            available: false,
            // Même couleur que dans le seed (index du compte admin) :
            // local et production se ressemblent.
            avatarColor: "sage",
          },
        },
      },
      select: { id: true, profile: { select: { username: true } } },
    });
    console.log(`✅ compte admin créé : ${ADMIN_EMAIL} (@${ADMIN_USERNAME})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ create-admin failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
