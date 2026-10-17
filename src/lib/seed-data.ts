/**
 * Données de démonstration pour CodeXchange — fondation du hackathon :
 * une fois le seed exécuté, aucune page n'est vide.
 *
 * Toutes les valeurs sont fictives mais réalistes (français, pays africains,
 * stacks web/mobile). Le mot de passe commun : `CodeXchange2026!`.
 */
export type SeedMember = {
  nom: string;
  email: string;
  slug: string;
  titre: string;
  ville: string;
  pays: string;
  stack: string[];
  bio: string;
  github?: string;
  role: "MEMBER" | "MENTOR" | "ADMIN";
};

export type SeedSujet = { titre: string; tags: string[]; corps: string };
export type SeedOffre = {
  titre: string;
  entreprise: string;
  contrat: "CDI" | "Freelance" | "Stage" | "Alternance";
  remote: boolean;
  pays: string;
  ville: string;
  lien: string;
};
export type SeedProjet = {
  titre: string;
  description: string;
  stack: string[];
  cherche: string[];
  lien?: string;
};
export type SeedEvenement = {
  titre: string;
  description: string;
  format: "Présentiel" | "En ligne";
  ville: string;
  pays: string;
  lien: string;
  /** Décalage en jours par rapport à aujourd'hui (négatif = passé). */
  decalageJours: number;
};
export type SeedTuto = { slug: string; titre: string; resume: string; tags: string[]; dureeMin: number; corps: string };

export const SLUG_CAPS = 120;

export const membresDemo: SeedMember[] = [
  { nom: "Admin CodeXchange", email: "admin@cx.test", slug: "admin-codexchange", titre: "Administrateur", ville: "Libreville", pays: "Gabon", stack: [], bio: "Compte d'administration de la plateforme.", role: "ADMIN" },
  { nom: "Kossi Aho", email: "kossi.aho@cx.test", slug: "kossi-aho", titre: "Dev Flutter", ville: "Libreville", pays: "Gabon", stack: ["Flutter", "Dart", "Firebase"], bio: "Apps mobile d'abord, pour les tiers.", role: "MEMBER", github: "kossi-aho" },
  { nom: "Aïcha Ondo", email: "aicha.ondo@cx.test", slug: "aicha-ondo", titre: "Frontend React", ville: "Port-Gentil", pays: "Gabon", stack: ["React", "TypeScript", "Tailwind"], bio: "UI propres et accessibles.", role: "MENTOR", github: "aicha-ondo" },
  { nom: "Boris Mendogo", email: "boris.mendogo@cx.test", slug: "boris-mendogo", titre: "Backend NestJS", ville: "Douala", pays: "Cameroun", stack: ["NestJS", "Postgres", "Docker"], bio: "APIs solides et déploiement sempé.", role: "MEMBER", github: "boris-mendogo" },
  { nom: "Fatou Ndiaye", email: "fatou.ndiaye@cx.test", slug: "fatou-ndiaye", titre: "Data engineer", ville: "Dakar", pays: "Sénégal", stack: ["Python", "Airflow", "Kafka"], bio: "Pipelines propres, moniteurs d'abord.", role: "MENTOR", github: "fatou-ndiaye" },
  { nom: "Kwame Agyeman", email: "kwame.agyeman@cx.test", slug: "kwame-agyeman", titre: "Fullstack TypeScript", ville: "Accra", pays: "Ghana", stack: ["Next.js", "Prisma", "Postgres"], bio: "API puis UI, puis tests.", role: "MEMBER", github: "kwame-agyeman" },
  { nom: "Aminata Koné", email: "aminata.kone@cx.test", slug: "aminata-kone", titre: "Mobile iOS", ville: "Abidjan", pays: "Côte d'Ivoire", stack: ["Swift", "SwiftUI", "Firebase"], bio: "Code petites apps qui comptent.", role: "MENTOR", github: "aminata-kone" },
  { nom: "Chantal Minlend", email: "chantal.minlend@cx.test", slug: "chantal-minlend", titre: "DevOps", ville: "Yaoundé", pays: "Cameroun", stack: ["Kubernetes", "Terraform", "CI/CD"], bio: "Déploiement moins douloureux.", role: "MEMBER", github: "chantal-minlend" },
  { nom: "Etienne Mbou", email: "etienne.mbou@cx.test", slug: "etienne-mbou", titre: "Dev Android", ville: "Brazzaville", pays: "Congo", stack: ["Kotlin", "Jetpack Compose", "Gradle"], bio: "Architecture propre + UX fluide.", role: "MEMBER" },
  { nom: "Dounia Traoré", email: "dounia.traore@cx.test", slug: "dounia-traore", titre: "Designer-dev", ville: "Bamako", pays: "Mali", stack: ["Figma", "React", "CSS"], bio: "UX qui ne brise pas les devs.", role: "MENTOR" },
  { nom: "Marcus Bokassa", email: "marcus.bokassa@cx.test", slug: "marcus-bokassa", titre: "GraphQL back", ville: "Kinshasa", pays: "RDC", stack: ["Apollo", "Node", "Redis"], bio: "APIs rapides, schémas clairs.", role: "MEMBER" },
  { nom: "Sarah Nguema", email: "sarah.nguema@cx.test", slug: "sarah-nguema", titre: "Front React", ville: "Libreville", pays: "Gabon", stack: ["React", "Vite", "Zustand"], bio: "Composants réutilisables avant tout.", role: "MEMBER" },
  { nom: "Philippe Essono", email: "philippe.essono@cx.test", slug: "philippe-essono", titre: "Python backend", ville: "Port-Gentil", pays: "Gabon", stack: ["Django", "FastAPI", "Postgres"], bio: "Docstring d'abord, code ensuite.", role: "MEMBER" },
  { nom: "Yaye Soumaré", email: "yaye.soumare@cx.test", slug: "yaye-soumare", titre: "Tech lead", ville: "Dakar", pays: "Sénégal", stack: ["Next.js", "AWS", "Postgres"], bio: "Ship, mesure, recommence.", role: "MENTOR", github: "yaye-soumare" },
  { nom: "Gaelle Moussavou", email: "gaelle.moussavou@cx.test", slug: "gaelle-moussavou", titre: "QA automation", ville: "Franceville", pays: "Gabon", stack: ["Playwright", "Cypress", "Vitest"], bio: "Tests avant prod, toujours.", role: "MEMBER" },
  { nom: "Ibrahim Bagayoko", email: "ibrahim.bagayoko@cx.test", slug: "ibrahim-bagayoko", titre: "Solidity dev", ville: "Bamako", pays: "Mali", stack: ["Solidity", "Hardhat", "Ethers"], bio: "Smart contracts sobres.", role: "MENTOR" },
  { nom: "Noella Mve", email: "noella.mve@cx.test", slug: "noella-mve", titre: "Mobile RN", ville: "Libreville", pays: "Gabon", stack: ["React Native", "Expo", "Redux"], bio: "Apps hors-ligne qui marchent.", role: "MEMBER" },
  { nom: "David Kouassi", email: "david.kouassi@cx.test", slug: "david-kouassi", titre: "Go backend", ville: "Abidjan", pays: "Côte d'Ivoire", stack: ["Go", "gRPC", "Kafka"], bio: "Go et sobriété.", role: "MEMBER" },
  { nom: "Rachelle Nguema", email: "rachelle.nguema@cx.test", slug: "rachelle-nguema", titre: "Front Vue", ville: "Libreville", pays: "Gabon", stack: ["Vue", "Nuxt", "Pinia"], bio: "Composants Vue réutilisables.", role: "MEMBER" },
  { nom: "Edmund Diouf", email: "edmund.diouf@cx.test", slug: "edmund-diouf", titre: "DevOps Python", ville: "Dakar", pays: "Sénégal", stack: ["Python", "Ansible", "Jenkins"], bio: "Automatisation sans douleur.", role: "MEMBER" },
  { nom: "Pascal Ouedraogo", email: "pascal.ouedraogo@cx.test", slug: "pascal-ouedraogo", titre: "Java/Kotlin", ville: "Ouagadougou", pays: "Burkina Faso", stack: ["Kotlin", "Spring Boot"], bio: "Microservices propres.", role: "MEMBER" },
  { nom: "Binta Sow", email: "binta.sow@cx.test", slug: "binta-sow", titre: "UX researcher", ville: "Niamey", pays: "Niger", stack: ["Figma", "Notion", "Hotjar"], bio: "Comprendre avant de construire.", role: "MEMBER" },
  { nom: "Thierry Onana", email: "thierry.onana@cx.test", slug: "thierry-onana", titre: "iOS Swift", ville: "N'Djamena", pays: "Tchad", stack: ["Swift", "UIKit"], bio: "Apps natives iOS sobres.", role: "MEMBER" },
  { nom: "Gracia Kamba", email: "gracia.kamba@cx.test", slug: "gracia-kamba", titre: "Front Angular", ville: "Kinshasa", pays: "RDC", stack: ["Angular", "RxJS", "TypeScript"], bio: "Rx avantage, tests avant tout.", role: "MEMBER" },
  { nom: "Regis Mambou", email: "regis.mambou@cx.test", slug: "regis-mambou", titre: "Cloud Azure", ville: "Brazzaville", pays: "Congo", stack: ["Azure", "Node", "TypeScript"], bio: "Infra fiable pour devs.", role: "MEMBER", github: "regis-mambou" },
  { nom: "Sandrine Obame", email: "sandrine.obame@cx.test", slug: "sandrine-obame", titre: "QA mobile", ville: "Port-Louis", pays: "Maurice", stack: ["Detox", "Maestro", "Jest"], bio: "Tests mobile sans maux de tête.", role: "MEMBER" },
  { nom: "Hassan Abdi", email: "hassan.abdi@cx.test", slug: "hassan-abdi", titre: "Python ML", ville: "Nairobi", pays: "Kenya", stack: ["Python", "PyTorch", "FastAPI"], bio: "ML pragmatique, pas bling-bling.", role: "MEMBER" },
  { nom: "Keza Uwase", email: "keza.uwase@cx.test", slug: "keza-uwase", titre: "Fullstack Vue", ville: "Kigali", pays: "Rwanda", stack: ["Vue", "Laravel", "Postgres"], bio: "SaaS pour PME africaines.", role: "MEMBER", github: "keza-uwase" },
  { nom: "Mateo Mbatha", email: "mateo.mbatha@cx.test", slug: "mateo-mbatha", titre: "Data science", ville: "Casablanca", pays: "Maroc", stack: ["R", "Shiny", "Postgres"], bio: "Analyses pour PME, visibles.", role: "MEMBER" },
  { nom: "Khadija Benjelloun", email: "khadija.benjelloun@cx.test", slug: "khadija-benjelloun", titre: "C++ embarqué", ville: "Rabat", pays: "Maroc", stack: ["C++", "Arduino", "MQTT"], bio: "IOT sobre, fiable.", role: "MEMBER" },
  { nom: "Yakhub Diaby", email: "yakhub.diaby@cx.test", slug: "yakhub-diaby", titre: "Game dev", ville: "Conakry", pays: "Guinée", stack: ["Unity", "C#", "Blender"], bio: "Jeux mobiles africains.", role: "MEMBER" },
];

export const sujetsDemo: SeedSujet[] = [
  { titre: "Bug Flutter Android 14 : impossible de signer le .aab", tags: ["flutter", "android"], corps: "Depuis la mise à jour Android 14, `flutter build appbundle` refuse de signer. L'erreur est `Keystore was tampered with, or password was incorrect`. J'ai tout vérifié — mot de passe, alias, keytool. Quelqu'un a déjà eu cette erreur ?" },
  { titre: "Freelance : comment facturer depuis le Gabon en euros ?", tags: ["business", "freelance"], corps: "Je reçois mes paiements en EUR mais mon compte est en FCFA. Taux changeant, frais de conversion, TVA. Quelle méthode vous utilisez (PayPal, Wise, cryptomonnaie) ?" },
  { titre: "Retour sur mon premier portfolio de dev : ce qu'il faut garder", tags: ["carriere", "portfolio"], corps: "Après 6 mois de recherche, j'ai réduit mon portfolio de 12 à 4 projets. Émergence de 3 entretiens directs. Leçons à partager." },
  { titre: "Prisma + Next.js 15 : cold start sur Vercel serverless", tags: ["nextjs", "prisma", "vercel"], corps: "Ma route handler met 4,5 s au premier call. connexion DB ré-ouverte à chaque fois. J'ai essayé globalForPrisma, sans effet. Comment structurez-vous le client ?" },
  { titre: "Mode hors-ligne avec React Native : SQLite ou Realm ?", tags: ["reactnative", "offline"], corps: "App terrain pour agents de santé. Données locales synchronisées au retour au réseau. Realm semble lourd, SQLite manuel aussi. Vos recommandations ?" },
  { titre: "Comment structurer un projet Flutter avec plusieurs flavors ?", tags: ["flutter", "architecture"], corps: "Environnements dev, staging, prod. Je cherche une base propre des flavors, des targets et des variables d'environnement sans bricole." },
  { titre: "De mon avis : TypeScript strict casse-t-il la productivité ?", tags: ["typescript", "debats"], corps: "Je passe de JS à TS strict. Grâce aux tests, je détecte des erreurs tôt. Mais certains collègues disent que ça ralentit. Opinions ?" },
  { titre: "Réseau Dev @ Libreville — prochain meet-up octobre", tags: ["evenement", "reseau"], corps: "Meet-up prévu le 19 octobre au Centre Culturel, quartier Charbonnage. Inscription gratuite, 3 talks (Flutter, IA, DevOps). Venez nombreux." },
  { titre: "Migration de mon backend Django vers NestJS : leçons", tags: ["django", "nestjs", "migration"], corps: "Après 3 mois, migration faite. Tests réduits de 2 h à 12 min. Retour d'expérience pour qui envisage." },
  { titre: "Aide : erreur CORS sur Vercel + API Laravel", tags: ["api", "cors", "laravel"], corps: "Route sur `api.kodexample.com` consommée par le front Vercel. OPTIONS ok, GET échoue. Config CORS côté Laravel, mais rien. Bref, suggestions." },
  { titre: "Prompts efficaces pour coder avec DeepSeek dans le terminal", tags: ["ia", "deepseek"], corps: "Je termine l'installation DeepSeek-Coder en CLI. Quels contextes, vapiseaux et prompts donnez-vous pour ne pas perdre le fil." },
  { titre: "Comment lancer une petite startup SaaS depuis le Cameroun ?", tags: ["business", "saas"], corps: "Trouver les premiers clients, mentionner Facebook/WhatsApp groupes dev, partenariats incubateurs. Votre parcours ?" },
  { titre: "Next.js 15 + cache : invalidation manuelle dans les routes", tags: ["nextjs", "cache"], corps: "RevalidateTag, RevalidatePath. En production serveur serverless, cache semble parfois désynchronisé. Que vérifiez-vous ?" },
  { titre: "Étudier avec 2 enfants : gestion du temps en dev", tags: ["carriere", "temoignage"], corps: "Je bosse la semaine et apprends le soir / WE. Pomodoro + github du commit. Vos méthodes ?" },
  { titre: "Je cherche des tests de revue code pour parler TypeScript", tags: ["types", "revue"], corps: "Revues : nommage, lisibilité, test bornes. Comment jugez-vous juste un PR TS ?" },
];

export const offresDemo: SeedOffre[] = [
  { titre: "Développeur Flutter junior", entreprise: "MboupTech", contrat: "CDI", remote: false, pays: "Gabon", ville: "Libreville", lien: "https://jobs.codeexchange.test/mboup-flutter" },
  { titre: "Freelance mobile cross-platform", entreprise: "Oyawara Studio", contrat: "Freelance", remote: true, pays: "Cameroun", ville: "Douala", lien: "https://jobs.codeexchange.test/oyawara-mobile" },
  { titre: "Stage Fullstack (Node/React)", entreprise: "Nexus Gabon", contrat: "Stage", remote: false, pays: "Gabon", ville: "Port-Gentil", lien: "https://jobs.codeexchange.test/nexus-stage" },
  { titre: "Alternance data — 12 mois", entreprise: "NextGen Dakar", contrat: "Alternance", remote: false, pays: "Sénégal", ville: "Dakar", lien: "https://jobs.codeexchange.test/nextgen-alt" },
  { titre: "Senior Backend Go", entreprise: "AfriPay", contrat: "CDI", remote: true, pays: "Kenya", ville: "Nairobi", lien: "https://jobs.codeexchange.test/afripay-go" },
  { titre: "DevOps part-time", entreprise: "Oyawara Studio", contrat: "Freelance", remote: true, pays: "Cameroun", ville: "Douala", lien: "https://jobs.codeexchange.test/oyawara-devops" },
  { titre: "Tech lead mobile (Flutter + RN)", entreprise: "AfriPay", contrat: "CDI", remote: true, pays: "Kenya", ville: "Nairobi", lien: "https://jobs.codeexchange.test/afripay-lead" },
  { titre: "Stage UX/UI", entreprise: "Nexus Gabon", contrat: "Stage", remote: false, pays: "Gabon", ville: "Libreville", lien: "https://jobs.codeexchange.test/nexus-ux" },
  { titre: "Alternance IA embarquée", entreprise: "NextGen Dakar", contrat: "Alternance", remote: false, pays: "Sénégal", ville: "Dakar", lien: "https://jobs.codeexchange.test/nextgen-ai" },
  { titre: "Freelance DevOps/sécurité", entreprise: "AfriShield", contrat: "Freelance", remote: true, pays: "Cameroun", ville: "Yaoundé", lien: "https://jobs.codeexchange.test/afri-shield-devops" },
];

export const projetsDemo: SeedProjet[] = [
  { titre: "SaaS de gestion de stock pour boutiques gabonaises", description: "App mobile + backend pour gérer le stock en temps réel, offline puis sync.", stack: ["React Native", "Node", "Postgres"], cherche: ["Mobile", "Backend"], lien: "https://github.com/demo/stock-gabon" },
  { titre: "Plateforme de tutoring par les jeunes devs", description: "Tutos vidéo courts, rémunération par milestones.", stack: ["Next.js", "Prisma"], cherche: ["Frontend", "DevOps"], lien: "https://github.com/demo/tutor-afrique" },
  { titre: "App de tri et collecte déchets au Gabon", description: "Visible aux jeunes civises via mobile. Offline, géolocalisation, badges.", stack: ["Flutter", "FastAPI"], cherche: ["Frontend", "Data"], lien: "https://github.com/demo/eco-gabon" },
  { titre: "Bibliothèque numérique de cours africains", description: "Téléchargement officiel des cours universitaires pour mobile.", stack: ["React", "FastAPI"], cherche: ["Frontend", "Backend"] },
  { titre: "Marketplace de services domicile (Python)", description: "Backend Django Ninja avec admin et API mobilité prestataires.", stack: ["Django", "Celery"], cherche: ["Python"], lien: "https://github.com/demo/services-gabon" },
  { titre: "Agent IA de révision pour étudiant", description: "Questions + synthèse automatique, courtes, issus de cours.", stack: ["Python", "LangChain", "FastAPI"], cherche: ["ML", "Frontend"] },
  { titre: "Système de réservation clinique (les cliniques gabonaise)", description: "Rendez-vous, rappels SMS, dossiers. Web fondamental.", stack: ["Next.js", "Postgres"], cherche: ["Fullstack"] },
  { titre: "App de counting et catégorisation budget familial", description: "Offline-first, photos + CSV, export comptable.", stack: ["Flutter", "SQLite"], cherche: ["Mobile"] },
];

export const evenementsDemo: SeedEvenement[] = [
  { titre: "Meet-up Dev @ Libreville", description: "Meet-up gratuit (3 talks : Flutter, IA, DevOps). Centre Culturel, quartier Charbonnage. Inscription obligatoire.", format: "Présentiel", ville: "Libreville", pays: "Gabon", lien: "", decalageJours: -21 },
  { titre: "Atelier Next.js 15 en ligne", description: "2 h de live coding : App Router, Server Components, cache. Web gratuit.", format: "En ligne", ville: "", pays: "Gabon", lien: "https://meet.codeexchange.test/nextjs-15", decalageJours: -7 },
  { titre: "Journée de l'IA au Cameroun", description: "Conférence + ateliers (LLM, prompting, RAG, coding). Centre des Conférences, Douala. 9 h à 17 h.", format: "Présentiel", ville: "Douala", pays: "Cameroun", lien: "", decalageJours: 3 },
  { titre: "Hackathon CodeXchange — démo live", description: "Finale du hackathon : pitch 3 min + démo live. Ouvert aux judges et au public, en ligne.", format: "En ligne", ville: "", pays: "Gabon", lien: "https://meet.codeexchange.test/hackathon", decalageJours: 9 },
  { titre: "Formation Prisma avancée", description: "Types everywhere, migrations, perf, seed transactionnel. Web 1 h 30.", format: "En ligne", ville: "", pays: "Sénégal", lien: "https://meet.codeexchange.test/prisma", decalageJours: 15 },
  { titre: "Meet-up Dakar & Dev web", description: "Talks front et back, networking. Centre Culturel, Plateau.", format: "Présentiel", ville: "Dakar", pays: "Sénégal", lien: "", decalageJours: 22 },
];

export const tutosDemo: SeedTuto[] = [
  { slug: "deployer-nextjs-sur-vercel", titre: "Déployer Next.js sur Vercel en 10 min", resume: "Du git push à la prod sans maux de tête.", tags: ["nextjs", "vercel", "deploiement"], dureeMin: 8, corps: "# Déployez votre Next en 10 min\n\n1. `git push main` sur votre repo\n2. Import du repo dans Vercel\n3. Variables d'env + build automatique\n\n**Astuce** : utilisez `force-dynamic` sur les pages listes pour ne pas figer l'état vide au build.\n\nExemple de lien : [Documentation Vercel](https://vercel.com/docs)" },
  { slug: "auth-par-cookie-httponly", titre: "Auth par cookie httpOnly en 2026", resume: "Session tokens, expiration, forgery.", tags: ["auth", "security"], dureeMin: 12, corps: "## Auth par cookie\n\n- cookie `httpOnly`, `sameSite=lax`, `secure` en prod\n- jamais de token en `localStorage`\n- table `Session` avec expiration serveur\n\n> Vérifier `expiresAt <= Date.now()` retourne `null`, jamais une exception." },
  { slug: "prisma-migration-en-prod", titre: "Prisma en prod : `migrate deploy` sans maux", resume: "Migration depuis SQLite vers Postgres.", tags: ["prisma", "postgresql"], dureeMin: 10, corps: "```bash\nnpx prisma migrate deploy\n```\n\nChanger `provider = \"sqlite\"` → `provider = \"postgresql\"` dans `schema.prisma`, puis `migrate deploy` sur la prod. Documenté dans `docs/deployment.md`." },
  { slug: "planifier-un-projet-flutter", titre: "Planifier un projet Flutter sans se perdre", resume: "Architecture features, flavor dev/staging/prod.", tags: ["flutter", "architecture"], dureeMin: 6, corps: "1. Créez des flavors pour dev/staging/prod\n2. Variables d'environnement par flavor\n3. Variables d'env injectées par `--dart-define=`\n\nPas de bricole, juste de la structure." },
  { slug: "tests-avec-vitest-et-prisma", titre: "Tests Vitest avec Prisma + SQLite", resume: "Isoler les tests de la DB de production.", tags: ["test", "vitest", "prisma"], dureeMin: 7, corps: "- `fileParallelism: false` pour éviter les verrous SQLite\n- mocks de `next/headers.cookies()` pour caller les handlers hors requête\n- test d'intégration avec `prisma/dev.db` proprement nettoyée\n- `npx prisma migrate deploy` + seed à la fin des suites (demo-ready)" },
  { slug: "curl-et-api-rest", titre: "Debug d'une API REST en 10 minutes", resume: "curl, headers et codes de statut.", tags: ["api", "debug"], dureeMin: 5, corps: "```bash\ncurl -i https://api.example.com/health\n```\n\nToujours vérifier status 2xx, `Content-Type`, et les erreurs via `{ error, message }`." },
  { slug: "markdown-editeur-dev", titre: "Écrire du markdown secure et accessible", resume: "Échapper avant de parser, rien d'autre.", tags: ["markdown", "security"], dureeMin: 4, corps: "Trois règles :\n1. Échapper `&`, `<`, `>` en premier\n2. Limiter les liens à `http(s)://`\n3. `dangerouslySetInnerHTML` uniquement sur la sortie escape+parsing" },
  { slug: "plan-hackathon-12-jours", titre: "Plan de hackathon en 12 jours", resume: "Ordre, priorités, préservation de l'essentiel.", tags: ["hackathon", "productivite"], dureeMin: 15, corps: "# Le plan\n\n- J1 : spec + squelette + auth + DB\n- J2–3 : forum + annuaire\n- J4–5 : jobs + projets\n- J6 : événements + tutos + mentorat\n- J7–8 : design system\n- J9 : déploiement\n- J10–11 : polish, perf, accessibilité\n- J12 : pitch, vidéo de secours\n- J13 : **démo**" },
];

/* ------------------------------------------------------------------ */
/* Messages, notifications, favoris et réponses variées : garantit     */
/* qu'aucune page (messagerie, notifications, favoris, forum) n'est    */
/* vide à la démo. Les liens utilisent des index résolus au moment du  */
/* seed (voir src/lib/seed.ts).                                        */
/* ------------------------------------------------------------------ */

/** Réponse supplémentaire : `sujetIndex` = index dans `sujetsDemo`. */
export type SeedReponse = { sujetIndex: number; auteurIndex: number; corps: string; repondA?: number };

export const reponsesDemo: SeedReponse[] = [
  { sujetIndex: 0, auteurIndex: 1, corps: "J'ai eu exactement la même erreur après la mise à jour. Chez moi c'était le `keystore` re-signé avec un JKS vide : `keytool -list -v -keystore upload-keystore.jks` montrait un alias en double. Supprime le JKS et régénère-le, puis réattache-le dans les secrets CI." },
  { sujetIndex: 0, auteurIndex: 0, corps: "Petit up : après vérification, l'erreur venait bien d'un alias dupliqué. Merci Kossi, ça débloque la release de l'app." },
  { sujetIndex: 0, auteurIndex: 0, repondA: 0, corps: "Merci Kossi ! Le `keytool -list` a confirmé l'alias en double. J'ai régénéré le JKS et le `.aab` se signe à nouveau. Je lance la release ce soir." },
  { sujetIndex: 3, auteurIndex: 13, corps: "Le cold start vient du pool : en serverless chaque instance ouvre sa propre connexion. Chez nous on est passés par un `globalThis.__prisma` + `connection_limit=1` dans l'URL, et le p95 est descendu sous 800 ms. Si tu peux, ajoute aussi `prisma.$connect()` dans une route /health pingée par uptime." },
  { sujetIndex: 4, auteurIndex: 16, corps: "On fait tourner du SQLite + une queue de sync en production sur ce type d'app. Le point clé : une table `outbox` avec `updatedAt` monodirectionnel, et la résolution de conflits par « dernière écriture locale gagne ». Realm est très bien mais lourd pour des agents administratifs, SQLite suffit largement." },
  { sujetIndex: 9, auteurIndex: 24, corps: "Sur Laravel, le `OPTIONS` passe souvent par le routeur alors que le `GET` échoue si le middleware CORS est enregistré APRÈS `VerifyCsrfToken`. Vérifie l'ordre dans `Kernel.php` et pense à `supports_credentials` si tu envoies des cookies. Sinon `php artisan route:list --middleware=cors` t'aide à voir la pile réelle." },
  { sujetIndex: 11, auteurIndex: 27, corps: "On a lancé notre SaaS depuis Kigali exactement comme ça : 3 clients pilotes recrutés dans un groupe WhatsApp métier, facture locale, paiement mobile money. Ce qui a marché : montrer un prototype cliquable avant d'écrire la moitié du produit. Et l'incubateur local a fourni le premier mentor commercial." },
];

/** Demande de mentorat : identifiants par e-mail. */
export type SeedDemande = { demandeur: string; mentor: string; message: string };

export const demandesDemo: SeedDemande[] = [
  { demandeur: "admin@cx.test", mentor: "fatou.ndiaye@cx.test", message: "Salut Fatou, j'aimerais un accompagnement de 3 semaines pour structurer le pilotage de la plateforme (tableaux de bord, métriques clés). Tu aurais un créneau ?" },
  { demandeur: "admin@cx.test", mentor: "yaye.soumare@cx.test", message: "Bonjour Yaye, besoin d'un oeil senior sur notre architecture Next.js + Prisma avant la mise en prod. 2 séances nous suffiraient." },
  { demandeur: "boris.mendogo@cx.test", mentor: "aicha.ondo@cx.test", message: "Aïcha, j'aimerais revoir l'accessibilité de notre back-office : audit rapide + priorités d'action." },
];

/** Message privé : identifiants par e-mail, `jours` = décalage en jours. */
export type SeedMessage = { de: string; vers: string; corps: string; jours: number; lu: boolean };

export const messagesDemo: SeedMessage[] = [
  { de: "aicha.ondo@cx.test", vers: "admin@cx.test", corps: "Salut ! J'ai vu ton sujet sur Android 14 — tu as essayé de régénérer le keystore ?", jours: -4, lu: true },
  { de: "admin@cx.test", vers: "aicha.ondo@cx.test", corps: "Oui, sans succès. Je soupçonne un souci d'encodage du mot de passe.", jours: -4, lu: true },
  { de: "aicha.ondo@cx.test", vers: "admin@cx.test", corps: "Envoie-moi le `keytool -list`, je regarde ce soir.", jours: -3, lu: true },
  { de: "admin@cx.test", vers: "aicha.ondo@cx.test", corps: "Merci beaucoup ! Je te partage ça juste après le standup.", jours: -3, lu: true },
  { de: "boris.mendogo@cx.test", vers: "admin@cx.test", corps: "Mon retour d'expérience NestJS est presque prêt, je t'envoie le doc demain matin.", jours: -1, lu: false },
  { de: "kwame.agyeman@cx.test", vers: "admin@cx.test", corps: "Tu prépares le pitch du hackathon ? Je peux t'aider sur la partie démo live si tu veux.", jours: -1, lu: false },
  { de: "fatou.ndiaye@cx.test", vers: "admin@cx.test", corps: "Les jeux de données pour le meet-up sont prêts, le lien du dashboard arrive.", jours: 0, lu: true },
  { de: "admin@cx.test", vers: "fatou.ndiaye@cx.test", corps: "Top, merci Fatou ! On en discute à la prochaine visio mentorat.", jours: 0, lu: true },
  { de: "boris.mendogo@cx.test", vers: "fatou.ndiaye@cx.test", corps: "Tu aurais 20 minutes cette semaine pour relire mon schéma de base ?", jours: -2, lu: false },
  { de: "fatou.ndiaye@cx.test", vers: "boris.mendogo@cx.test", corps: "Vendredi 15 h, ça te va ? Je prépare deux ou trois requêtes à optimiser en direct.", jours: -1, lu: true },
];

/** Notification : `lien` résolu à la volée si préfixé par `@` (voir seed.ts). */
export type SeedNotification = { destinataire: string; type: string; text: string; lien: string; jours: number; lue: boolean };

export const notificationsDemo: SeedNotification[] = [
  { destinataire: "admin@cx.test", type: "reponse", text: "Kossi Aho a répondu à ton sujet « Bug Flutter Android 14 : impossible de signer le .aab ».", lien: "@sujet0", jours: 0, lue: false },
  { destinataire: "admin@cx.test", type: "message", text: "Boris Mendogo t'a envoyé un message privé.", lien: "/messagerie", jours: 0, lue: false },
  { destinataire: "admin@cx.test", type: "reaction", text: "Aïcha Ondo ❤️ a réagi à ton sujet sur Flutter.", lien: "@sujet0", jours: -2, lue: true },
  { destinataire: "admin@cx.test", type: "mentorat", text: "Fatou Ndiaye a répondu à ta demande de mentorat « pilotage de données ».", lien: "@mentorat", jours: -3, lue: true },
  { destinataire: "admin@cx.test", type: "favoris", text: "L'offre « Développeur Flutter junior » chez MboupTech correspond à tes favoris.", lien: "@job0", jours: -9, lue: true },
];

/** Favori : `kind` et `cibleIndex` = index dans la liste correspondante. */
export type SeedFavori = { utilisateur: string; kind: "post" | "job" | "projet" | "tuto" | "event" | "membre"; cibleIndex: number };

export const favorisDemo: SeedFavori[] = [
  { utilisateur: "admin@cx.test", kind: "post", cibleIndex: 0 },
  { utilisateur: "admin@cx.test", kind: "job", cibleIndex: 0 },
  { utilisateur: "admin@cx.test", kind: "projet", cibleIndex: 2 },
  { utilisateur: "admin@cx.test", kind: "tuto", cibleIndex: 0 },
  { utilisateur: "admin@cx.test", kind: "event", cibleIndex: 1 },
  { utilisateur: "admin@cx.test", kind: "membre", cibleIndex: 4 }, // Fatou Ndiaye (MENTOR)
  { utilisateur: "fatou.ndiaye@cx.test", kind: "post", cibleIndex: 3 },
  { utilisateur: "fatou.ndiaye@cx.test", kind: "tuto", cibleIndex: 4 },
];