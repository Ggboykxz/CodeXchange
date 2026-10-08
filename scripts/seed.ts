/**
 * CodeXchange — Database seed
 * Seeds realistic mock data for the African dev platform.
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

/**
 * Mot de passe appliqué à **tous** les comptes du seed.
 * Les comptes devaient en plus avoir un `passwordHash` : sans lui,
 * `/api/auth/login` rejettait toute tentative (le README promettait pourtant
 * un compte démo fonctionnel).
 */
// Surchargeable par SEED_PASSWORD ; le défaut n'est sûr que grâce au
// garde-fou non-local de main() (voir plus bas).
export const SEED_PASSWORD = process.env.SEED_PASSWORD || "codexchange2026";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const avatarColors = ["terracotta", "sun", "clay", "baobab", "sage", "maroon"];

const users = [
  {
    name: "Aïcha Diallo",
    email: "aicha.diallo@codexchange.dev",
    username: "aicha.dev",
    headline: "Senior Frontend Engineer · React & Design Systems",
    bio: "Je construis des interfaces accessibles depuis Dakar. Ancienne frontend lead chez Wave, je co-anime la communauté React Sénégal. Je crois au code local pensé pour le contexte local.",
    country: "Sénégal",
    city: "Dakar",
    stack: "React,TypeScript,Next.js,Design Systems",
    level: "senior",
    github: "aichadiallo",
    twitter: "aicha_dev",
    website: "https://aicha.dev",
    available: true,
  },
  {
    name: "Kwame Mensah",
    email: "kwame.mensah@codexchange.dev",
    username: "kwame.codes",
    headline: "Backend Engineer · Go · Distributed Systems",
    bio: "Accra-based backend dev. I build payments and fintech infra. Maintainer of a few open-source Go libraries used across West Africa.",
    country: "Ghana",
    city: "Accra",
    stack: "Go,PostgreSQL,Kubernetes,gRPC",
    level: "senior",
    github: "kwamemenah",
    twitter: "kwamecodes",
    available: true,
  },
  {
    name: "Fatou Ndiaye",
    email: "fatou.ndiaye@codexchange.dev",
    username: "fatou.nb",
    headline: "Mobile Engineer · Flutter · Fintech",
    bio: "Flutter dev depuis Abidjan. Je travaille sur des apps mobiles pour la bancarisation en Côte d'Ivoire. Passionnée par l'UX mobile en contexte faible connexion.",
    country: "Côte d'Ivoire",
    city: "Abidjan",
    stack: "Flutter,Dart,Firebase,Supabase",
    level: "mid",
    github: "fatoundiaye",
    available: true,
  },
  {
    name: "Tobias Okonkwo",
    email: "tobias.okonkwo@codexchange.dev",
    username: "tobias.o",
    headline: "DevOps Engineer · Cloud · Platform",
    bio: "Lagos-based platform engineer helping African startups ship faster. AWS, Terraform, observability. I write about SRE practices adapted to emerging markets.",
    country: "Nigeria",
    city: "Lagos",
    stack: "AWS,Terraform,Kubernetes,Docker,Prometheus",
    level: "senior",
    github: "tobiasokonkwo",
    twitter: "tobiasops",
    available: false,
  },
  {
    name: "Mariam Touré",
    email: "mariam.toure@codexchange.dev",
    username: "mariam.t",
    headline: "Full-stack Engineer · Laravel · Vue",
    bio: "Dev full-stack à Bamako. Je cofonde une agence web locale qui forme des juniors. J'aime Laravel, Vue et l'entrepreneuriat tech en Afrique de l'Ouest.",
    country: "Mali",
    city: "Bamako",
    stack: "Laravel,Vue.js,PHP,MySQL",
    level: "mid",
    github: "mariamtoure",
    available: true,
  },
  {
    name: "David Mwangi",
    email: "david.mwangi@codexchange.dev",
    username: "david.m",
    headline: "ML Engineer · Computer Vision",
    bio: "Nairobi-based ML engineer. Computer vision for agritech and healthtech. Building models that work on edge devices with limited compute.",
    country: "Kenya",
    city: "Nairobi",
    stack: "Python,PyTorch,TensorFlow,FastAPI,Docker",
    level: "senior",
    github: "davidmwangi",
    twitter: "davidml_ke",
    website: "https://dmwangi.me",
    available: false,
  },
  {
    name: "Léa Mbongo",
    email: "lea.mbongo@codexchange.dev",
    username: "lea.mb",
    headline: "Frontend Engineer · Vue · Nuxt",
    bio: "Libreville, Gabon. Je construis des dashboards et apps e-commerce avec Nuxt. Cofondatrice de GabonTech, une communauté locale de 200+ devs.",
    country: "Gabon",
    city: "Libreville",
    stack: "Vue.js,Nuxt,TypeScript,Tailwind",
    level: "mid",
    github: "leambongo",
    twitter: "lea_mbongo",
    available: true,
  },
  {
    name: "Samuel Adeyemi",
    email: "samuel.adeyemi@codexchange.dev",
    username: "samuel.a",
    headline: "Rust Engineer · Systems · Web3",
    bio: "Rust enthusiast building dev tools and web3 infra. I write the weekly Rust Africa newsletter. Previously at Parity.",
    country: "Nigeria",
    city: "Abuja",
    stack: "Rust,Solidity,Substrate,TypeScript",
    level: "senior",
    github: "samadeyemi",
    twitter: "samuelrusts",
    available: true,
  },
  {
    name: "Aminata Sow",
    email: "aminata.sow@codexchange.dev",
    username: "aminata.s",
    headline: "Junior Dev · React · Learning in public",
    bio: "Junior frontend dev à Ouagadougou. En train d'apprendre React et Next.js. Je documente mon parcours pour aider d'autres juniors africains.",
    country: "Burkina Faso",
    city: "Ouagadougou",
    stack: "React,JavaScript,Tailwind",
    level: "junior",
    github: "aminatasow",
    available: true,
  },
  {
    name: "Jean-Pierre Mbeki",
    email: "jp.mbeki@codexchange.dev",
    username: "jp.mbeki",
    headline: "Senior Engineer · Java · Spring · Banking",
    bio: "20+ years building banking systems in Kinshasa and across Central Africa. I mentor juniors transitioning from school to industry.",
    country: "RD Congo",
    city: "Kinshasa",
    stack: "Java,Spring Boot,Kafka,Oracle",
    level: "lead",
    github: "jpmbeki",
    linkedin: "jp-mbeki",
    available: false,
  },
  {
    name: "Zainab Ibrahim",
    email: "zainab.ibrahim@codexchange.dev",
    username: "zainab.i",
    headline: "Frontend Engineer · Angular · Accessibility",
    bio: "Frontend dev based in Cairo, working on accessibility-first web apps. WCAG contributor. I speak at Angular Africa.",
    country: "Egypt",
    city: "Cairo",
    stack: "Angular,TypeScript,Web Components",
    level: "mid",
    github: "zainabibrahim",
    twitter: "zainab_a11y",
    available: true,
  },
  {
    name: "Eric Mutua",
    email: "eric.mutua@codexchange.dev",
    username: "eric.m",
    headline: "Full-stack Engineer · Django · React",
    bio: "Nairobi dev. Django + React for startups. I write about pragmatic engineering practices in African startups.",
    country: "Kenya",
    city: "Nairobi",
    stack: "Python,Django,React,PostgreSQL",
    level: "senior",
    github: "ericmutua",
    website: "https://ericmutua.com",
    available: true,
  },
  {
    name: "Ngozi Eze",
    email: "ngozi.eze@codexchange.dev",
    username: "ngozi.e",
    headline: "Backend Engineer · Node.js · Payment APIs",
    bio: "Lagos-based backend engineer. I build payment orchestration layers that talk to card schemes and mobile money APIs. Big believer in idempotency keys, boring code and observable services.",
    country: "Nigeria",
    city: "Lagos",
    stack: "Node.js,TypeScript,PostgreSQL,Redis",
    level: "senior",
    github: "ngoziel",
    twitter: "ngozi_builds",
    available: true,
  },
  {
    name: "Kofi Asante",
    email: "kofi.asante@codexchange.dev",
    username: "kofi.a",
    headline: "Mobile Engineer · React Native · Fintech",
    bio: "Développeur mobile basé à Accra. Je livre des apps React Native qui tournent sur des Android d'entrée de gamme. Co-organisateur du meetup React Native Accra.",
    country: "Ghana",
    city: "Accra",
    stack: "React Native,TypeScript,Redux,Sentry",
    level: "mid",
    github: "kofiasante",
    available: true,
  },
  {
    name: "Awa Camara",
    email: "awa.camara@codexchange.dev",
    username: "awa.c",
    headline: "Junior Dev · Python · Django · Learning in public",
    bio: "Junior dev à Conakry. Je code en Python depuis 2 ans, principalement du Django. Je documente mes apprentissages sur mon blog et je participe aux hackathons locaux.",
    country: "Guinée",
    city: "Conakry",
    stack: "Python,Django,PostgreSQL,Docker",
    level: "junior",
    github: "awacamara",
    available: true,
  },
  {
    name: "Yannick Owona",
    email: "yannick.owona@codexchange.dev",
    username: "yannick.o",
    headline: "Full-stack Engineer · Laravel · Node.js",
    bio: "Douala, Cameroun. Je développe des plateformes e-commerce et de paiement pour des PME camerounaises. Fan de Laravel, de tests automatisés et de déploiements simples.",
    country: "Cameroun",
    city: "Douala",
    stack: "Laravel,Node.js,MySQL,Vue.js",
    level: "mid",
    github: "yannickowona",
    twitter: "yannick_dev",
    available: true,
  },
  {
    name: "Salma Benali",
    email: "salma.benali@codexchange.dev",
    username: "salma.b",
    headline: "Frontend Engineer · Vue · Web Performance",
    bio: "Développeuse frontend à Casablanca. Spécialisée en performance web et en support RTL (arabe). Je maintiens deux libs Vue open source.",
    country: "Maroc",
    city: "Casablanca",
    stack: "Vue.js,Nuxt,TypeScript,Vite",
    level: "mid",
    github: "salmabenali",
    twitter: "salma_web",
    available: true,
  },
  {
    name: "Trésor Kabeya",
    email: "tresor.kabeya@codexchange.dev",
    username: "tresor.k",
    headline: "Data Engineer · Python · dbt · Analytics",
    bio: "Data engineer à Lubumbashi. Je construis des pipelines fiables pour des ONG et des fintechs d'Afrique centrale. Python, dbt et beaucoup de SQL.",
    country: "RD Congo",
    city: "Lubumbashi",
    stack: "Python,dbt,PostgreSQL,Airflow",
    level: "mid",
    github: "tresorkabeya",
    available: false,
  },
  {
    name: "Grace Wanjiru",
    email: "grace.wanjiru@codexchange.dev",
    username: "grace.w",
    headline: "SRE · Kubernetes · Terraform · GCP",
    bio: "Site reliability engineer in Nairobi. I keep clusters healthy across African regions and I write runbooks my team can actually follow at 3am.",
    country: "Kenya",
    city: "Nairobi",
    stack: "Kubernetes,Terraform,GCP,Prometheus,Go",
    level: "senior",
    github: "gracewanjiru",
    twitter: "grace_sre",
    available: false,
  },
  {
    name: "Chiamaka Obi",
    email: "chiamaka.obi@codexchange.dev",
    username: "chiamaka.o",
    headline: "Product Engineer · React · Design",
    bio: "Product engineer à Ibadan. Je navigue entre design et code pour livrer des features de bout en bout. J'écris sur le design engineering appliqué aux produits africains.",
    country: "Nigeria",
    city: "Ibadan",
    stack: "React,Next.js,TypeScript,Figma",
    level: "mid",
    github: "chiamakaobi",
    twitter: "chiamaka_px",
    available: true,
  },
  {
    name: "Neema Mushi",
    email: "neema.mushi@codexchange.dev",
    username: "neema.m",
    headline: "Mobile Engineer · Flutter · Mobile Money",
    bio: "Dar es Salaam-based Flutter dev building wallets and bill-payment apps for the East African market. Obsessed with tiny APKs and smooth UX on 2G.",
    country: "Tanzanie",
    city: "Dar es Salaam",
    stack: "Flutter,Dart,Firebase,Dart FFI",
    level: "mid",
    github: "neemamushi",
    available: true,
  },
  {
    name: "Claudine Uwase",
    email: "claudine.uwase@codexchange.dev",
    username: "claudine.u",
    headline: "Full-stack Engineer · Node · React · PostgreSQL",
    bio: "Full-stack dev à Kigali. Je travaille sur des produits healthtech utilisés par des cliniques au Rwanda. APIs propres, tests, et mentorat des juniors.",
    country: "Rwanda",
    city: "Kigali",
    stack: "Node.js,React,PostgreSQL,TypeScript",
    level: "mid",
    github: "claudineuwase",
    twitter: "claudine_dev",
    available: true,
  },
  {
    name: "Yassine Trabelsi",
    email: "yassine.trabelsi@codexchange.dev",
    username: "yassine.t",
    headline: "DevOps Engineer · CI/CD · Observabilité",
    bio: "Ingénieur DevOps à Tunis. Je fais tourner des pipelines CI/CD pour des équipes distribuées. GitLab CI, Docker, Prometheus et beaucoup trop de Bash.",
    country: "Tunisie",
    city: "Tunis",
    stack: "GitLab CI,Docker,Prometheus,Bash",
    level: "mid",
    github: "yassinet",
    available: true,
  },
  {
    name: "Selamawit Bekele",
    email: "selamawit.bekele@codexchange.dev",
    username: "selamawit.b",
    headline: "Backend Engineer · Java · Spring · Microservices",
    bio: "Addis-Abeba-based backend engineer building payment and core banking services. I care about observability, backward-compatible APIs and clean domain modelling.",
    country: "Éthiopie",
    city: "Addis-Abeba",
    stack: "Java,Spring Boot,Kafka,PostgreSQL",
    level: "senior",
    github: "selbekele",
    available: false,
  },
  {
    name: "Thabo Nkosi",
    email: "thabo.nkosi@codexchange.dev",
    username: "thabo.n",
    headline: "Cloud Architect · Azure · Kubernetes · FinOps",
    bio: "Cloud architect à Johannesburg. J'aide les banques et telcos africaines à réduire leur facture cloud sans sacrifier la fiabilité. Speaker à KubeCon Cape Town.",
    country: "Afrique du Sud",
    city: "Johannesburg",
    stack: "Azure,Kubernetes,Terraform,FinOps",
    level: "lead",
    github: "thabonkosi",
    linkedin: "thabo-nkosi",
    available: false,
  },
  {
    name: "Romuald Kpadonou",
    email: "romuald.kpadonou@codexchange.dev",
    username: "romuald.k",
    headline: "Full-stack Engineer · Next.js · Supabase",
    bio: "Cotonou, Bénin. Je construis des produits web pour des PME et des ONG. Fan de Next.js, de Supabase et du 'moins de code possible'.",
    country: "Bénin",
    city: "Cotonou",
    stack: "Next.js,Supabase,TypeScript,Tailwind",
    level: "mid",
    github: "romualdk",
    available: true,
  },
  {
    name: "Brian Ssekandi",
    email: "brian.ssekandi@codexchange.dev",
    username: "brian.s",
    headline: "Android Engineer · Kotlin · Jetpack Compose",
    bio: "Développeur Android à Kampala. Je livre des apps qui doivent tourner sur des téléphones à 1 Go de RAM avec un réseau capricieux. Contributeur de quelques libs Kotlin.",
    country: "Ouganda",
    city: "Kampala",
    stack: "Kotlin,Jetpack Compose,Android,Room",
    level: "mid",
    github: "brianssekandi",
    available: true,
  },
  {
    name: "Chanda Mwansa",
    email: "chanda.mwansa@codexchange.dev",
    username: "chanda.m",
    headline: "Frontend Engineer · React · PWA",
    bio: "Développeuse frontend à Lusaka. Je construis des PWAs pour des ONG qui interviennent là où le réseau est aléatoire. J'apprends Rust le weekend.",
    country: "Zambie",
    city: "Lusaka",
    stack: "React,PWA,JavaScript,Service Workers",
    level: "mid",
    github: "chandamwansa",
    available: true,
  },
  {
    name: "Moustapha Faye",
    email: "moustapha.faye@codexchange.dev",
    username: "moustapha.f",
    headline: "Security Engineer · AppSec · Pentest",
    bio: "Pentester et ingénieur sécurité à Dakar. J'audite des APIs de paiement et des apps mobiles bancaires en Afrique de l'Ouest. Contributeur OWASP.",
    country: "Sénégal",
    city: "Dakar",
    stack: "Security,Burp Suite,Python,OWASP",
    level: "senior",
    github: "moustaphafaye",
    twitter: "mousta_sec",
    available: false,
  },
  {
    name: "Nour Hassan",
    email: "nour.hassan@codexchange.dev",
    username: "nour.h",
    headline: "ML Engineer · NLP · langues africaines",
    bio: "NLP engineer based in Cairo, working on low-resource languages (Arabic, Hausa, Swahili). I care about models that run offline on cheap hardware.",
    country: "Egypt",
    city: "Cairo",
    stack: "Python,PyTorch,Transformers,FastAPI",
    level: "mid",
    github: "nourhassan",
    available: true,
  },
  {
    // B8 — le seul `admin` du seed : c'est avec ce compte qu'on découvre
    // l'outil de gestion des rôles (`admin@codexchange.dev`). Les comptes
    // démo Aïcha et Kwame restent en `member` — l'E2E `auth-edit.spec.ts`
    // affirme qu'Aïcha n'a pas les pouvoirs staff.
    name: "Équipe CodeXchange",
    email: "admin@codexchange.dev",
    username: "codex.admin",
    role: "admin",
    headline: "Staff · Modération et gestion des rôles",
    bio: "Compte de l'équipe : modération générale, gestion des rôles et contact pour la plateforme.",
    country: "Sénégal",
    city: "Dakar",
    stack: "TypeScript,Node,PostgreSQL",
    level: "lead",
    available: false,
  },
];

const threads = [
  {
    title: "Comment structurer une API REST en Go pour la scaler en Afrique de l'Ouest ?",
    body: "Salut la communauté, je monte une API de paiement en Go et je me pose la question de l'architecture : clean architecture vs hexagonal vs simple MVC ? Mon équipe est junior, je veux quelque chose de pragmatique. Contexte : faible latence inter-pays, plusieurs devises (FCFA, GHS, NGN).",
    tags: "go,architecture,payments,backend",
    category: "backend",
    author: "Kwame Mensah",
    upvotes: 47,
    views: 1240,
    solved: true,
    pinned: true,
  },
  {
    title: "Next.js 16 : server components et le pattern 'use client' — retour d'expérience",
    body: "Après 3 mois en prod sur Next 16, je partage ce qui marche et ce qui casse. Notamment : les server components avec Prisma sont magiques mais attention aux fuites de types. Quelqu'un d'autre a vu des soucis de hydration avec next-themes ?",
    tags: "nextjs,react,server-components",
    category: "frontend",
    author: "Aïcha Diallo",
    upvotes: 89,
    views: 2310,
    solved: false,
    pinned: false,
  },
  {
    title: "Flutter offline-first : stratégie de sync pour apps mobiles en zones à faible connectivité",
    body: "Je développe une app de micro-crédit en Côte d'Ivoire. Les utilisateurs perdent souvent la connexion. Je teste actuellement une stratégie CRDT locale + sync diff serveur. Quels patterns utilisez-vous ? Isar vs Hive vs sqflite pour le cache local ?",
    tags: "flutter,offline-first,mobile,dart",
    category: "mobile",
    author: "Fatou Ndiaye",
    upvotes: 62,
    views: 1840,
    solved: false,
    pinned: true,
  },
  {
    title: "Kubernetes coûts en prod en Afrique — alternatives légères ?",
    body: "On tourne sur EKS mais la facture AWS devient dingue. J'envisage K3s sur des VPS Hetzner ou DigitalOcean. Retours d'expérience ? Comment gérez-vous l'observabilité sans exploser le budget ?",
    tags: "kubernetes,devops,cost,k3s",
    category: "devops",
    author: "Tobias Okonkwo",
    upvotes: 73,
    views: 1940,
    solved: true,
    pinned: false,
  },
  {
    title: "Computer vision sur edge devices : comment entraîner des modèles qui tournent sur téléphone ?",
    body: "Je bosse sur une app de détection de maladies des plantes pour les agriculteurs kenians. Le modèle doit tourner offline sur téléphone moyen de gamme. J'utilise TensorFlow Lite + quantization. Quelles astuces pour réduire la taille sans trop perdre en accuracy ?",
    tags: "machine-learning,computer-vision,tflite,edge",
    category: "ai",
    author: "David Mwangi",
    upvotes: 54,
    views: 1620,
    solved: false,
    pinned: false,
  },
  {
    title: "[Career] Transition de junior à mid — comment négocier en Afrique ?",
    body: "Je suis dev React depuis 18 mois à Abidjan. Je sens que je devrais passer mid mais mon boss résiste. Comment aborder la conversation ? Quels salaires sont réalistes pour un mid frontend en Côte d'Ivoire en 2025 ?",
    tags: "career,negotiation,junior-to-mid",
    category: "career",
    author: "Aminata Sow",
    upvotes: 91,
    views: 3200,
    solved: true,
    pinned: false,
  },
  {
    title: "Rust vs Go pour les outils CLI internes — retour d'expérience",
    body: "On a commencé à écrire nos outils internes en Rust. Verdict : performances incroyables mais courbe d'apprentissage raide. Go reste plus rapide à shipper pour des juniors. Vous avez fait quoi comme choix ?",
    tags: "rust,go,cli,tooling",
    category: "backend",
    author: "Samuel Adeyemi",
    upvotes: 38,
    views: 980,
    solved: false,
    pinned: false,
  },
  {
    title: "Accessibilité (a11y) sur des apps Angular avec i18n arabe/français — pièges à éviter",
    body: "Je développe une app bilingue FR/AR et l'RTL me pose des soucis avec Angular Material. Quelqu'un a des patterns pour gérer le switch de direction sans re-render complet ?",
    tags: "accessibility,angular,i18n,rtl",
    category: "frontend",
    author: "Zainab Ibrahim",
    upvotes: 41,
    views: 870,
    solved: false,
    pinned: false,
  },
  {
    title: "Comment monter une communauté tech locale dans une ville secondaire ?",
    body: "Je veux lancer des meetups tech à Libreville. On est peut-être 50 devs sérieux en tout. Comment attirer les juniors sans faire fuir les seniors ? Format meetup vs atelier vs conférence ?",
    tags: "community,meetups,africa",
    category: "general",
    author: "Léa Mbongo",
    upvotes: 67,
    views: 1450,
    solved: false,
    // Non épinglé : Reddit n'autorise que 2 « sticky » par communauté, et
    // 4 fils épinglés sur 40 occuperaient la moitié de la première page.
    pinned: false,
  },
  {
    title: "Django + HTMX en 2025 : est-ce que ça tient la route face à React ?",
    body: "On démarre une nouvelle startup à Nairobi. Je suis tenté par Django + HTMX + Alpine.js pour aller vite. Est-ce que des gens ici ont shipé en prod avec cette stack ? Limites ?",
    tags: "django,htmx,python,startup",
    category: "backend",
    author: "Eric Mutua",
    upvotes: 52,
    views: 1180,
    solved: false,
    pinned: false,
  },
  {
    title: "Intégrer l'API mobile money d'Orange en production : webhooks, retries et idempotence",
    body: "Salut tout le monde, on finalise l'intégration de l'API Orange Money pour un marchand au Cameroun. Le point qui nous inquiète : les webhooks. Ils arrivent parfois en double, parfois avec 20 min de retard, et parfois pas du tout. Comment gérez-vous les retries côté serveur sans risquer de double-débiter un client ? Et est-ce que vous faites du polling en backup ?",
    tags: "mobile-money,payments,webhooks,api",
    category: "backend",
    author: "Yannick Owona",
    upvotes: 58,
    views: 1490,
    solved: true,
    pinned: false,
  },
  {
    title: "PWA offline-first : Service Workers, IndexedDB et stratégies de cache sur réseau instable",
    body: "Je construis une PWA pour une ONG en Zambie : les agents de terrain synchronisent des formulaires quand ils ont du réseau, souvent en 3G très instable. Quelle stratégie de cache pour les assets (stale-while-revalidate ?) et comment fiabiliser la file d'attente des envois avec Background Sync ? IndexedDB ou Cache API pour les données métier ?",
    tags: "pwa,offline,service-worker,web",
    category: "frontend",
    author: "Chanda Mwansa",
    upvotes: 44,
    views: 1210,
    solved: true,
    pinned: false,
  },
  {
    title: "Next.js + Prisma + SQLite en dev : comment migrer vers PostgreSQL sans tout casser en prod ?",
    body: "On développe localement avec SQLite (rapide, zéro config) et Prisma. Avant le lancement, on doit passer sur PostgreSQL. Les types diffèrent (SQLite n'a pas de vrai ENUM, les dates sont des strings...) et `prisma migrate` se comporte différemment. Quelqu'un a déjà fait cette bascule en douceur ? Backup, script de migration des données, ou on repart de zéro ?",
    tags: "nextjs,prisma,postgresql,migration",
    category: "backend",
    author: "Romuald Kpadonou",
    upvotes: 36,
    views: 980,
    solved: true,
    pinned: false,
  },
  {
    title: "USSD, WhatsApp Bot ou PWA : comment servir des utilisateurs sans smartphone ?",
    body: "Au Tanzanie, une grande partie de notre cible n'a qu'un feature phone ou un très vieux Android avec 200 Mo de data. USSD ? WhatsApp Bot ? PWA installée ? On hésite entre la portée (l'USSD atteint tout le monde) et l'UX (l'USSD est horrible). Vous avez expérimenté quoi concrètement ?",
    tags: "ussd,mobile,product,africa",
    category: "general",
    author: "Neema Mushi",
    upvotes: 71,
    views: 2100,
    solved: true,
    pinned: false,
  },
  {
    title: "Sécuriser une API de paiement : checklist anti-fraude (tokens, idempotence, rate limiting)",
    body: "J'audite régulièrement des APIs de paiement en Afrique de l'Ouest et les mêmes failles reviennent : pas de rate limiting sur l'OTP, secrets de webhook dans le repo, transactions rejouées sans clé d'idempotence, absence de signature HMAC. Voici ma checklist et je voudrais vos retours : qu'ajoutez-vous en plus en production ?",
    tags: "security,payments,api,owasp",
    category: "backend",
    author: "Moustapha Faye",
    upvotes: 95,
    views: 3400,
    solved: false,
    pinned: false,
  },
  {
    title: "Flutter : compresser images et uploads en 2G sans faire fuir l'utilisateur",
    body: "Notre app de micro-crédit permet de scanner une pièce d'identité. En 2G, un upload de 3 Mo échoue sur une tentative sur deux. J'ai baissé la résolution et j'utilise le package `image` pour compresser côté client, mais la qualité tombe trop bas pour l'OCR. Comment vous gérez l'upload progressif, la reprise sur coupure et la compression intelligente ?",
    tags: "flutter,images,mobile,performance",
    category: "mobile",
    author: "Fatou Ndiaye",
    upvotes: 33,
    views: 890,
    solved: true,
    pinned: false,
  },
  {
    title: "GitLab CI vs GitHub Actions pour une équipe avec une bande passante limitée",
    body: "Notre runner CI télécharge 4 Go d'images Docker à chaque build et on paie cher la data en Tunisie. Self-hosted runner ? Cache agressif ? Choisir la région de runner la plus proche ? Quel rapport qualité/prix vous constatez sur le long terme, surtout quand il faut builder des images Android ou Node volumineuses ?",
    tags: "ci,gitlab,github-actions,devops",
    category: "devops",
    author: "Yassine Trabelsi",
    upvotes: 42,
    views: 1130,
    solved: true,
    pinned: false,
  },
  {
    title: "PostgreSQL : une requête qui explose sur 50M de lignes de transactions",
    body: "Notre entrepôt de données a grossi. Une requête simple (somme mensuelle par marchand avec filtre date) passe de 200 ms à 45 s. EXPLAIN ANALYZE montre un séquentiel scan sur une jointure. Index partiels ? Materialized views ? Partitionnement par mois ? Quelle approche recommandez-vous pour une table de 50M de lignes qui reçoit 200k inserts/jour ?",
    tags: "postgresql,performance,sql,data",
    category: "backend",
    author: "Trésor Kabeya",
    upvotes: 64,
    views: 1780,
    solved: true,
    pinned: false,
  },
  {
    title: "Design system multi-marques avec Vue/Nuxt : tokens, theming et dette technique",
    body: "On gère 3 marques pour des clients marocains avec une seule base Nuxt. Chacune veut sa charte : couleurs, typographie, radius. Aujourd'hui c'est du CSS dupliqué partout. Faut-il un thème par composant (CSS variables + props) ou un vrai design token pipeline (Style Dictionary) ? Comment éviter que le thème casse les composants ?",
    tags: "vue,nuxt,design-system,css",
    category: "frontend",
    author: "Salma Benali",
    upvotes: 39,
    views: 1020,
    solved: false,
    pinned: false,
  },
  {
    title: "Django pour une fintech en Guinée : Django REST Framework ou FastAPI ?",
    body: "Je rejoins une jeune fintech à Conakry qui construit un wallet. Mon équipe connaît Django (l'admin nous sauve la vie pour le support), mais tout le monde dit que FastAPI est plus moderne et plus rapide. Pour une app avec beaucoup d'écriture financière et d'admin interne, quels sont les vrais arguments de chaque côté ?",
    tags: "django,fastapi,python,fintech",
    category: "backend",
    author: "Awa Camara",
    upvotes: 47,
    views: 1360,
    solved: true,
    pinned: false,
  },
  {
    title: "Kubernetes en Afrique : stateful apps, volumes et backups — comment vous vous organisez ?",
    body: "On tourne des bases PostgreSQL et Kafka sur Kubernetes dans une région africaine. Le block storage managé est cher ou indisponible dans certaines zones, et nos backups S3 traversent l'océan (lents et coûteux). Retours d'expérience sur Rook/Ceph, Longhorn, ou carrément des bases en dehors du cluster ?",
    tags: "kubernetes,stateful,storage,backup",
    category: "devops",
    author: "Grace Wanjiru",
    upvotes: 55,
    views: 1470,
    solved: true,
    pinned: false,
  },
  {
    title: "Android/Kotlin : construire une app de moins de 10 Mo pour téléphones bas de gamme",
    body: "Notre app doit tourner sur des téléphones Android Go (1 Go de RAM, Android 8-11) avec des data chères. On est à 24 Mo avec Compose. Objectif : passer sous 10 Mo sans basculer en Java. Des retours sur Compose vs View system en termes de taille, R8/ProGuard, ou le chargement à la demande des modules ?",
    tags: "android,kotlin,performance,compose",
    category: "mobile",
    author: "Brian Ssekandi",
    upvotes: 61,
    views: 1690,
    solved: true,
    pinned: false,
  },
  {
    title: "[Career] Remote pour une boîte européenne depuis l'Afrique : contrat, fiscalité et paiements",
    body: "J'ai reçu une offre remote d'une boîte allemande depuis Accra. Salaire en EUR, mais : contrat EOR ou freelance ? Wise vs Payoneer vs virement SWIFT (30 € de frais...) ? Déclaration fiscale au Ghana ? Quelqu'un a-t-il structuré ça proprement sans se faire avoir ? Témoignages concrets bienvenus.",
    tags: "career,remote,freelance,taxes",
    category: "career",
    author: "Kofi Asante",
    upvotes: 128,
    views: 5600,
    solved: true,
    pinned: false,
  },
  {
    title: "[Career] Portfolio ou GitHub : ce que les recruteurs africains regardent vraiment",
    body: "Je recrute des devs juniors pour une startup à Ibadan et je vois des portfolios magnifiques avec un GitHub vide, et l'inverse. Côté candidats, on me dit 'prends un joli portfolio', les recruteurs me disent 'lis le code'. Dans le contexte africain (peu de projets open source, beaucoup de code pro privé), qu'est-ce qui fait vraiment la différence ?",
    tags: "career,portfolio,hiring,junior",
    category: "career",
    author: "Chiamaka Obi",
    upvotes: 83,
    views: 3900,
    solved: false,
    pinned: false,
  },
  {
    title: "Rust pour les devs francophones : par où commencer en 2026 ?",
    body: "Je suis frontend (React) et je veux apprendre Rust pour les outils CLI et un peu de WebAssembly. Les ressources sont surtout en anglais et assez abruptes. Des recommandations (livres, exercices, projets concrets) et un conseil pour ne pas abandonner au bout de 2 semaines face à la gestion de la mémoire ?",
    tags: "rust,learning,beginner,cli",
    category: "backend",
    author: "Chanda Mwansa",
    upvotes: 52,
    views: 1400,
    solved: true,
    pinned: false,
  },
  {
    title: "React Native vs Flutter en 2026 pour une fintech africaine : quels critères tranchent vraiment ?",
    body: "On doit refaire notre app wallet à Accra. React Native : notre équipe connaît déjà React. Flutter : performances perçues meilleures sur bas de gamme. Les deux gèrent mal l'intégration native (SDK mobile money, NFC, passerelles USSD). Au-delà des benchmarks, quels critères ont tranché pour vous en production ?",
    tags: "react-native,flutter,mobile,fintech",
    category: "mobile",
    author: "Kofi Asante",
    upvotes: 66,
    views: 2240,
    solved: true,
    pinned: false,
  },
  {
    title: "Comment tester des webhooks de paiement sans polluer la production ?",
    body: "Nos intégrations de paiement envoient des webhooks (transaction.success, transaction.failed...). En staging, les providers ne les rejouent pas, et en prod on ne veut pas de vrais paiements de test. Quel setup utilisez-vous : webhooks synthétiques, conteneurs mock, feature flags ? Et comment rejouer un événement reçu il y a 3 jours ?",
    tags: "payments,webhooks,testing,backend",
    category: "backend",
    author: "Ngozi Eze",
    upvotes: 49,
    views: 1310,
    solved: true,
    pinned: false,
  },
  {
    title: "Supabase vs Firebase pour une startup qui veut garder la main sur ses données",
    body: "On lance un produit de gestion de dossiers patients au Rwanda. Firebase nous irait vite, mais : données hébergées hors Afrique, réplication realtime sympa mais chère, et dépendance totale. Supabase = Postgres qu'on peut self-hoster plus tard. Réaliste ? Quelles limites avez-vous rencontrées en prod (RLS, storage, realtime) ?",
    tags: "supabase,firebase,backend,startup",
    category: "backend",
    author: "Claudine Uwase",
    upvotes: 74,
    views: 2650,
    solved: true,
    pinned: false,
  },
  {
    title: "Accessibilité d'un formulaire de paiement multilingue FR/AR/Wolof — WCAG 2.2",
    body: "On refait un tunnel de paiement bilingue FR/AR (RTL) et on ajoute des libellés wolof. Points bloquants : gestion du focus au changement de langue, erreurs de validation annoncées aux lecteurs d'écran dans la bonne langue, montants en FCFA avec espaces insécables, et le switch LTR/RTL qui fait sauter le layout. Des patterns fiables ?",
    tags: "accessibility,wcag,i18n,rtl,payments",
    category: "frontend",
    author: "Zainab Ibrahim",
    upvotes: 57,
    views: 1540,
    solved: true,
    pinned: false,
  },
  {
    title: "Data pipeline léger pour une ONG : Airflow vs Dagster vs de simples crons",
    body: "Je m'occupe de la data d'une ONG qui collecte des enquêtes terrain via ODK dans 4 pays. Volume modeste (~2 Go/mois) mais équipe technique inexistante. Airflow me semble surdimensionné et lourd à maintenir, Dagster est plus moderne mais peu documenté en français. Des avis ? Sinon, des scripts cron + logs, ça suffit ?",
    tags: "data,airflow,dagster,etl",
    category: "devops",
    author: "Trésor Kabeya",
    upvotes: 31,
    views: 840,
    solved: false,
    pinned: false,
  },
  {
    title: "Latence continentale : Lagos, Nairobi, Francfort — faut-il une edge region ?",
    body: "Nos utilisateurs se répartissent entre Lagos, Nairobi et Johannesburg. Tout est hébergé en Europe : 120-180 ms de latence de base, et ça se voit dans le taux d'abandon sur mobile. Faut-il déployer des PoP edge (Workers, Fly.io) ou une vraie région AWS af-south-1 (cher) ? Quel ROI avez-vous constaté ?",
    tags: "latency,edge,devops,performance",
    category: "devops",
    author: "Thabo Nkosi",
    upvotes: 68,
    views: 2170,
    solved: false,
    pinned: false,
  },
  {
    title: "Laravel + Livewire : l'alternative pragmatique à Vue pour les agences africaines ?",
    body: "Dans mon agence à Douala, l'équipe est forte en PHP et faible en JS. Livewire + Alpine.js permet de faire des dashboards interactifs sans build frontend complexe. Est-ce que ça tient en prod sur des apps lourdes (tableaux de 10k lignes, uploads, temps réel) ? Ou faut-il partir sur une SPA Vue dès le départ ?",
    tags: "laravel,livewire,php,agence",
    category: "backend",
    author: "Yannick Owona",
    upvotes: 37,
    views: 960,
    solved: false,
    pinned: false,
  },
  {
    title: "MongoDB vs PostgreSQL pour une marketplace qui grandit vite",
    body: "Notre catalogue évolue vite (des milliers de sellers, attributs hétérogènes). On nous pousse vers MongoDB pour la flexibilité du schéma, mais nos transactions (stock, paiement, commandes) crient pour du relationnel. PostgreSQL + JSONB : le compromis idéal ? Vous avez vu des équipes se lancer sur Mongo puis migrer ?",
    tags: "mongodb,postgresql,architecture,ecommerce",
    category: "backend",
    author: "Kwame Mensah",
    upvotes: 59,
    views: 1830,
    solved: true,
    pinned: false,
  },
  {
    title: "Comment monétiser un side-project open-source quand on vit en Afrique ?",
    body: "Mon projet a 1500 stars et ~40h/semaine de travail derrière. Le sponsoring GitHub rapporte 30 USD/mois. SaaS payant autour du projet ? Open core ? Formation ? Donations via des moyens de paiement locaux (PayPal/Stripe n'est pas partout) ? Quelqu'un vit-il réellement de son OSS depuis l'Afrique ?",
    tags: "open-source,monetization,career,freelance",
    category: "career",
    author: "Léa Mbongo",
    upvotes: 112,
    views: 4700,
    solved: false,
    pinned: false,
  },
  {
    title: "TypeScript strict dans une grosse codebase : migrer sans tout casser",
    body: "On a une app Vue/Nuxt de 4 ans, ~250k lignes, quasi sans types. Activer `strict: true` d'un coup donne 3000 erreurs. Quelle stratégie : `noImplicitAny` d'abord, migration module par module, ou un lint progressif ? Comment convaincre l'équipe que le gain vaut les 2 semaines de dette ?",
    tags: "typescript,strict,refactor,frontend",
    category: "frontend",
    author: "Salma Benali",
    upvotes: 45,
    views: 1230,
    solved: false,
    pinned: false,
  },
  {
    title: "SEO et performance sur 3G : Next.js pour le marché africain",
    body: "Un client veut un site e-commerce visible sur Google au Bénin. Nos tests en throttling 3G montrent 9 s de LCP même avec `next/image`. Server components + streaming, ISR, ou carrément un site statique + JS minimal ? Quel budget de poids de page visez-vous réellement pour l'Afrique de l'Ouest ?",
    tags: "nextjs,seo,performance,web-vitals",
    category: "frontend",
    author: "Romuald Kpadonou",
    upvotes: 40,
    views: 1150,
    solved: true,
    pinned: false,
  },
  {
    title: "Flutter Web en 2026 : est-ce que ça vaut le coup pour un back-office ?",
    body: "Notre équipe connaît Flutter (apps mobile) et voudrait réutiliser les composants pour un back-office web. Mais : bundle de 2 Mo+, SEO inexistant, accessibilité perfectible, rendu canvas bizarre pour les tableaux de données. Pour un outil interne, ça passe ? Ou on écrit une admin en React/Nuxt et on assume la duplication ?",
    tags: "flutter,web,admin,frontend",
    category: "mobile",
    author: "Neema Mushi",
    upvotes: 29,
    views: 780,
    solved: false,
    pinned: false,
  },
  {
    title: "i18n multi-pays africains : fuseaux, langues, FCFA vs dollar et formats de date",
    body: "Notre app sert le Rwanda, le Kenya et la RDC : 3 fuseaux, 4 langues, monnaies différentes (RWF, KES, CDF, FCFA) et des utilisateurs qui changent de pays. Côté front : Intl API + i18next ? Côté back : tout en UTC et les montants en entiers ? Quels pièges avez-vous rencontrés avec les dates, les devises et la pluralisation (fr/sw) ?",
    tags: "i18n,internationalization,localization,mobile",
    category: "frontend",
    author: "Claudine Uwase",
    upvotes: 51,
    views: 1440,
    solved: true,
    pinned: false,
  },
  {
    title: "ArgoCD face à Jenkins legacy dans une banque congolaise : par où commencer ?",
    body: "Notre banque a un Jenkins de 2016 qui déploie tout manuellement sur des VMs. La direction veut du GitOps. Contraintes : audit obligatoire, rollback instantané, équipe de 4 devs dont 2 qui découvrent Kubernetes. Faut-il migrer Jenkins vers GitLab CI d'abord, ou tout de suite vers ArgoCD + Helm ? Témoignages de migrations réussies bienvenus.",
    tags: "argocd,jenkins,gitops,banking",
    category: "devops",
    author: "Jean-Pierre Mbeki",
    upvotes: 76,
    views: 2380,
    solved: true,
    pinned: false,
  },
  {
    title: "Chatbot support en français, wolof et arabe avec RAG — comment rester sous 50 USD/mois ?",
    body: "On veut un chatbot de support pour une app de santé, avec des réponses en français, wolof et arabe. Budget serré (50 USD/mois max) et besoin d'un fonctionnement dégradé offline (réponses pré-rendues) quand le réseau tombe. Embeddings multilingues + pgvector ? Quels modèles tiennent le coup sur des langues à faible ressource sans exploser la facture ?",
    tags: "ai,rag,llm,multilingual",
    category: "ai",
    author: "Nour Hassan",
    upvotes: 87,
    views: 3050,
    solved: true,
    pinned: false,
  },
];

const posts = [
  // Posts for thread 1 (Go API)
  {
    threadSlug: "comment-structurer-une-api-rest-en-go-pour-la-scaler-en-afrique-de-l-ouest",
    author: "Eric Mutua",
    body: "Perso je partirais sur une clean architecture légère — pas besoin d'aller full hexagonal. Sépare en 3 dossiers : `internal/domain`, `internal/service`, `internal/transport`. Ça reste lisible pour les juniors et ça scale bien.",
    isAnswer: true,
    upvotes: 23,
  },
  {
    threadSlug: "comment-structurer-une-api-rest-en-go-pour-la-scaler-en-afrique-de-l-ouest",
    author: "Samuel Adeyemi",
    body: "Pour le multi-devises, je te conseille de stocker tout en entier (centimes) et de convertir à l'affichage. On a fait l'erreur de stocker des floats, c'était l'enfer.",
    isAnswer: false,
    upvotes: 12,
  },
  {
    threadSlug: "comment-structurer-une-api-rest-en-go-pour-la-scaler-en-afrique-de-l-ouest",
    author: "Tobias Okonkwo",
    body: "+1 sur la réponse d'Eric. Et pour l'observabilité : OpenTelemetry + un Prometheus pas cher. Inutile de payer Datadog au début.",
    isAnswer: false,
    upvotes: 8,
  },
  // Thread 6 career
  {
    threadSlug: "career-transition-de-junior-a-mid-comment-negocier-en-afrique",
    author: "Aïcha Diallo",
    body: "Documente tout ce que tu as shipé au-delà de ton scope. Liste de features, impact mesurable (revenus gagnés, bugs réduits, temps gagné). Prépare un doc d'une page que tu envoies avant la meeting. Et n'aie pas peur de chercher ailleurs si ça bloque.",
    isAnswer: true,
    upvotes: 41,
  },
  {
    threadSlug: "career-transition-de-junior-a-mid-comment-negocier-en-afrique",
    author: "Jean-Pierre Mbeki",
    body: "Pour les salaires : à Abidjan, un mid frontend tourne autour de 800K-1.2M FCFA/mois en boîte sérieuse. Beaucoup moins dans les PME locales. Si tu es sur du remote EU/US, ça peut être 2-3x plus.",
    isAnswer: false,
    upvotes: 28,
  },
  // Thread 4 K8s costs
  {
    threadSlug: "kubernetes-couts-en-prod-en-afrique-alternatives-legeres",
    author: "Kwame Mensah",
    body: "On a migré d'EKS vers K3s sur 3 VPS Hetzner à 15€/mois chacun. Facture divisée par 8. Pour l'observabilité : Grafana Cloud free tier + Loki + Tempo, ça suffit largement pour une équipe de 5-10 devs.",
    isAnswer: true,
    upvotes: 35,
  },
  // Thread 2 — Next.js 16 / RSC (3 posts)
  {
    threadSlug: slugify("Next.js 16 : server components et le pattern 'use client' — retour d'expérience"),
    author: "Eric Mutua",
    body: "Le souci d'hydration avec next-themes vient presque toujours d'un script inline qui s'exécute avant l'hydration. Passe par next/script avec beforeInteractive et mets suppressHydrationWarning sur <html>. Pour Prisma, isole les appels dans des server components feuilles et ne remonte jamais l'instance dans un contexte partagé.",
    isAnswer: false,
    upvotes: 19,
  },
  {
    threadSlug: slugify("Next.js 16 : server components et le pattern 'use client' — retour d'expérience"),
    author: "Chiamaka Obi",
    body: "Même constat chez nous : le piège n'est pas RSC mais le 'use client' mis par réflexe. En repoussant formulaires, tooltips et modals côté serveur, on a divisé le bundle client de 38% et gagné 0,9 s de LCP sur nos tests en 3G.",
    isAnswer: false,
    upvotes: 14,
  },
  {
    threadSlug: slugify("Next.js 16 : server components et le pattern 'use client' — retour d'expérience"),
    author: "Salma Benali",
    body: "Attention aussi aux données lues côté serveur depuis les headers : si Accept-Language diffère entre le prerender et le client, tu as un flash de contenu. On fige la locale au moment du rendu et on la propage partout via un composant racine.",
    isAnswer: false,
    upvotes: 9,
  },
  // Thread 3 — Flutter offline-first (3 posts)
  {
    threadSlug: slugify("Flutter offline-first : stratégie de sync pour apps mobiles en zones à faible connectivité"),
    author: "Brian Ssekandi",
    body: "On a testé les trois : Drift gagne pour les requêtes structurées, Isar pour la vitesse brute (mais sa maintenance est incertaine aujourd'hui), Hive pour le simple stockage clé/valeur. Notre pattern : table locale avec colonnes dirty et updatedAt, sync par lots de 50, résolution par dernier-write-wins sauf pour le financier où l'on garde un journal d'opérations.",
    isAnswer: false,
    upvotes: 26,
  },
  {
    threadSlug: slugify("Flutter offline-first : stratégie de sync pour apps mobiles en zones à faible connectivité"),
    author: "Neema Mushi",
    body: "Pour la sync, envoie un journal d'opérations plutôt que l'état complet : moins de data (décisif en 2G) et tu peux rejouer après une coupure. On persiste une FIFO dans Hive et on l'vide par tranches de 20 au retour du réseau.",
    isAnswer: false,
    upvotes: 15,
  },
  {
    threadSlug: slugify("Flutter offline-first : stratégie de sync pour apps mobiles en zones à faible connectivité"),
    author: "Kofi Asante",
    body: "Un truc qu'on a sous-estimé : la réconciliation quand le serveur renvoie un 409. Garde toujours l'état local comme vérité à l'écran et affiche un badge 'en attente de sync' — sinon les utilisateurs pensent que l'app a perdu leurs données et ils déinstallent.",
    isAnswer: false,
    upvotes: 11,
  },
  // Thread 4 — K8s costs (2 posts)
  {
    threadSlug: "kubernetes-couts-en-prod-en-afrique-alternatives-legeres",
    author: "Grace Wanjiru",
    body: "Vérifie d'abord que tu n'as pas un LoadBalancer cloud par service. Chez nous, un seul ingress + MetalLB sur les VPS a réduit la facture de 40%. Et baisse le sampling du monitoring en dehors des heures ouvrées : personne ne regarde ces métriques à 3h du matin.",
    isAnswer: false,
    upvotes: 21,
  },
  {
    threadSlug: "kubernetes-couts-en-prod-en-afrique-alternatives-legeres",
    author: "Thabo Nkosi",
    body: "Avant de te lancer sur K3s, mesure ton vrai besoin : la plupart des startups africaines n'ont pas besoin de Kubernetes du tout. 3 VMs + systemd + un reverse proxy tiennent 80% des cas pour 50 USD/mois. K3s devient intéressant à partir de 10+ services et d'une équipe platform capable de le maintenir.",
    isAnswer: false,
    upvotes: 17,
  },
  // Thread 5 — CV on edge (2 posts)
  {
    threadSlug: slugify("Computer vision sur edge devices : comment entraîner des modèles qui tournent sur téléphone ?"),
    author: "Nour Hassan",
    body: "Trois gains faciles : quantize en INT8 post-training (÷4 de taille pour 1-2 points de drop), remplace ResNet par MobileNetV3-Small ou EfficientNet-Lite, et crop à 224 avant le resize. Sur nos modèles arabes, le gros gain venait du dataset et de l'augmentation, pas de l'architecture.",
    isAnswer: false,
    upvotes: 32,
  },
  {
    threadSlug: slugify("Computer vision sur edge devices : comment entraîner des modèles qui tournent sur téléphone ?"),
    author: "Tobias Okonkwo",
    body: "Côté livraison, pense aussi au téléchargement du modèle : mets-le sur un CDN avec checksum et reprise de téléchargement. Sur nos apps agritech, 30% des téléchargements de 12 Mo échouaient au premier coup en zone rurale.",
    isAnswer: false,
    upvotes: 13,
  },
  // Thread 6 — career (1 post)
  {
    threadSlug: "career-transition-de-junior-a-mid-comment-negocier-en-afrique",
    author: "Mariam Touré",
    body: "Propose une période d'essai de 3 mois avec des objectifs chiffrés (feature X livrée, revues de code systématiques, +20% de couverture de tests). Si les objectifs sont atteints, le titre suit automatiquement. Ça retire la négociation directe et rassure un manager qui n'ose pas sauter le cran.",
    isAnswer: false,
    upvotes: 24,
  },
  // Thread 7 — Rust vs Go (2 posts)
  {
    threadSlug: slugify("Rust vs Go pour les outils CLI internes — retour d'expérience"),
    author: "Selamawit Bekele",
    body: "Notre règle dans l'équipe : Go pour tout ce qui est CRUD, API et outils internes ; Rust uniquement quand le profil perf est mesuré (parsing de fichiers volumineux, moteur de règles). On a fait écrire un parseur en Rust à un junior : 3 mois de courbe d'apprentissage pour un gain jamais prouvé.",
    isAnswer: false,
    upvotes: 22,
  },
  {
    threadSlug: slugify("Rust vs Go pour les outils CLI internes — retour d'expérience"),
    author: "Kwame Mensah",
    body: "Le vrai critère pour moi c'est le recrutement. À Accra tu trouves 10 dev Go compétents pour 1 Rust. On a adopté Go partout, sauf pour un composant critique de matching écrit par un seul gars... qui est parti. Depuis, on a un budget 'bus factor' dans nos décisions techniques.",
    isAnswer: false,
    upvotes: 18,
  },
  // Thread 8 — a11y Angular RTL (2 posts)
  {
    threadSlug: slugify("Accessibilité (a11y) sur des apps Angular avec i18n arabe/français — pièges à éviter"),
    author: "Salma Benali",
    body: "Le plus fiable : les CSS logical properties (margin-inline-start, padding-inline-end) plutôt que dir=rtl + surcharges. Dans Angular Material, charge le thème RTL à la racine et passe direction à l'overlay. Piège classique : les animations translateX signées cassent en RTL — factorise par direction ou passe en scale.",
    isAnswer: false,
    upvotes: 29,
  },
  {
    threadSlug: slugify("Accessibilité (a11y) sur des apps Angular avec i18n arabe/français — pièges à éviter"),
    author: "Chanda Mwansa",
    body: "Teste sur un vrai device, pas seulement l'émulateur : DevTools inverse bien le RTL mais masque les icônes SVG mal retournées (flèches, chevrons). On a une checklist de 12 points passée avant chaque release bilingue, elle a éliminé 90% de nos bugs RTL.",
    isAnswer: false,
    upvotes: 10,
  },
  // Thread 9 — communauté tech (3 posts)
  {
    threadSlug: slugify("Comment monter une communauté tech locale dans une ville secondaire ?"),
    author: "Romuald Kpadonou",
    body: "À Cotonou on était ~30 devs sérieux. On a lancé un atelier pratique de 2h plutôt qu'un meetup avec des talks : on code un vrai projet ensemble (aujourd'hui une API mobile money fictive). Les juniors viennent parce qu'ils repartent avec du code, les seniors parce qu'ils adorent corriger du code. 6 mois plus tard, ~120 personnes sur le groupe.",
    isAnswer: false,
    upvotes: 34,
  },
  {
    threadSlug: slugify("Comment monter une communauté tech locale dans une ville secondaire ?"),
    author: "Aminata Sow",
    body: "Ce qui a marché à Ouaga : un buddy system où chaque junior est pairé avec un senior pour un projet de 4 semaines. Ça crée beaucoup plus d'engagement qu'un meetup passif. Et publiez des vidéos courtes des sessions sur les réseaux — c'est comme ça que j'ai trouvé ma première place.",
    isAnswer: false,
    upvotes: 20,
  },
  {
    threadSlug: slugify("Comment monter une communauté tech locale dans une ville secondaire ?"),
    author: "Yannick Owona",
    body: "Ne vise pas les 50 devs de ta ville, vise les 5 écoles et 2 bootcamps. Un atelier gratuit dans une université et tu repars avec 40 inscrits. Ensuite, un Discord ou WhatsApp où quelqu'un répond dans les 24h : un canal qui reste muet pendant une semaine tue une communauté.",
    isAnswer: false,
    upvotes: 15,
  },
  // Thread 10 — Django + HTMX (3 posts)
  {
    threadSlug: slugify("Django + HTMX en 2025 : est-ce que ça tient la route face à React ?"),
    author: "Awa Camara",
    body: "On a shipé 3 apps Django + HTMX + Alpine en prod. Ça marche très bien : formulaires, tableaux paginés, recherche inline, tout le CRUD. Ce qui fait mal : le temps réel (il faut Django Channels), les uploads lourds et le drag & drop. Pour un MVP de fintech c'était le bon choix — on a livré 2x plus vite qu'avec React.",
    isAnswer: false,
    upvotes: 31,
  },
  {
    threadSlug: slugify("Django + HTMX en 2025 : est-ce que ça tient la route face à React ?"),
    author: "Trésor Kabeya",
    body: "Ajout : surveille la taille des réponses HTML. Nos pages de rapports en HTMX dépassaient 500 Ko. Solution : paginer côté serveur et envoyer des fragments plutôt que des pages entières, plus un header HX-Trigger pour rafraîchir les zones liées.",
    isAnswer: false,
    upvotes: 12,
  },
  {
    threadSlug: slugify("Django + HTMX en 2025 : est-ce que ça tient la route face à React ?"),
    author: "Mariam Touré",
    body: "Le facteur décisif c'est l'équipe : avec Laravel + Inertia + Vue on obtient le même résultat sans jongler entre deux paradigmes. Choisis selon ce que ta équipe connaît déjà — HTMX ne rendra pas une équipe backend plus rapide si personne n'aime le HTML serveur.",
    isAnswer: false,
    upvotes: 8,
  },
  // Thread 11 — Orange Money webhooks (3 posts)
  {
    threadSlug: slugify("Intégrer l'API mobile money d'Orange en production : webhooks, retries et idempotence"),
    author: "Kwame Mensah",
    body: "Idempotence de bout en bout : génère une idempotency_key par transaction et mets-la en contrainte unique. À la réception, écris d'abord l'événement dans une table webhook_events (unique sur l'event id), puis traite. Si le webhook arrive 5 fois, l'unique t'économise le double débit. Complète par un polling de l'API de statut toutes les 15 min pour les webhooks perdus.",
    isAnswer: true,
    upvotes: 43,
  },
  {
    threadSlug: slugify("Intégrer l'API mobile money d'Orange en production : webhooks, retries et idempotence"),
    author: "Selamawit Bekele",
    body: "On fait pareil, plus une file (RabbitMQ) entre le webhook et le moteur de règles : le handler répond 200 en 20 ms et le traitement asynchrone peut échouer/retry sans que le provider considère ton endpoint mort. Attention, ils coupent après 3-4 timeouts, et ça arrive vite quand ta DB rame.",
    isAnswer: false,
    upvotes: 16,
  },
  {
    threadSlug: slugify("Intégrer l'API mobile money d'Orange en production : webhooks, retries et idempotence"),
    author: "Ngozi Eze",
    body: "Détail qui nous a coûté un litige : vérifie la signature HMAC sur le corps brut, jamais sur l'objet JSON re-parsé (l'ordre des clés change). Et conserve le payload brut 30 jours — c'est ce qui a débloqué notre dernière réconciliation avec l'opérateur.",
    isAnswer: false,
    upvotes: 13,
  },
  // Thread 12 — PWA offline (2 posts)
  {
    threadSlug: slugify("PWA offline-first : Service Workers, IndexedDB et stratégies de cache sur réseau instable"),
    author: "Salma Benali",
    body: "Stratégie qui marche chez nous : assets hashés en cacheFirst avec précache à l'install, le shell en staleWhileRevalidate, et les API jamais cachées mais empilées dans une file IndexedDB déclenchée par Background Sync (avec fallback periodicSync). Point clé : écris dans la file AVANT d'afficher 'envoyé' et affiche un compteur de non-synchronisés.",
    isAnswer: true,
    upvotes: 38,
  },
  {
    threadSlug: slugify("PWA offline-first : Service Workers, IndexedDB et stratégies de cache sur réseau instable"),
    author: "Brian Ssekandi",
    body: "Attention aux kills de process : Android tue les Service Workers sur les bas de gamme. Reprends la sync au prochain lancement de l'app au lieu de compter uniquement sur Background Sync, et limite la file à ~200 entrées avec priorisation, sinon un agent avec 3 semaines de données offline fait planter l'onglet.",
    isAnswer: false,
    upvotes: 14,
  },
  // Thread 13 — SQLite vers PostgreSQL (3 posts)
  {
    threadSlug: slugify("Next.js + Prisma + SQLite en dev : comment migrer vers PostgreSQL sans tout casser en prod ?"),
    author: "Claudine Uwase",
    body: "Le déroulé qui a marché chez nous : 1) générer le DDL PG avec prisma migrate diff --from-empty --to-schema-datamodel ; 2) exporter/importer via CSV en convertissant les types (booléens SQLite 0/1, dates strings ISO) ; 3) tourner les deux en parallèle une semaine avec double-write sur une table pilote. Ne jamais migrer le jour du lancement.",
    isAnswer: true,
    upvotes: 36,
  },
  {
    threadSlug: slugify("Next.js + Prisma + SQLite en dev : comment migrer vers PostgreSQL sans tout casser en prod ?"),
    author: "Selamawit Bekele",
    body: "Autre point : SQLite n'a pas de vraies écritures concurrentes. En PG tu verras apparaître des serialization failures — prépare dès maintenant un retry avec backoff exponentiel autour de tes transactions financières, c'est le genre de bug qui n'apparaît qu'en prod.",
    isAnswer: false,
    upvotes: 15,
  },
  {
    threadSlug: slugify("Next.js + Prisma + SQLite en dev : comment migrer vers PostgreSQL sans tout casser en prod ?"),
    author: "Ngozi Eze",
    body: "Et les limites : SQLite accepte n'importe quoi dans un TEXT, PG va refuser les URLs trop longues ou les UUID invalides. Lance un jeu de données de charge en staging (2-3x le volume réel) avant de couper, avec un script qui compare les lignes comptées des deux côtés.",
    isAnswer: false,
    upvotes: 11,
  },
  // Thread 14 — USSD / WhatsApp / PWA (2 posts)
  {
    threadSlug: slugify("USSD, WhatsApp Bot ou PWA : comment servir des utilisateurs sans smartphone ?"),
    author: "Kofi Asante",
    body: "Au Ghana le combo gagnant a été USSD pour l'acquisition + WhatsApp Business API pour tout ce qui a besoin d'une vraie UX (reçus, historiques, onboarding). Le USSD est limité à ~140 caractères avec une session de 18 s : toute navigation profonde y meurt. On n'a pas touché à la PWA tant que le data n'était pas gratuit.",
    isAnswer: true,
    upvotes: 48,
  },
  {
    threadSlug: slugify("USSD, WhatsApp Bot ou PWA : comment servir des utilisateurs sans smartphone ?"),
    author: "Mariam Touré",
    body: "Ajoute un fallback SMS : quand l'USSD tombe (et il tombe), un SMS avec un lien vers une version web lite (page HTML de 40 Ko) te sauve. Sur un service d'agrégation de factures au Mali, le taux de complétion est passé de 46% à 71% rien qu'avec ça.",
    isAnswer: false,
    upvotes: 19,
  },
  // Thread 15 — sécurité API paiement (3 posts, non résolu)
  {
    threadSlug: slugify("Sécuriser une API de paiement : checklist anti-fraude (tokens, idempotence, rate limiting)"),
    author: "Ngozi Eze",
    body: "Notre checklist en prod : rate limiting par numéro ET par IP sur l'OTP avec lockout progressif ; HMAC SHA-256 sur les webhooks avec rotation des secrets ; clé d'idempotence sur toute écriture financière ; montants en entiers côté serveur, jamais de float ; audit log append-only ; coupe automatique du webhook en cas de rejet répété.",
    isAnswer: false,
    upvotes: 52,
  },
  {
    threadSlug: slugify("Sécuriser une API de paiement : checklist anti-fraude (tokens, idempotence, rate limiting)"),
    author: "Selamawit Bekele",
    body: "J'ajouterais le chiffrement au niveau colonne (téléphones, numéros de compte) avec une KMS, et une revue de la durée de vie des tokens : beaucoup d'API locales émettent des JWT sans exp ou avec 30 jours de validité. Plus un scan ZAP en baseline chaque nuit sur les endpoints publics.",
    isAnswer: false,
    upvotes: 37,
  },
  {
    threadSlug: slugify("Sécuriser une API de paiement : checklist anti-fraude (tokens, idempotence, rate limiting)"),
    author: "Thabo Nkosi",
    body: "Côté architecture : sépare les plans de données. Le service qui écrit les transactions ne doit pas être celui qui expose l'API publique — gateway + validation de schéma en amont, interne-only sur tout le reste. Et teste systématiquement le BOLA/IDOR : on a déjà vu un simple /transactions/:id non autorisé donner accès au solde de tout le monde.",
    isAnswer: false,
    upvotes: 28,
  },
  // Thread 16 — Flutter uploads en 2G (2 posts)
  {
    threadSlug: slugify("Flutter : compresser images et uploads en 2G sans faire fuir l'utilisateur"),
    author: "Brian Ssekandi",
    body: "Découpe l'image en chunks de 256 Ko, envoie-les avec une clé d'upload, puis appelle un endpoint de finalisation. Si ça casse, tu ne renvoies que le chunk manquant. Côté compression : garde au minimum 1200px de large pour l'OCR et compresse en JPEG q=75 plutôt qu'en PNG — le gain de bande passante est énorme pour quasi rien en qualité.",
    isAnswer: true,
    upvotes: 33,
  },
  {
    threadSlug: slugify("Flutter : compresser images et uploads en 2G sans faire fuir l'utilisateur"),
    author: "Neema Mushi",
    body: "On fait pareil + une file d'attente qui reprend au réveil de l'app (ConnectivityPlus + retry exponentiel). Détail UX : affiche la progression réellement calculée, les gens abandonnent surtout quand la barre reste figée à 99%. Et si le NetworkInformation API indique 2G, baisse la résolution automatiquement.",
    isAnswer: false,
    upvotes: 12,
  },
  // Thread 17 — CI et bande passante (2 posts)
  {
    threadSlug: slugify("GitLab CI vs GitHub Actions pour une équipe avec une bande passante limitée"),
    author: "Thabo Nkosi",
    body: "Self-hosted runner est la bonne réponse au coût data, mais avant tout : registry interne (Harbor) pour ne pas re-télécharger les layers, cache de dépendances sur volume persistant (Gradle/npm), et rétention des tags d'image à 7 jours. Chez un client on est passé de 120 Go à 18 Go de downloads/mois.",
    isAnswer: true,
    upvotes: 41,
  },
  {
    threadSlug: slugify("GitLab CI vs GitHub Actions pour une équipe avec une bande passante limitée"),
    author: "Grace Wanjiru",
    body: "Si tu restes sur du cloud-managed, choisis la région de runner la plus proche et bannis les tags latest (sinon aucun cache ne tient). Pour les builds Android, garde le Gradle daemon dans une image préchauffée avec le SDK déjà installé : ça t'évite ~300 Mo par job.",
    isAnswer: false,
    upvotes: 17,
  },
  // Thread 18 — PostgreSQL perf (3 posts)
  {
    threadSlug: slugify("PostgreSQL : une requête qui explose sur 50M de lignes de transactions"),
    author: "Kwame Mensah",
    body: "Commence par EXPLAIN (ANALYZE, BUFFERS). Si c'est un seq scan sur la jointure : index composite (merchant_id, created_at) couvrant la requête avec INCLUDE (amount) pour un index-only scan. Partitionne par mois seulement si tu détaches réellement les vieux mois. Materialized view rafraîchie toutes les 15 min si le rapport n'a pas besoin d'être temps réel.",
    isAnswer: true,
    upvotes: 47,
  },
  {
    threadSlug: slugify("PostgreSQL : une requête qui explose sur 50M de lignes de transactions"),
    author: "Jean-Pierre Mbeki",
    body: "Chez nous (banque, tables de 200M+) le plus gros gain venait du dénormalisation en lecture : une table merchant_monthly_totals alimentée par job, avec table d'audit pour les corrections. 45 s → 40 ms. Le piège : il faut un process de rebuild fiable quand quelqu'un corrige une transaction d'il y a 3 mois.",
    isAnswer: false,
    upvotes: 26,
  },
  {
    threadSlug: slugify("PostgreSQL : une requête qui explose sur 50M de lignes de transactions"),
    author: "Eric Mutua",
    body: "Vérifie aussi work_mem : une agrégation sur 50M de lignes peut trier en mémoire puis tomber sur disque, ce qui est 100x plus lent. Un SET work_mem = '256MB' pour la session du rapport (pas globalement !) a divisé par 5 notre temps. Et contrôle random_page_cost pour tes SSD.",
    isAnswer: false,
    upvotes: 19,
  },
  // Thread 19 — design system Vue (2 posts, non résolu)
  {
    threadSlug: slugify("Design system multi-marques avec Vue/Nuxt : tokens, theming et dette technique"),
    author: "Aïcha Diallo",
    body: "Deux niveaux : un pipeline de tokens (Style Dictionary) qui génère des CSS variables par marque, puis des composants qui ne référencent QUE des tokens, jamais de couleurs hardcodées. Le piège classique c'est de laisser chaque composant définir son propre thème — tu finis avec 3 forks. Teste chaque composant dans les 3 thèmes en CI (Storybook + snapshot).",
    isAnswer: false,
    upvotes: 35,
  },
  {
    threadSlug: slugify("Design system multi-marques avec Vue/Nuxt : tokens, theming et dette technique"),
    author: "Chiamaka Obi",
    body: "On ajoute un theme playground dans Storybook pour que le client change la charte lui-même sans toucher au code. Les demandes du type 'refais tout en vert' sont devenues une simple édition de token, et les devs ne sont plus le goulot d'étranglement.",
    isAnswer: false,
    upvotes: 13,
  },
  // Thread 20 — Django vs FastAPI (2 posts)
  {
    threadSlug: slugify("Django pour une fintech en Guinée : Django REST Framework ou FastAPI ?"),
    author: "Eric Mutua",
    body: "Pour une fintech avec beaucoup d'admin : Django + DRF, sans hésiter. L'admin te donne un back-office d'audit en 2 jours, les migrations sont matures, et l'écosystème (django-axes pour le brute force, django-auditlog) couvre 80% des besoins réglementaires. FastAPI gagne sur le CPU-bound et le streaming — une API de wallet est I/O-bound. Tu pourras toujours exposer un micro-service FastAPI pour les webhooks temps réel.",
    isAnswer: true,
    upvotes: 44,
  },
  {
    threadSlug: slugify("Django pour une fintech en Guinée : Django REST Framework ou FastAPI ?"),
    author: "Yannick Owona",
    body: "Ajoute le coût de recrutement : à Conakry, Bamako ou Dakar, trouver des dev Django est facile (beaucoup de formations Python), des dev FastAPI seniors beaucoup moins. Choisis aussi en fonction de ce que tu pourras recruter dans 18 mois.",
    isAnswer: false,
    upvotes: 16,
  },
  // Thread 21 — K8s stateful (3 posts)
  {
    threadSlug: slugify("Kubernetes en Afrique : stateful apps, volumes et backups — comment vous vous organisez ?"),
    author: "Thabo Nkosi",
    body: "Règle simple : la base hors du cluster, le cache dedans. Managé quand c'est dispo dans la région, sinon une VM dédiée avec ZFS et réplication asynchrone vers un deuxième site. K3s/K8s pour les stateless, Longhorn seulement si tu as un vrai besoin de volumes. Backup restauré et testé chaque semaine — un backup jamais restauré n'existe pas.",
    isAnswer: true,
    upvotes: 49,
  },
  {
    threadSlug: slugify("Kubernetes en Afrique : stateful apps, volumes et backups — comment vous vous organisez ?"),
    author: "Tobias Okonkwo",
    body: "On a fait l'inverse avec succès : Rook-Ceph sur 3 nœuds dédiés (pas les nœuds de workloads), Velero pour les backups vers B2 — bien moins cher qu'S3 pour la sortie de données. Le coût caché, c'est l'ingénierie : prévois quelqu'un qui sait maintenir Ceph, sinon tu perds plus de temps que tu n'en gagnes.",
    isAnswer: false,
    upvotes: 22,
  },
  {
    threadSlug: slugify("Kubernetes en Afrique : stateful apps, volumes et backups — comment vous vous organisez ?"),
    author: "Jean-Pierre Mbeki",
    body: "Du point de vue réglementaire : l'exigence de rétention locale (les données ne quittant pas le pays) se multiplie en Afrique centrale. Vérifie ça avant de choisir un backup cross-border — on a déjà dû refuser S3 pour une banque au Congo et partir sur du stockage chez un hébergeur local.",
    isAnswer: false,
    upvotes: 18,
  },
  // Thread 22 — APK < 10 Mo (2 posts)
  {
    threadSlug: slugify("Android/Kotlin : construire une app de moins de 10 Mo pour téléphones bas de gamme"),
    author: "Kofi Asante",
    body: "Mesure d'abord avec bundletool ce qui pèse quoi : souvent ce sont les ressources (PNG à 4x) et les libs d'analytique. Gains rapides : R8 full mode + shrinkResources, WebP, Android App Bundle (chaque téléphone ne télécharge que son DPI/ABI), Glide remplacé par Coil. On est passé de 28 à 9 Mo sans quitter Compose — une fois shrinké, Compose ne pèse plus qu'environ 1 Mo.",
    isAnswer: true,
    upvotes: 46,
  },
  {
    threadSlug: slugify("Android/Kotlin : construire une app de moins de 10 Mo pour téléphones bas de gamme"),
    author: "Neema Mushi",
    body: "Évite aussi les Google Play Services si tu cibles des zones sans GMS : propose un mode Lite sans Firebase (HTTP direct) et garde FCM seulement quand il est dispo. Et diffuse l'APK sur F-Droid ou un lien direct — hors Play Store, un APK universel de 12 Mo reste parfaitement acceptable.",
    isAnswer: false,
    upvotes: 15,
  },
  // Thread 23 — remote Europe depuis l'Afrique (3 posts)
  {
    threadSlug: slugify("[Career] Remote pour une boîte européenne depuis l'Afrique : contrat, fiscalité et paiements"),
    author: "Samuel Adeyemi",
    body: "Setup recommandé : EOR type Deel/Remote si la boîte veut un contrat local (leur coût ~500 USD/mois, souvent négociable), sinon freelance avec ton entité. Paiements : Wise multi-devises > Payoneer (frais plus élevés), SWIFT seulement pour les gros montants. Déclare tes revenus et garde une trace de chaque virement — les banques locales demandent de plus en plus souvent la preuve d'origine des fonds.",
    isAnswer: true,
    upvotes: 71,
  },
  {
    threadSlug: slugify("[Career] Remote pour une boîte européenne depuis l'Afrique : contrat, fiscalité et paiements"),
    author: "Chiamaka Obi",
    body: "Un point que personne ne dit : garde un trail de tout (contrat, factures, relevés). J'ai vu des freelances nigérians bloqués plusieurs semaines parce que leur banque voulait 'prouver l'origine des fonds'. Une facture PDF avec la référence du virement à chaque paiement évite ça.",
    isAnswer: false,
    upvotes: 34,
  },
  {
    threadSlug: slugify("[Career] Remote pour une boîte européenne depuis l'Afrique : contrat, fiscalité et paiements"),
    author: "Jean-Pierre Mbeki",
    body: "20 ans de conseils : négocie que le salaire soit converti en ta devise locale au taux BCE du jour du paiement, sinon tu assumes tout le risque de change. Et si tu es freelance, prévois 3 mois de trésorerie en devise forte — le paiement retardé de 45 jours par un client européen est la norme, pas l'exception.",
    isAnswer: false,
    upvotes: 41,
  },
  // Thread 24 — portfolio vs GitHub (2 posts, non résolu)
  {
    threadSlug: slugify("[Career] Portfolio ou GitHub : ce que les recruteurs africains regardent vraiment"),
    author: "Aïcha Diallo",
    body: "Ce qui tranche quand je recrute : un README propre (contexte, décisions, comment le lancer), un historique de commits lisible, et 1-2 features soignées plutôt que 10 repos à moitié finis. Le portfolio sert de vitrine, le GitHub de preuve. Pour du code pro privé, écris 3 paragraphes sur ce que tu as fait et ajoute un schéma d'architecture — ça rassure plus qu'un lien mort.",
    isAnswer: false,
    upvotes: 48,
  },
  {
    threadSlug: slugify("[Career] Portfolio ou GitHub : ce que les recruteurs africains regardent vraiment"),
    author: "Mariam Touré",
    body: "Dans le contexte ouest-africain, ajoute la preuve sociale : une app publiée sur le Play Store, un article technique lu 500 fois, une réponse acceptée sur Stack Overflow. Les recruteurs de PME ne lisent pas GitHub — ils vérifient que tu as déjà mis quelque chose entre les mains d'utilisateurs.",
    isAnswer: false,
    upvotes: 27,
  },
  // Thread 25 — Rust pour francophones (2 posts)
  {
    threadSlug: slugify("Rust pour les devs francophones : par où commencer en 2026 ?"),
    author: "Samuel Adeyemi",
    body: "Parcours qui marche : Rustlings d'abord (exercices courts), puis le livre officiel jusqu'au chapitre lifetimes sans sauter les exercices, puis un projet concret — reprends ton CLI préféré et ajoute-lui une commande avec clap + serde. Le déclic des lifetimes arrive quand tu écris ta propre structure de cache. Et rejoins la commu Rust Africa, on y répond en français.",
    isAnswer: true,
    upvotes: 55,
  },
  {
    threadSlug: slugify("Rust pour les devs francophones : par où commencer en 2026 ?"),
    author: "Yassine Trabelsi",
    body: "Pour ne pas abandonner : 30 min/jour et un objectif daté de 4 semaines ('je compile mon CLI qui parse un CSV'). Évite les threads sur l'async au début, c'est là que 80% des gens droppent. Et cargo watch -x test rend la boucle de feedback beaucoup moins douloureuse qu'un cargo build à chaque essai.",
    isAnswer: false,
    upvotes: 23,
  },
  // Thread 26 — React Native vs Flutter (3 posts)
  {
    threadSlug: slugify("React Native vs Flutter en 2026 pour une fintech africaine : quels critères tranchent vraiment ?"),
    author: "Fatou Ndiaye",
    body: "Ce qui a tranché pour nous : intégration des SDK mobile money (les plugins natifs existent des deux côtés, mais le côté Flutter est plus simple à maintenir), rendu stable à 60fps sur écrans denses en bas de gamme, et recrutement — beaucoup plus de devs React à Abidjan que de devs Dart. On a pris Flutter pour le wallet et gardé React Native côté marchand. Le vrai coût, c'est de maintenir 2 bases.",
    isAnswer: true,
    upvotes: 51,
  },
  {
    threadSlug: slugify("React Native vs Flutter en 2026 pour une fintech africaine : quels critères tranchent vraiment ?"),
    author: "Chiamaka Obi",
    body: "Ajoute le critère vitesse d'itération produit : en RN, un dev front livre un écran en réutilisant ses skills React et tes maquettes Figma sont directement exploitables. En Flutter, il faut un dev Dart dédié. Si ton cycle de release est de 2 semaines, ce critère bat souvent les benchmarks.",
    isAnswer: false,
    upvotes: 24,
  },
  {
    threadSlug: slugify("React Native vs Flutter en 2026 pour une fintech africaine : quels critères tranchent vraiment ?"),
    author: "Neema Mushi",
    body: "Fais un test concret avant de décider : écran de saisie avec clavier natif, réseau gelé, mesure de la mémoire après 10 min sur un téléphone à 60 USD. Nos deux dernières apps ont montré des surprises — RN + Hermes a mieux tenu que prévu sur Android 8, Flutter a chauffé davantage sur les gros listes.",
    isAnswer: false,
    upvotes: 14,
  },
  // Thread 27 — tester des webhooks (2 posts)
  {
    threadSlug: slugify("Comment tester des webhooks de paiement sans polluer la production ?"),
    author: "Eric Mutua",
    body: "Notre setup : une webhook console interne qui rejoue des événements depuis un catalogue de fixtures JSON (succès, échec, en attente, montant zéro, doublon). En staging on ne compte pas sur le provider — on appelle notre propre endpoint avec la bonne signature générée depuis le secret de staging. Pour le replay en prod, on stocke le payload brut avec un id : un simple POST /admin/replay/:id a sauvé plusieurs litiges.",
    isAnswer: true,
    upvotes: 40,
  },
  {
    threadSlug: slugify("Comment tester des webhooks de paiement sans polluer la production ?"),
    author: "Grace Wanjiru",
    body: "Ajoute un contrôle de réconciliation : un cron compare chaque transaction 'en attente' depuis plus de 24h avec l'état réel chez le provider et alerte. C'est ce job qui détecte les webhooks perdus — bien plus fiable que d'espérer que le provider rejoue de lui-même.",
    isAnswer: false,
    upvotes: 21,
  },
  // Thread 28 — Supabase vs Firebase (3 posts)
  {
    threadSlug: slugify("Supabase vs Firebase pour une startup qui veut garder la main sur ses données"),
    author: "Romuald Kpadonou",
    body: "On a migré de Firebase vers Supabase pour la portabilité. Retours : RLS est puissant mais exige une vraie revue (une policy mal écrite = fuite totale, on a eu un USING (true) en prod pendant 2 jours). Storage + CDN fonctionne bien, le realtime tient tant que tu ne broadcasts pas à 10k clients. Et le self-host en docker-compose tourne sur 4 vCPU — je l'ai testé.",
    isAnswer: true,
    upvotes: 62,
  },
  {
    threadSlug: slugify("Supabase vs Firebase pour une startup qui veut garder la main sur ses données"),
    author: "Kwame Mensah",
    body: "Pour de la donnée de santé, ne garde pas tout dans un SaaS étranger sans accord de traitement formel. Ce qu'on fait pour nos clients healthtech : Postgres managé dans une région af-south-1, ou chiffrement applicatif avant écriture pour les colonnes sensibles — elles ne transittent jamais en clair.",
    isAnswer: false,
    upvotes: 31,
  },
  {
    threadSlug: slugify("Supabase vs Firebase pour une startup qui veut garder la main sur ses données"),
    author: "Selamawit Bekele",
    body: "Le vrai risque avec Firebase, c'est le modèle de données : tout devient un arbre dénormalisé et au bout de 18 mois tu ne peux plus faire un rapport. Avec Postgres tu gardes le SQL, les vues et les exports — ce qui compte quand le ministère te demande un tableau mensuel.",
    isAnswer: false,
    upvotes: 25,
  },
  // Thread 29 — a11y paiement (2 posts)
  {
    threadSlug: slugify("Accessibilité d'un formulaire de paiement multilingue FR/AR/Wolof — WCAG 2.2"),
    author: "Aïcha Diallo",
    body: "Patterns fiables : garde les mêmes id de champs au changement de langue (seul le texte change, sinon le focus saute) ; lies chaque champ à un conteneur d'erreurs persistant via aria-describedby et annonce la synthèse dans un aria-live assertive unique ; formate les montants avec Intl.NumberFormat (espaces insécables comprises) et marque le lang de chaque segment ; en RTL, préfère les logical properties et vérifie les SVG de flèches.",
    isAnswer: true,
    upvotes: 45,
  },
  {
    threadSlug: slugify("Accessibilité d'un formulaire de paiement multilingue FR/AR/Wolof — WCAG 2.2"),
    author: "Salma Benali",
    body: "Teste le switch de langue avec un lecteur d'écran : TalkBack/VoiceOver rechargent parfois la synthèse entière et perdent la position. On annonce 'langue changée' dans une région aria-live polite avant de mettre à jour le formulaire. Et garde la validation côté client souple : les messages d'erreur doivent être dans la langue de l'utilisateur, pas celle du navigateur.",
    isAnswer: false,
    upvotes: 22,
  },
  // Thread 30 — data pipeline ONG (2 posts, non résolu)
  {
    threadSlug: slugify("Data pipeline léger pour une ONG : Airflow vs Dagster vs de simples crons"),
    author: "David Mwangi",
    body: "À ce volume (2 Go/mois), pars sur du simple : Python + cron + un fichier .done par run + alerte email si le script sort avec un code non nul. Airflow est vraiment surdimensionné ici — tu passerais plus de temps à maintenir le scheduler qu'à répondre aux questions des ONG. Dagster n'a d'intérêt que si tu as des dépendances entre jobs et un besoin d'UI pour l'équipe.",
    isAnswer: false,
    upvotes: 24,
  },
  {
    threadSlug: slugify("Data pipeline léger pour une ONG : Airflow vs Dagster vs de simples crons"),
    author: "Yassine Trabelsi",
    body: "Ce qui a marché pour un client similaire : des scripts Python lancés par systemd timers (pas cron — tu récupères logs, retry et alerting au même endroit) + un Metabase gratuit pour la restitution. On a ajouté des contrôles de qualité en fin de run (nb de lignes, doublons, dates futures) qui alertent mieux que n'importe quel orchestrator.",
    isAnswer: false,
    upvotes: 13,
  },
  // Thread 31 — latence continentale (3 posts, non résolu)
  {
    threadSlug: slugify("Latence continentale : Lagos, Nairobi, Francfort — faut-il une edge region ?"),
    author: "Kwame Mensah",
    body: "Mesure d'abord avec curl -w depuis Lagos et Nairobi. Chez nous, passer l'API en af-south-1 a réduit le p95 de 180 à 45 ms et le taux d'abandon mobile de 11%. On n'a PAS mis toute l'app en edge : seul le read-only (catalogue) est en Workers + KV, l'écriture reste en région. Le ratio perf/coût est bien meilleur ainsi.",
    isAnswer: false,
    upvotes: 57,
  },
  {
    threadSlug: slugify("Latence continentale : Lagos, Nairobi, Francfort — faut-il une edge region ?"),
    author: "Grace Wanjiru",
    body: "Pièges de l'edge : cold start et runtime limité (pas de pooling de connexions DB classique). Ce qui marche : cache de lecture + GeoDNS vers la région la plus proche + HTTP/3 pour réduire le handshake. Chez nous 70% du gain venait du caching, pas du placement géographique.",
    isAnswer: false,
    upvotes: 33,
  },
  {
    threadSlug: slugify("Latence continentale : Lagos, Nairobi, Francfort — faut-il une edge region ?"),
    author: "Tobias Okonkwo",
    body: "N'oublie pas les assets : mets JS/CSS/images sur un CDN avec un PoP à Lagos. C'est 60% du poids d'une page mobile et ça ne demande aucun changement d'architecture. On a gagné 1,8 s de LCP juste avec ça, sans toucher à l'API.",
    isAnswer: false,
    upvotes: 29,
  },
  // Thread 32 — Laravel + Livewire (2 posts, non résolu)
  {
    threadSlug: slugify("Laravel + Livewire : l'alternative pragmatique à Vue pour les agences africaines ?"),
    author: "Mariam Touré",
    body: "On utilise Livewire sur 6 clients à Bamako. Ça tient très bien : tableaux de 10k lignes (avec pagination serveur), uploads S3, formulaires longs. Ce qui coince : les tableaux avec tri/filtres multiples sans pagination (le DOM explose), le temps réel (prenez plutôt Laravel Reverb), et les devs qui finissent par écrire du JS inline quand ça grandit.",
    isAnswer: false,
    upvotes: 30,
  },
  {
    threadSlug: slugify("Laravel + Livewire : l'alternative pragmatique à Vue pour les agences africaines ?"),
    author: "Eric Mutua",
    body: "La question à te poser : qui maintiendra ça dans 2 ans ? Si ta pile est 100% PHP, Livewire garde tout homogène et le bus factor est mince. Si tu prévois une app mobile ou une API publique, écris une API propre dès le départ (Sanctum) et consomme-la comme tu veux — le rendu serveur Livewire te bloquera à la 3e surface de consommation.",
    isAnswer: false,
    upvotes: 18,
  },
  // Thread 33 — MongoDB vs PostgreSQL (3 posts)
  {
    threadSlug: slugify("MongoDB vs PostgreSQL pour une marketplace qui grandit vite"),
    author: "Jean-Pierre Mbeki",
    body: "On a vécu les deux. Commence en relationnel : un catalogue hétérogène se gère très bien avec jsonb (colonnes chaudes en vraies colonnes + index GIN pour le reste) et tu gardes transactions, intégrité et reporting. Mongo ne devient pertinent que si ta hiérarchie est réellement arborescente et change à très grande vitesse. Une migration Mongo → Postgres dans 3 ans coûte cher ; l'inverse est quasi gratuit.",
    isAnswer: true,
    upvotes: 54,
  },
  {
    threadSlug: slugify("MongoDB vs PostgreSQL pour une marketplace qui grandit vite"),
    author: "Selamawit Bekele",
    body: "Exact. Pour les attributs de produits : une table product_attributes(key, value) ou du jsonb — les deux tiennent à des millions de lignes. Le vrai critère : tes requêtes sont-elles des jointures (→ SQL) ou des lectures documentaires par id (→ Mongo) ? Chez nous les deux coexistent, donc Postgres + jsonb couvre 95%.",
    isAnswer: false,
    upvotes: 27,
  },
  {
    threadSlug: slugify("MongoDB vs PostgreSQL pour une marketplace qui grandit vite"),
    author: "Claudine Uwase",
    body: "Point pragmatique pour une startup : tout l'écosystème (Prisma, Supabase, backups managés, import/export, Algolia-like) est pensé pour Postgres. Avec Mongo tu vas écrire toi-même une bonne partie de ce que les autres ont déjà résolu.",
    isAnswer: false,
    upvotes: 20,
  },
  // Thread 34 — monétiser son OSS (2 posts, non résolu)
  {
    threadSlug: slugify("Comment monétiser un side-project open-source quand on vit en Afrique ?"),
    author: "Samuel Adeyemi",
    body: "Ce qui a marché pour moi : un SaaS hébergé autour de l'outil (les gens paient pour ne pas le déployer), la formation/consulting pour entreprises (3 missions/an financent l'OSS), et des sponsors entreprises ciblés qui paient pour du support prioritaire. Le sponsoring individuel ne paiera jamais ton loyer. Côté paiement : Wise Business, ou Stripe Atlas pour une entité US si tu veux du Stripe.",
    isAnswer: false,
    upvotes: 66,
  },
  {
    threadSlug: slugify("Comment monétiser un side-project open-source quand on vit en Afrique ?"),
    author: "Mariam Touré",
    body: "Solution locale : propose le paiement mobile money (Orange, MTN, Moov) via une page de dons simple. On a financé un lib PHP camerounais comme ça : 25 dons de 2 000 FCFA/mois, ce n'est pas la richesse, mais ça paie le VPS et ça prouve aux sponsors que la communauté est prête à payer.",
    isAnswer: false,
    upvotes: 38,
  },
  // Thread 35 — TypeScript strict (2 posts, non résolu)
  {
    threadSlug: slugify("TypeScript strict dans une grosse codebase : migrer sans tout casser"),
    author: "Chiamaka Obi",
    body: "Notre ordre de migration sur 200k lignes : d'abord noImplicitAny seul, puis strictNullChecks module par module — c'est là que 80% des vrais bugs sortent. On bloque le merge sur tout fichier touché qui ne passe pas le typecheck : la dette ne grossit plus, et en 6 semaines on était à 95%. Pour convaincre : les 3 derniers bugs de prod étaient des null/undefined.",
    isAnswer: false,
    upvotes: 39,
  },
  {
    threadSlug: slugify("TypeScript strict dans une grosse codebase : migrer sans tout casser"),
    author: "Romuald Kpadonou",
    body: "Astuce complémentaire : tsc --noEmit dans la CI avec un seuil d'erreurs décroissant (nombre dans un fichier de config, baissé à chaque sprint). active exactOptionalPropertyTypes plus tard. Et si tu es sur Vue, n'oublie pas vue-tsc, sinon tu ne testes rien de tes templates.",
    isAnswer: false,
    upvotes: 16,
  },
  // Thread 36 — SEO / perf 3G (3 posts)
  {
    threadSlug: slugify("SEO et performance sur 3G : Next.js pour le marché africain"),
    author: "Aïcha Diallo",
    body: "Budget réaliste pour l'Afrique de l'Ouest : moins de 300 Ko de JS au premier chargement, LCP sous 2,5 s en Slow 4G. Concrètement : server components + streaming, next/image avec des sizes corrects et l'AVIF, fonts via next/font (zéro FOUT), ISR sur le catalogue, et aucune lib lourde au chargement (pas un kit UI complet pour 4 composants). Nos e-commerces sont passés de 9 s à 2,8 s.",
    isAnswer: true,
    upvotes: 58,
  },
  {
    threadSlug: slugify("SEO et performance sur 3G : Next.js pour le marché africain"),
    author: "Chanda Mwansa",
    body: "Teste sur un vrai téléphone d'entrée de gamme : nos métriques Lighthouse en fibre ne correspondaient pas à la réalité. On garde un Android Go à 60 USD comme device de référence. Découverte : nos images responsives étaient servies en 1600px aux téléphones 720p à cause d'un sizes mal réglé.",
    isAnswer: false,
    upvotes: 26,
  },
  {
    threadSlug: slugify("SEO et performance sur 3G : Next.js pour le marché africain"),
    author: "Thabo Nkosi",
    body: "Côté SEO : données structurées (Product, Breadcrumb, FAQ) et un HTML réellement rendu — Googlebot rend, mais lentement, donc ne laisse rien d'essentiel dans le JS. Et sers les assets depuis un PoP local : Lagos au lieu de Francfort a divisé par 3 le temps d'arrivée des ressources.",
    isAnswer: false,
    upvotes: 21,
  },
  // Thread 37 — Flutter Web (2 posts, non résolu)
  {
    threadSlug: slugify("Flutter Web en 2026 : est-ce que ça vaut le coup pour un back-office ?"),
    author: "Chiamaka Obi",
    body: "Pour un back-office interne, Flutter Web passe si : peu d'utilisateurs simultanés, aucun SEO, et tu assumes un bundle lourd. Les tableaux de données restent le point faible (rendu canvas = Ctrl+F inutilisable sur les listes longues, accessibilité perfectible). Solution intermédiaire qu'on a prise : Flutter Web pour la console dense + une petite admin Next.js pour tout ce qui touche au public.",
    isAnswer: false,
    upvotes: 27,
  },
  {
    threadSlug: slugify("Flutter Web en 2026 : est-ce que ça vaut le coup pour un back-office ?"),
    author: "Kofi Asante",
    body: "Mon test : envoie le lien à deux collègues sur connexion moyenne et regarde le temps avant le premier pixel + la mémoire Chrome. Sur notre essai, le bundle de 2,4 Mo et le rendu canvas ont fait fuir 2 utilisateurs sur 5 (lents, et les raccourcis clavier ne marchaient pas). Si ton back-office a besoin d'accessibilité ou de clavier, ce n'est pas Flutter Web.",
    isAnswer: false,
    upvotes: 15,
  },
  // Thread 38 — i18n multi-pays (3 posts)
  {
    threadSlug: slugify("i18n multi-pays africains : fuseaux, langues, FCFA vs dollar et formats de date"),
    author: "Zainab Ibrahim",
    body: "Côté front : Intl API partout (DateTimeFormat, NumberFormat, RelativeTimeFormat) + i18next avec une locale par pays, jamais par langue seule (fr-RW n'a pas le même format que fr-SN). Pièges rencontrés : la pluralisation sw dépend du préfixe du nom (gère-le par fonction, pas par fichier) ; montants en minor units + devise séparée ; jamais de date stockée en string locale — UTC en base, format à l'affichage ; le fuseau se résout à l'exécution, pas à l'inscription.",
    isAnswer: true,
    upvotes: 61,
  },
  {
    threadSlug: slugify("i18n multi-pays africains : fuseaux, langues, FCFA vs dollar et formats de date"),
    author: "Salma Benali",
    body: "Attention au FCFA : il y a XOF et XAF, deux symboles et deux parités historiques. Fais toujours renvoyer la devise par l'API et formate côté client avec Intl.NumberFormat(locale, { style: 'currency', currency: 'XOF' }). On a eu un bug pendant lequel des montants en XAF s'affichaient en EUR.",
    isAnswer: false,
    upvotes: 34,
  },
  {
    threadSlug: slugify("i18n multi-pays africains : fuseaux, langues, FCFA vs dollar et formats de date"),
    author: "Kofi Asante",
    body: "Règle de base côté API : JSON normalisé, dates en ISO 8601 UTC, montants en entiers, langue en BCP-47. Le piège classique c'est de laisser le backend formatter — tu finis avec des dates 12/03 que personne ne sait lire entre les conventions US et FR.",
    isAnswer: false,
    upvotes: 25,
  },
  // Thread 39 — ArgoCD vs Jenkins (3 posts)
  {
    threadSlug: slugify("ArgoCD face à Jenkins legacy dans une banque congolaise : par où commencer ?"),
    author: "Selamawit Bekele",
    body: "Feuille de route en 3 étapes qui a marché dans deux banques : 1) containerise Jenkins et déplace les builds en Docker (rollback = image précédente, tu as déjà 60% du gain) ; 2) introduis des Helm charts versionnés et un registre Harbor, déploiements toujours manuels mais traçables ; 3) ArgoCD en mode non-critique d'abord (il synchronise, l'humain appuie sur Sync) pendant 2 mois, puis auto-sync sur la recette. Ne jamais migrer Jenkins et le mécanisme de déploiement en même temps.",
    isAnswer: true,
    upvotes: 64,
  },
  {
    threadSlug: slugify("ArgoCD face à Jenkins legacy dans une banque congolaise : par où commencer ?"),
    author: "Grace Wanjiru",
    body: "Sur l'audit : ArgoCD conserve l'historique Git de chaque synchronisation, c'est exactement ce que les auditeurs demandent. Expose les Application events + un export quotidien, et garde Jenkins pour ce qu'il fait bien (jobs legacy, notifications) — personne ne gagne à tout réécrire.",
    isAnswer: false,
    upvotes: 39,
  },
  {
    threadSlug: slugify("ArgoCD face à Jenkins legacy dans une banque congolaise : par où commencer ?"),
    author: "Tobias Okonkwo",
    body: "Pour la formation : donne à tes 2 juniors un cluster sandbox + ArgoCD et demande-leur de déployer une app de test dès la première semaine. Le GitOps se comprend en pratique bien plus vite qu'en documentation. Et bloque une journée pour écrire les runbooks — c'est ce qui manque toujours en fin de migration.",
    isAnswer: false,
    upvotes: 28,
  },
  // Thread 40 — chatbot RAG multilingue (2 posts)
  {
    threadSlug: slugify("Chatbot support en français, wolof et arabe avec RAG — comment rester sous 50 USD/mois ?"),
    author: "David Mwangi",
    body: "Sous 50 USD/mois : embeddings multilingues légers (BGE-m3 ou multilingual-e5-small) en batch plutôt qu'un gros LLM pour l'indexation ; pgvector sur ta base Postgres existante (pas de vecteur DB payante) avec un index HNSW au-delà de ~100k chunks ; un petit modèle de reranking + un LLM low-cost pour la génération avec un prompt système qui impose la langue. Et pour l'offline : pré-rends les 200 questions les plus fréquentes et sers-les depuis un cache local — ça couvre 70% du support.",
    isAnswer: true,
    upvotes: 72,
  },
  {
    threadSlug: slugify("Chatbot support en français, wolof et arabe avec RAG — comment rester sous 50 USD/mois ?"),
    author: "Trésor Kabeya",
    body: "Point sur le wolof : il existe très peu de corpus publics. Vise une base de FAQ constituée avec l'équipe support plutôt que d'espérer que le modèle 'connaît' la langue — la réponse attendue est documentaire, pas conversationnelle. Et mesure par langue : sans jeu d'évaluation local, tu ne sauras jamais si le wolof fonctionne vraiment ou si ça a l'air de marcher.",
    isAnswer: false,
    upvotes: 43,
  },
];

const jobs = [
  {
    title: "Senior Frontend Engineer (React)",
    company: "Wave",
    location: "Dakar",
    country: "Sénégal",
    remote: false,
    type: "full-time",
    stack: "React,TypeScript,Next.js",
    salary: "8-12M FCFA / year",
    description: "Wave recherche un·e ingénieur·e frontend senior pour construire la prochaine génération de notre app mobile-first. Tu travailleras sur le design system, les performances et l'accessibilité.",
    applyUrl: "https://wave.com/careers/senior-frontend",
    author: "Aïcha Diallo",
  },
  {
    title: "Backend Engineer (Go) — Fintech",
    company: "Paystack",
    location: "Lagos",
    country: "Nigeria",
    remote: true,
    type: "full-time",
    stack: "Go,PostgreSQL,Kubernetes",
    salary: "$60-90K USD / year",
    description: "Rejoins l'équipe backend de Paystack pour construire l'infrastructure de paiement qui dessert des milliers de marchands africains. Remote OK depuis n'importe quel pays africain.",
    applyUrl: "https://paystack.com/careers/backend-go",
    author: "Kwame Mensah",
  },
  {
    title: "Flutter Engineer — Mobile Banking",
    company: "Orange Money",
    location: "Abidjan",
    country: "Côte d'Ivoire",
    remote: false,
    type: "full-time",
    stack: "Flutter,Dart,Firebase",
    salary: "5-8M FCFA / year",
    description: "On cherche un·e dev Flutter pour rejoindre l'équipe Orange Money Côte d'Ivoire. Tu seras responsable de l'app mobile grand public.",
    applyUrl: "https://orange.com/careers",
    author: "Fatou Ndiaye",
  },
  {
    title: "DevOps Engineer (Contract 6 mois)",
    company: "Jumia",
    location: "Remote",
    country: "Egypt",
    remote: true,
    type: "contract",
    stack: "AWS,Terraform,Kubernetes",
    salary: "$4-6K USD / month",
    description: "Mission de 6 mois pour structurer la platform engineering de Jumia. Tu mettras en place un socle Kubernetes et un catalogue de services internes.",
    applyUrl: "https://jumia.com/careers",
    author: "Tobias Okonkwo",
  },
  {
    title: "Stage — Développeur·euse Laravel (6 mois)",
    company: "Bamako Web Agency",
    location: "Bamako",
    country: "Mali",
    remote: false,
    type: "internship",
    stack: "Laravel,Vue.js,MySQL",
    salary: "150K FCFA / month",
    description: "Stage de fin d'études dans une agence web locale. Tu travailleras sur des projets e-commerce pour des PME maliennes. Possibilité d'embauche en CDI après le stage.",
    applyUrl: "mailto:jobs@bamakoweb.ml",
    author: "Mariam Touré",
  },
  {
    title: "ML Engineer — Agritech",
    company: "Twiga Foods",
    location: "Nairobi",
    country: "Kenya",
    remote: false,
    type: "full-time",
    stack: "Python,PyTorch,FastAPI",
    salary: "$50-75K USD / year",
    description: "Rejoins Twiga pour construire des modèles ML qui optimisent la chaîne d'approvisionnement alimentaire en Afrique de l'Est. Tu travailleras sur de la vision, du NLP et de l'optimisation.",
    applyUrl: "https://twiga.com/careers",
    author: "David Mwangi",
  },
  {
    title: "Full-stack Engineer (Django + React) — Remote Africa",
    company: "Andela",
    location: "Remote",
    country: "Kenya",
    remote: true,
    type: "full-time",
    stack: "Django,React,PostgreSQL",
    salary: "$40-65K USD / year",
    description: "Andela recrute des full-stack devs pour des clients internationaux. 100% remote, tu seras assigné·e à un projet long terme.",
    applyUrl: "https://andela.com/careers",
    author: "Eric Mutua",
  },
  {
    title: "Rust Engineer — Web3 Protocol",
    company: "Polygon",
    location: "Remote",
    country: "Nigeria",
    remote: true,
    type: "full-time",
    stack: "Rust,Solidity,Substrate",
    salary: "$90-130K USD / year",
    description: "Rejoins l'équipe protocol de Polygon pour construire l'infrastructure web3. Ouvert aux talents africains en remote.",
    applyUrl: "https://polygon.technology/careers",
    author: "Samuel Adeyemi",
  },
  {
    title: "Backend Engineer (Node.js) — Payment Gateway",
    company: "Flutterwave",
    location: "Lagos",
    country: "Nigeria",
    remote: true,
    type: "full-time",
    stack: "Node.js,TypeScript,PostgreSQL,Redis",
    salary: "$55-85K USD / year",
    description: "Rejoins l'équipe gateway de Flutterwave pour construire les services qui orchestrent les paiements carte et mobile money à travers 15 pays africains. Remote ouvert depuis n'importe quel pays africain, forte culture d'écriture de tests et d'observabilité.",
    applyUrl: "https://flutterwave.com/careers",
    author: "Ngozi Eze",
  },
  {
    title: "DevOps Engineer (Kubernetes) — Core Platform",
    company: "Safaricom",
    location: "Nairobi",
    country: "Kenya",
    remote: false,
    type: "full-time",
    stack: "Kubernetes,Terraform,AWS,ArgoCD",
    salary: "$40-65K USD / year",
    description: "Tu prendras en charge le socle Kubernetes utilisé par 30+ équipes produit : GitOps avec ArgoCD, observabilité, quotas et FinOps. Missions sur site à Nairobi, possibilité de 2 jours de télétravail par semaine.",
    applyUrl: "https://safaricom.co.ke/careers",
    author: "Grace Wanjiru",
  },
];

const projects = [
  {
    name: "BaobabUI",
    slug: "baobab-ui",
    tagline: "Design system open-source pensé pour les apps africaines",
    description: "Une bibliothèque de composants React typés et accessibles, avec des patterns adaptés au contexte africain : composants offline-first, support multi-devises, i18n FR/EN/SW/AR dès le départ. Objectif : devenir le MUI des devs africains.",
    repoUrl: "https://github.com/codexchange/baobab-ui",
    demoUrl: "https://baobab-ui.codexchange.dev",
    stack: "React,TypeScript,Tailwind,Radix",
    status: "beta",
    lookingFor: "frontend,design,docs",
    author: "Aïcha Diallo",
    cover: "🌳",
    stars: 234,
  },
  {
    name: "Paybridge",
    slug: "paybridge",
    tagline: "API open-source de paiement inter-pays africains",
    description: "Une API unifiée pour accepter des paiements via mobile money (Orange, MTN, Moov, Airtel) et cartes. Abstraction propre, webhooks normalisés, multi-devises. Idéal pour les marketplaces pan-africaines.",
    repoUrl: "https://github.com/codexchange/paybridge",
    stack: "Go,PostgreSQL,gRPC",
    status: "mvp",
    lookingFor: "backend,devops",
    author: "Kwame Mensah",
    cover: "💸",
    stars: 412,
  },
  {
    name: "KolaLearn",
    slug: "kola-learn",
    tagline: "App mobile d'apprentissage offline pour bootcamps locaux",
    description: "App Flutter qui permet à des bootcamps de push des cours, quiz et exercices à leurs étudiants, avec sync offline. Pensé pour les zones à connectivité intermittente.",
    repoUrl: "https://github.com/codexchange/kola-learn",
    stack: "Flutter,Dart,Firebase,Supabase",
    status: "live",
    lookingFor: "mobile,backend,content",
    author: "Fatou Ndiaye",
    cover: "📚",
    stars: 156,
  },
  {
    name: "SavanaOCR",
    slug: "savana-ocr",
    tagline: "OCR léger pour langues africaines et documents administratifs",
    description: "Modèle OCR entraîné sur des documents administratifs africains (CNI, passeports, factures) avec support des caractères arabes et latins. Tourne sur edge devices.",
    repoUrl: "https://github.com/codexchange/savana-ocr",
    stack: "Python,PyTorch,TFLite",
    status: "mvp",
    lookingFor: "ml,backend,frontend",
    author: "David Mwangi",
    cover: "🔍",
    stars: 89,
  },
  {
    name: "DevFinder Africa",
    slug: "devfinder-africa",
    tagline: "Annuaire open-source des développeurs africains",
    description: "Une carte interactive des devs africains par ville et stack, avec profils enrichis. Pensé pour favoriser les embauches locales et le networking.",
    repoUrl: "https://github.com/codexchange/devfinder-africa",
    demoUrl: "https://devfinder.codexchange.dev",
    stack: "Next.js,Prisma,PostgreSQL,Mapbox",
    status: "beta",
    lookingFor: "frontend,backend,design",
    author: "Léa Mbongo",
    cover: "🗺️",
    stars: 273,
  },
  {
    name: "RustAfrica Newsletter",
    slug: "rust-africa-newsletter",
    tagline: "Newsletter hebdo sur l'écosystème Rust en Afrique",
    description: "Chaque vendredi : news, jobs, librairies et articles de devs Rust africains. Open-source, contribuable par la communauté.",
    repoUrl: "https://github.com/codexchange/rust-africa",
    demoUrl: "https://rustafrica.dev",
    stack: "Astro,MDX",
    status: "maintained",
    lookingFor: "content,design",
    author: "Samuel Adeyemi",
    cover: "🦀",
    stars: 78,
  },
  {
    name: "USSDKit",
    slug: "ussd-kit",
    tagline: "Framework open-source pour créer des services USSD en quelques heures",
    description: "Une lib qui abstrait les protocoles USSD des opérateurs (MTN, Airtel, Orange, Vodacom) derrière une API unique : menus déclaratifs, tunnel de test local, callbacks vers ton backend et gestion des sessions expirées. Un simulateur en ligne permet de tester sans téléphone ni accès opérateur.",
    repoUrl: "https://github.com/codexchange/ussd-kit",
    demoUrl: "https://ussd.codexchange.dev",
    stack: "Node.js,TypeScript,Go,Redis",
    status: "mvp",
    lookingFor: "backend,docs,devops",
    author: "Yannick Owona",
    cover: "📞",
    stars: 167,
  },
  {
    name: "Nuru",
    slug: "nuru",
    tagline: "Formulaires de terrain offline-first avec synchronisation fiable",
    description: "Nuru permet aux ONG de créer des questionnaires de collecte terrain (logique conditionnelle, signatures, photos compressées) avec une synchronisation par lots quand le réseau revient. Export compatible ODK/XLSForm, 100% open source, pensé pour les connexions intermittentes.",
    repoUrl: "https://github.com/codexchange/nuru",
    demoUrl: "https://nuru.codexchange.dev",
    stack: "React,IndexedDB,Service Workers,Node.js",
    status: "beta",
    lookingFor: "frontend,backend,qa",
    author: "Chanda Mwansa",
    cover: "📝",
    stars: 341,
  },
];

const tutorials = [
  {
    title: "Construire une API REST en Go : du hello world à la prod",
    slug: "api-rest-go-debutant-a-prod",
    excerpt: "Un guide complet pour démarrer avec Go : routing, middlewares, tests, déploiement sur VPS Hetzner. Pensé pour les devs qui viennent de Node.js ou Python.",
    body: "# Partie 1 : setup\n\nOn commence par installer Go et créer le projet. On utilise chi comme router (léger et idiomatique) plutôt que gin (trop magique pour apprendre).\n\n```go\npackage main\n\nimport (\n  \"net/http\"\n  \"github.com/go-chi/chi/v5\"\n)\n\nfunc main() {\n  r := chi.NewRouter()\n  r.Get(\"/health\", func(w http.ResponseWriter, r *http.Request) {\n    w.Write([]byte(`{\"status\":\"ok\"}`))\n  })\n  http.ListenAndServe(\":8080\", r)\n}\n```\n\n## Partie 2 : structure du projet\n\nOn sépare en 3 couches : handlers, services, repository. Ça reste testable et lisible.\n\n## Partie 3 : middlewares\n\nLogging, recovery, CORS, auth JWT.\n\n## Partie 4 : tests\n\nTests unitaires avec testify, tests d'intégration avec httptest.\n\n## Partie 5 : déploiement\n\nBuild statique, Docker multi-stage, déploiement sur Hetzner avec systemd ou K3s.",
    category: "backend",
    tags: "go,api,rest,backend",
    coverEmoji: "🐹",
    readTime: 18,
    author: "Kwame Mensah",
  },
  {
    title: "React Server Components expliqués simplement (avec exemples)",
    slug: "react-server-components-expliques",
    excerpt: "Comprendre RSC sans le jargon. Qu'est-ce qui s'exécute où ? Pourquoi ça change tout ? Exemples avec Next.js 16 et Prisma.",
    body: "# Les RSC en 5 minutes\n\nLes React Server Components sont des composants qui s'exécutent uniquement sur le serveur. Ils n'envoient jamais de JavaScript au client.\n\n## Pourquoi c'est important\n\n1. Moins de JS = page plus rapide\n2. Accès direct à la DB depuis le composant\n3. Pas de problème de CORS pour fetch\n\n## Pièges fréquents\n\n- Ne pas mélanger 'use client' et code serveur\n- Attention aux fuites de types Prisma vers le client",
    category: "frontend",
    tags: "react,nextjs,rsc,performance",
    coverEmoji: "⚛️",
    readTime: 12,
    author: "Aïcha Diallo",
  },
  {
    title: "Flutter offline-first : un pattern qui marche vraiment",
    slug: "flutter-offline-first-pattern",
    excerpt: "Comment construire une app Flutter qui marche même sans réseau. CRDT, sync diff, gestion des conflits. Code inclus.",
    body: "# Offline-first en Flutter\n\nLe pattern : on stocke tout localement (Isar ou Drift), et on sync avec le serveur en arrière-plan.\n\n## Stack recommandée\n\n- Isar pour le store local\n- Dio pour le HTTP\n- Riverpod pour le state\n- Workmanager pour le background sync\n\n## Sync diff\n\nOn garde un `updatedAt` sur chaque entité et on ne sync que ce qui a changé.",
    category: "mobile",
    tags: "flutter,offline-first,mobile,dart",
    coverEmoji: "🐦",
    readTime: 15,
    author: "Fatou Ndiaye",
  },
  {
    title: "Déployer une app Next.js sur un VPS à 5€/mois",
    slug: "deployer-nextjs-vps-5-euros",
    excerpt: "Tuto step-by-step pour déployer Next.js sur Hetzner ou DigitalOcean avec Caddy, PM2 et PostgreSQL. Pour les devs qui veulent quitter Vercel sans se ruiner.",
    body: "# Setup complet\n\n1. Louer un VPS Hetzner CX21 (2 vCPU, 4GB RAM) à 5€/mois\n2. Installer Ubuntu 24.04 + Docker\n3. Configurer Caddy pour le TLS automatique\n4. Runner l'app Next.js en standalone\n5. PostgreSQL dans un container séparé\n\n## Coût total\n\n5€/mois pour un setup qui tient 10K users/jour.",
    category: "devops",
    tags: "devops,deploy,nextjs,vps",
    coverEmoji: "🚀",
    readTime: 14,
    author: "Tobias Okonkwo",
  },
  {
    title: "Fine-tuner un modèle de computer vision sur ses propres données",
    slug: "fine-tuner-computer-vision-donnees-propres",
    excerpt: "Guide pratique pour fine-tuner MobileNet sur un dataset custom. Data augmentation, transfer learning, quantization pour edge.",
    body: "# Pipeline complet\n\n1. Collecter et labelliser 500-2000 images\n2. Data augmentation (rotations, flips, couleur)\n3. Transfer learning depuis MobileNetV3\n4. Quantization INT8 pour TFLite\n5. Déploiement sur téléphone\n\n## Astuces\n\n- Utilise Label Studio pour labelliser\n- Augmente avec albumentations\n- Quantize post-training avec TFLite converter",
    category: "ai",
    tags: "machine-learning,computer-vision,pytorch,tflite",
    coverEmoji: "🤖",
    readTime: 22,
    author: "David Mwangi",
  },
  {
    title: "Devenir dev sans diplôme : le parcours d'une autodidacte",
    slug: "parcours-dev-autodidacte",
    excerpt: "Comment je suis passée de zero-code à dev React en 18 mois. Ressources, stratégies, erreurs à éviter. Pour tous les juniors africains.",
    body: "# Mon parcours\n\nJ'ai commencé avec FreeCodeCamp, puis The Odin Project, puis des projets persos.\n\n## Ce qui a marché\n\n- Apprendre en public (Twitter + GitHub)\n- Rejoindre une communauté locale (GabonTech)\n- Faire 3-4 projets complets plutôt que 50 tutoriels\n\n## Ce qui n'a pas marché\n\n- Les bootcamps à 5000€\n- Regarder des tutos sans coder\n",
    category: "career",
    tags: "career,junior,autodidacte",
    coverEmoji: "🌱",
    readTime: 8,
    author: "Aminata Sow",
  },
  {
    title: "Intégrer mobile money (Orange, MTN, Moov) : le guide sans prise de tête",
    slug: "integrer-mobile-money-guide",
    excerpt: "Parcours complet d'une intégration mobile money : choix du provider, webhooks fiables, idempotence, réconciliation et tests. Exemples concrets avec les APIs Orange Money et MTN MoMo.",
    body: "# Les fondamentaux\n\nAvant d'écrire du code, comprendre 3 choses : le marchand est la référence de vérité, l'opérateur est asynchrone, et l'utilisateur peut couper le réseau à tout moment.\n\n## 1. Choisir son intégration\n\nDeux voies : l'agrégateur (un seul contrat, plusieurs opérateurs, fee supplémentaire) ou l'API native de l'opérateur (meilleure marge, mais une intégration par pays). Pour un MVP, l'agrégateur gagne.\n\n## 2. Idempotence\n\nGénère une clé côté client, stocke-la en unique côté serveur, et refuse toute écriture financière sans elle.\n\n```js\nconst key = req.headers['idempotency-key'];\nawait db.transaction.upsert({ where: { key }, ... });\n```\n\n## 3. Webhooks\n\n- Vérifie la signature HMAC sur le corps brut\n- Réponds 200 vite, traite en asynchrone\n- Stocke le payload brut 30 jours\n- Rejoue par polling toutes les 15 min\n\n## 4. Réconciliation\n\nUn job quotidien compare ton ledger interne et l'état réel chez l'opérateur. C'est ce qui attrape 100% des bugs de double débit.",
    category: "backend",
    tags: "mobile-money,payments,api,security",
    coverEmoji: "💰",
    readTime: 20,
    author: "Yannick Owona",
  },
  {
    title: "PostgreSQL au quotidien : index, EXPLAIN et migrations sans frayeur",
    slug: "postgresql-quotidien-index-explain",
    excerpt: "Tout ce qu'il faut savoir pour dormir tranquille avec sa base : lire un EXPLAIN ANALYZE, choisir le bon index, écrire des migrations réversibles et monitorer les requêtes lentes.",
    body: "# Lire un plan d'exécution\n\nCommence toujours par `EXPLAIN (ANALYZE, BUFFERS)`. Les 3 lignes à regarder : le type de scan (Seq Scan sur une grosse table = index manquant), les lignes estimées vs réelles (statistiques désuètes), et les buffers lus depuis le disque.\n\n## Choisir son index\n\n- Recherche par prédicats → B-tree composite dans l'ordre des filtres\n- Recherche plein texte → GIN\n- Aggrégats de lecture → index couvrant avec INCLUDE\n- Rayons de recherche → GiST / SP-GiST\n\n## Migrations réversibles\n\nChaque migration a un `up` et un `down`. Ajoute une colonne nullable, peuple-la, puis mets la contrainte en dernier — jamais d'ALTER TABLE bloquant sur une table de 50M de lignes en prod.\n\n## Monitoring\n\npg_stat_statements activé dès le jour 1, une alerte au-delà de 200 ms de moyenne, et un rituel mensuel de `VACUUM`/`ANALYZE` sur les grosses tables.",
    category: "backend",
    tags: "postgresql,sql,performance,database",
    coverEmoji: "🐘",
    readTime: 16,
    author: "Trésor Kabeya",
  },
];

const events = [
  {
    title: "React Abidjan Meetup #14",
    description: "Soirée React avec talks sur les RSC, le design system de Wave et un lightning talk sur les tests E2E avec Playwright. Networking + bière offerte.",
    date: new Date("2026-10-18T17:30:00Z"),
    endDate: new Date("2026-10-18T20:30:00Z"),
    location: "Abidjan, Côte d'Ivoire — Plateau",
    online: false,
    url: "https://meetup.com/react-abidjan",
    coverEmoji: "⚛️",
    attendees: 87,
    organizer: "Fatou Ndiaye",
  },
  {
    title: "DevOps Days Lagos 2026",
    description: "Conférence d'une journée sur le devops en contexte africain. Speakers de Paystack, Flutterwave, Jumia. Ateliers K3s, observabilité, sécurité.",
    date: new Date("2026-11-12T09:00:00Z"),
    endDate: new Date("2026-11-12T18:00:00Z"),
    location: "Lagos, Nigeria — Eko Hotel",
    online: false,
    url: "https://devopsdayslagos.com",
    coverEmoji: "🛠️",
    attendees: 312,
    organizer: "Tobias Okonkwo",
  },
  {
    title: "Flutter Dakar Workshop : offline-first patterns",
    description: "Atelier pratique de 3h : construire une app Flutter offline-first de A à Z. Apporte ton laptop. Places limitées à 30.",
    date: new Date("2026-10-25T14:00:00Z"),
    endDate: new Date("2026-10-25T17:00:00Z"),
    location: "Dakar, Sénégal — CTIC",
    online: false,
    url: "https://eventbrite.com/flutter-dakar",
    coverEmoji: "🐦",
    attendees: 28,
    organizer: "Aïcha Diallo",
  },
  {
    title: "AI Africa Online — Vision models on edge",
    description: "Talk en ligne de David Mwangi (Twiga) sur le déploiement de modèles de vision sur téléphone. Q&A à la fin. Replay disponible.",
    date: new Date("2026-10-15T18:00:00Z"),
    endDate: new Date("2026-10-15T19:30:00Z"),
    location: "Online",
    online: true,
    url: "https://zoom.us/ai-africa",
    coverEmoji: "🤖",
    attendees: 156,
    organizer: "David Mwangi",
  },
  {
    title: "Rust Africa Conf 2026",
    description: "Première conf Rust dédiée à la communauté africaine. 1 jour, 12 talks, 200 devs attendus. Sponsors: Polygon, Helius.",
    date: new Date("2026-12-05T09:00:00Z"),
    endDate: new Date("2026-12-05T18:00:00Z"),
    location: "Nairobi, Kenya — iHub",
    online: false,
    url: "https://rustafrica.dev/conf",
    coverEmoji: "🦀",
    attendees: 178,
    organizer: "Samuel Adeyemi",
  },
  {
    title: "DevFest Kigali 2026",
    description: "La plus grande conférence dev du Rwanda : 12 talks, 4 ateliers (Flutter, ML, DevOps, carrière) et un hackathon de 6h. Speakers de l'ONU, de Bolt et des startups locales. Networking en français et en anglais.",
    date: new Date("2026-11-28T08:30:00Z"),
    endDate: new Date("2026-11-28T17:00:00Z"),
    location: "Kigali, Rwanda — Norrsken House",
    online: false,
    url: "https://devfest.kigali.rw",
    coverEmoji: "🌍",
    attendees: 245,
    organizer: "Claudine Uwase",
  },
];

const mentors = [
  {
    user: "Aïcha Diallo",
    expertise: "React,Frontend Architecture,Design Systems,Career",
    bio: "10 ans d'expérience en frontend. J'ai mentoré 30+ devs africains vers des postes senior. Spécialiste de la montée en compétence front.",
    languages: "fr,en",
    hourlyRate: "Free for African devs",
    capacity: 3,
    slotsTaken: 2,
    rating: 4.9,
    reviews: 28,
  },
  {
    user: "Kwame Mensah",
    expertise: "Go,Backend Architecture,Distributed Systems,Fintech",
    bio: "Backend lead chez Paystack. Je mentor sur Go, l'architecture distribué et les carrières en fintech. Sessions bimensuelles.",
    languages: "en",
    hourlyRate: "Free",
    capacity: 2,
    slotsTaken: 1,
    rating: 5.0,
    reviews: 15,
  },
  {
    user: "Tobias Okonkwo",
    expertise: "DevOps,Kubernetes,AWS,Platform Engineering",
    bio: "Platform engineer à Lagos. J'aide les devs à passer de 'je sais docker' à 'je construis une platforme interne'. Focus sur le pragmatique.",
    languages: "en",
    hourlyRate: "30 EUR / session",
    capacity: 4,
    slotsTaken: 3,
    rating: 4.8,
    reviews: 19,
  },
  {
    user: "Jean-Pierre Mbeki",
    expertise: "Java,Spring Boot,Banking Systems,Career in enterprise",
    bio: "20+ ans dans le bancaire en Afrique centrale. Je mentor les devs qui veulent comprendre les systèmes complexes et l'ingénierie d'entreprise.",
    languages: "fr,en",
    hourlyRate: "Free",
    capacity: 2,
    slotsTaken: 0,
    rating: 4.9,
    reviews: 12,
  },
  {
    user: "David Mwangi",
    expertise: "Machine Learning,Computer Vision,Career in ML",
    bio: "ML engineer à Nairobi. J'aide les devs qui veulent pivoter vers le ML sans repartir de zéro. Focus sur le concret.",
    languages: "en,sw",
    hourlyRate: "Free",
    capacity: 3,
    slotsTaken: 1,
    rating: 4.9,
    reviews: 9,
  },
  {
    user: "Grace Wanjiru",
    expertise: "Kubernetes,Terraform,SRE,Observability",
    bio: "SRE à Nairobi. J'aide les devs à passer de 'mon pod crash' à des systèmes observables et réparables. On fait du pairing sur tes incidents réels, pas de la théorie.",
    languages: "en,sw",
    hourlyRate: "25 EUR / session",
    capacity: 3,
    slotsTaken: 2,
    rating: 4.9,
    reviews: 11,
  },
  {
    user: "Moustapha Faye",
    expertise: "Cybersecurity,AppSec,Payment Security,Career",
    bio: "Pentester à Dakar. Je mentor sur la sécurité applicative : audits de APIs, OWASP Top 10, et comment vendre la sécurité sans bloquer le produit. Sessions en français.",
    languages: "fr,en",
    hourlyRate: "Free for African devs",
    capacity: 3,
    slotsTaken: 1,
    rating: 5.0,
    reviews: 7,
  },
  {
    user: "Selamawit Bekele",
    expertise: "Java,Spring Boot,API Design,Engineering Culture",
    bio: "Backend engineer à Addis-Abeba. I mentor developers moving into enterprise Java and API design — clean contracts, versioning, and working in a distributed team.",
    languages: "en",
    hourlyRate: "Free",
    capacity: 2,
    slotsTaken: 0,
    rating: 4.8,
    reviews: 6,
  },
];

/**
 * Chronologie du seed.
 *
 * Sans horodatage explicite, tout le contenu porte l'heure du seed : le tri
 * « Chaud » n'aurait aucun écart de fraîcheur à exploiter, « En croissance »
 * verrait tous les votes tomber dans les dernières 24 h, et chaque carte
 * afficherait « il y a quelques secondes ». Les contenus sont donc étalés
 * sur ~3 mois, dans l'ordre éditorial (le premier est le plus récent).
 */
const DAY_MS = 86_400_000;

/** Âge en jours du contenu d'indice `i` : régulier + une irrégularité. */
const ageDays = (i: number, step = 2, jitter = 5) => i * step + ((i * 7) % jitter);

const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

/** Tirage uniforme entre `from` et maintenant (jamais dans le futur). */
const between = (from: number, to = Date.now()) =>
  new Date(from + Math.random() * Math.max(to - from, 0));

async function main() {
  // Garde-fou : ce seed ÉCRASE toutes les données et crée un compte admin
  // au mot de passe connu. Il ne doit jamais tourner contre une base de
  // production — on refuse donc tout `DATABASE_URL` non-local et tout
  // `NODE_ENV=production`.
  const dbUrl = process.env.DATABASE_URL ?? "";
  const looksLocal =
    dbUrl === "" ||
    /@(127\.0\.0\.1|localhost|\[::1\]):/.test(dbUrl) ||
    /^(file|sqlite):/i.test(dbUrl);
  if (process.env.NODE_ENV === "production" || !looksLocal) {
    throw new Error(
      "Seed refusé : la base ciblée ne ressemble pas à une base locale de " +
        "développement (DATABASE_URL non-local ou NODE_ENV=production). " +
        "N'amorcez jamais une base de production — elle serait écrasée et " +
        "un admin à mot de passe connu y serait créé."
    );
  }
  console.log("🗑️  Cleaning existing data...");
  await db.session.deleteMany();
  await db.vote.deleteMany();
  await db.mentorship.deleteMany();
  await db.mentor.deleteMany();
  await db.event.deleteMany();
  await db.tutorial.deleteMany();
  await db.project.deleteMany();
  await db.job.deleteMany();
  await db.post.deleteMany();
  await db.thread.deleteMany();
  await db.profile.deleteMany();
  await db.user.deleteMany();

  console.log("👤 Creating users + profiles...");
  const userMap = new Map<string, string>();
  // Un hash par compte : PBKDF2 coûte ~80 ms, on le calcule une seule fois
  // et on le réutilise (c'est un seed de démo, pas du traffic réel).
  const sharedPasswordHash = await hashPassword(SEED_PASSWORD);
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const user = await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: sharedPasswordHash,
        // B8 : seul le compte d'équipe porte `role: "admin"` dans le
        // tableau ; tout le monde naît `member`.
        role: u.role ?? "member",
        // B1 : comptes de démo déjà vérifiés, sinon le badge « profil
        // vérifié » serait vide partout et le parcours de démonstration
        // se terminerait sur un compte non confirmé.
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            username: u.username,
            headline: u.headline,
            bio: u.bio,
            country: u.country,
            city: u.city,
            stack: u.stack,
            level: u.level,
            github: u.github || null,
            twitter: u.twitter || null,
            linkedin: u.linkedin || null,
            website: u.website || null,
            available: u.available,
            avatarColor: avatarColors[i % avatarColors.length],
          },
        },
      },
      include: { profile: true },
    });
    userMap.set(u.name, user.id);
  }

  console.log("💬 Creating threads...");
  const threadMap = new Map<string, string>();
  /** Date de création de chaque question — sert à dater ses réponses. */
  const threadCreatedAt = new Map<string, Date>();
  for (const [i, t] of threads.entries()) {
    const authorId = userMap.get(t.author);
    if (!authorId) continue;
    const slug = slugify(t.title);
    const createdAt = daysAgo(ageDays(i));
    const thread = await db.thread.create({
      data: {
        title: t.title,
        slug,
        body: t.body,
        tags: t.tags,
        category: t.category,
        authorId,
        views: t.views,
        upvotes: t.upvotes,
        pinned: t.pinned,
        solved: t.solved,
        createdAt,
      },
    });
    threadMap.set(slug, thread.id);
    threadCreatedAt.set(thread.id, createdAt);
  }

  console.log("💬 Creating posts...");
  /** Réponses déjà posées sur chaque question (pour les dater entre deux). */
  const postsPerThread = new Map<string, number>();
  /** Date de chaque réponse — sert à dater ses votes. */
  const postCreatedAt = new Map<string, Date>();
  /** Réponses de niveau 1 créées — candidates à recevoir des enfants. */
  const createdPosts: {
    id: string;
    threadId: string;
    authorId: string;
    createdAt: Date;
  }[] = [];
  for (const p of posts) {
    const threadId = threadMap.get(p.threadSlug);
    const authorId = userMap.get(p.author);
    if (!threadId || !authorId) continue;
    const threadTs = threadCreatedAt.get(threadId)?.getTime() ?? Date.now() - DAY_MS;
    const seen = postsPerThread.get(threadId) ?? 0;
    postsPerThread.set(threadId, seen + 1);
    // La réponse tombe entre 15 % et 85 % de la durée de vie de la question :
    // jamais avant elle, jamais dans le futur.
    const ratio = 0.15 + 0.7 * (Math.min(seen, 4) / 4);
    const createdAt = new Date(threadTs + (Date.now() - threadTs) * ratio);
    const post = await db.post.create({
      data: {
        threadId,
        authorId,
        body: p.body,
        upvotes: p.upvotes,
        isAnswer: p.isAnswer,
        createdAt,
      },
    });
    postCreatedAt.set(post.id, createdAt);
    createdPosts.push({ id: post.id, threadId, authorId, createdAt });
  }

  /**
   * Fil de discussion : une réponse sur six reçoit elle-même des enfants.
   *
   * Sans cette phase, la base semée ne contiendrait QUE des commentaires de
   * niveau 1 : l'imbrication — le cœur du modèle Reddit — serait invisible
   * sur une prod fraîchement installée. Chronologie respectée : chaque
   * enfant tombe entre sa réponse parente et maintenant, et n'est jamais
   * écrit par l'auteur de cette réponse.
   */
  console.log("🧵 Creating nested replies...");
  const NESTED_BODIES = [
    "Précision utile : dans notre cas le gain apparaît au-delà de ~30 ms p95, en dessous il ne se voit pas.",
    "Tu as un benchmark quelque part ? J'hésite entre les deux options pour mon propre projet.",
    "Attention au coût mémoire : avec 200 connexions ouvertes on est monté à 1,2 Go. On a borné le pool à 50 et c'est passé.",
    "Merci pour la précision — c'était exactement le point qui nous bloquait côté équipe.",
    "Je nuancerai : ça dépend surtout du volume. En dessous de 1 000 req/min, la version simple suffit largement.",
    "On a ajouté un test de non-régression sur ce chemin : deux régressions évitées depuis.",
    "Quelqu'un a déjà migré sans interruption de service ? On hésite à passer par une réplication temporaire.",
    "Bon plan. Pense aussi à journaliser les erreurs de conversion, c'est là que se cachent les bugs en prod.",
    "D'accord sur le principe, mais versionnez le contrat d'API avant d'aller plus loin.",
    "Même retour chez nous : la documentation a fait plus de différence que le choix technique lui-même.",
  ];
  const postAuthors = [...userMap.values()];
  let nestedCount = 0;
  for (const [i, parent] of createdPosts.entries()) {
    if (i % 6 !== 0) continue;
    const childCount = i % 12 === 0 ? 2 : 1;
    const pool = postAuthors.filter((id) => id !== parent.authorId);
    for (let k = 0; k < childCount; k++) {
      const authorId = pool[(i * 3 + k * 7) % pool.length];
      if (!authorId) continue;
      // L'enfant tombe entre la réponse parente et maintenant.
      const p0 = parent.createdAt.getTime();
      const ratio = 0.55 + 0.35 * ((k + 1) / (childCount + 1));
      const createdAt = new Date(p0 + (Date.now() - p0) * ratio);
      const child = await db.post.create({
        data: {
          threadId: parent.threadId,
          parentId: parent.id,
          authorId,
          body: NESTED_BODIES[(i + k) % NESTED_BODIES.length],
          upvotes: 0,
          isAnswer: false,
          createdAt,
        },
      });
      postCreatedAt.set(child.id, createdAt);
      nestedCount++;
    }
  }
  console.log(`🧵 ${nestedCount} réponses imbriquées (fils visibles)`);

  console.log("💼 Creating jobs...");
  for (const j of jobs) {
    const authorId = userMap.get(j.author);
    if (!authorId) continue;
    await db.job.create({
      data: {
        title: j.title,
        company: j.company,
        location: j.location,
        country: j.country,
        remote: j.remote,
        type: j.type,
        stack: j.stack,
        salary: j.salary,
        description: j.description,
        applyUrl: j.applyUrl,
        authorId,
      },
    });
  }

  console.log("📦 Creating projects...");
  for (const p of projects) {
    const authorId = userMap.get(p.author);
    if (!authorId) continue;
    await db.project.create({
      data: {
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        stack: p.stack,
        status: p.status,
        lookingFor: p.lookingFor,
        cover: p.cover,
        stars: p.stars,
        authorId,
      },
    });
  }

  console.log("📚 Creating tutorials...");
  for (const t of tutorials) {
    const authorId = userMap.get(t.author);
    if (!authorId) continue;
    await db.tutorial.create({
      data: {
        title: t.title,
        slug: t.slug,
        excerpt: t.excerpt,
        body: t.body,
        category: t.category,
        tags: t.tags,
        coverEmoji: t.coverEmoji,
        readTime: t.readTime,
        authorId,
      },
    });
  }

  console.log("📅 Creating events...");
  for (const e of events) {
    const organizerId = userMap.get(e.organizer);
    if (!organizerId) continue;
    await db.event.create({
      data: {
        title: e.title,
        description: e.description,
        date: e.date,
        endDate: e.endDate,
        location: e.location,
        online: e.online,
        url: e.url,
        coverEmoji: e.coverEmoji,
        attendees: e.attendees,
        organizerId,
      },
    });
  }

  console.log("🎓 Creating mentors...");
  for (const m of mentors) {
    const userId = userMap.get(m.user);
    if (!userId) continue;
    await db.mentor.create({
      data: {
        userId,
        expertise: m.expertise,
        bio: m.bio,
        languages: m.languages,
        hourlyRate: m.hourlyRate,
        capacity: m.capacity,
        slotsTaken: m.slotsTaken,
        rating: m.rating,
        reviews: m.reviews,
      },
    });
  }

  console.log("🗳️  Creating votes...");
  // Les compteurs `upvotes` sont dénormalisés : on les recalcule à partir des
  // votes réels pour que le seed ne produise pas des scores fantômes.
  //
  // Le score est **net** (↑ − ↓), comme l'affiche Reddit : on insère donc
  // aussi quelques ↓ pour que le compteur ne soit jamais décoratif, et on
  // applique à ces ↓ le barème du CDC §3.2 (−1 de réputation pour l'auteur).
  const allUsers = await db.user.findMany({ select: { id: true } });
  const userIds = allUsers.map((u) => u.id);
  const allThreads = await db.thread.findMany({ select: { id: true, authorId: true } });
  const allPosts = await db.post.findMany({ select: { id: true, authorId: true } });

  // Barème du CDC §3.2, amorcé AVANT les votes : les ↓ de questions viennent
  // y ajouter −1 pour l'auteur, puis le calcul des réponses (plus bas).
  const repByUser = new Map<string, number>();
  const bump = (id: string, by: number) =>
    repByUser.set(id, (repByUser.get(id) ?? 0) + by);

  let voteCount = 0;
  /** `n` votants distincts, jamais l'auteur du contenu voté. */
  const pickVoters = (pool: string[], authorId: string, min: number, span: number) => {
    const others = pool.filter((id) => id !== authorId);
    const count = Math.min(others.length, min + Math.floor(Math.random() * span));
    return others.sort(() => Math.random() - 0.5).slice(0, count);
  };

  for (const t of allThreads) {
    // Un vote tombe entre la publication de la question et maintenant :
    // « En croissance » ne doit montrer que de la vraie activité récente.
    const t0 = threadCreatedAt.get(t.id)?.getTime() ?? Date.now() - DAY_MS;
    const voters = pickVoters(userIds, t.authorId, 4, 10);
    for (const voterId of voters) {
      await db.vote.create({
        data: {
          userId: voterId,
          kind: "thread",
          refId: t.id,
          value: 1,
          createdAt: between(t0),
        },
      });
      voteCount++;
    }
    // Un tiers des questions attire un ↓ : le score affiché peut donc passer
    // sous zéro, comme sur Reddit. Les votants sont pris parmi ceux qui n'ont
    // PAS déjà voté ↑ (contrainte unique userId+kind+refId).
    if (Math.random() < 0.34) {
      const against = userIds
        .filter((id) => id !== t.authorId && !voters.includes(id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 1 + Math.floor(Math.random() * 2));
      for (const voterId of against) {
        await db.vote.create({
          data: {
            userId: voterId,
            kind: "thread",
            refId: t.id,
            value: -1,
            createdAt: between(t0),
          },
        });
        voteCount++;
        bump(t.authorId, -1); // barème : question mal votée = −1
      }
    }
    const upvotes =
      (await db.vote.count({ where: { kind: "thread", refId: t.id, value: 1 } })) -
      (await db.vote.count({ where: { kind: "thread", refId: t.id, value: -1 } }));
    await db.thread.update({ where: { id: t.id }, data: { upvotes } });
  }

  for (const p of allPosts) {
    const p0 = postCreatedAt.get(p.id)?.getTime() ?? Date.now() - DAY_MS;
    const voters = pickVoters(userIds, p.authorId, 2, 6);
    for (const voterId of voters) {
      await db.vote.create({
        data: { userId: voterId, kind: "post", refId: p.id, value: 1, createdAt: between(p0) },
      });
      voteCount++;
    }
    const upvotes = await db.vote.count({ where: { kind: "post", refId: p.id, value: 1 } });
    await db.post.update({ where: { id: p.id }, data: { upvotes } });
  }

  console.log("🎓 Computing reputation...");
  // Le barème du CDC §3.2 (+2 par réponse votée, +10 par réponse acceptée,
  // −1 par question mal votée) doit être appliqué au seed lui-même : sinon
  // les profils afficheraient 0 de réputation alors qu'ils totalisent des
  // dizaines de votes, et l'écran paraîtrait cassé au jury.
  //
  // `repByUser` est déjà amorcé par les ↓ de questions plus haut (bump est
  // une closure du même scope) — on y ajoute le reste du barème.
  const postsWithThread = await db.post.findMany({
    select: {
      id: true,
      authorId: true,
      isAnswer: true,
      thread: { select: { authorId: true } },
    },
  });
  for (const p of postsWithThread) {
    const up = await db.vote.count({
      where: { kind: "post", refId: p.id, value: 1 },
    });
    bump(p.authorId, up * 2);
    // Comme dans /api/posts/[id] : un auteur ne gagne pas en répondant à
    // sa propre question.
    if (p.isAnswer && p.thread.authorId !== p.authorId) bump(p.authorId, 10);
  }
  // Les upvotes de questions ne rapportent rien (cf. barème).
  for (const id of userIds) {
    const reputation = repByUser.get(id) ?? 0;
    await db.user.update({ where: { id }, data: { reputation } });
  }

  console.log("✅ Seed complete!");
  const counts = {
    users: await db.user.count(),
    threads: await db.thread.count(),
    posts: await db.post.count(),
    jobs: await db.job.count(),
    projects: await db.project.count(),
    tutorials: await db.tutorial.count(),
    events: await db.event.count(),
    mentors: await db.mentor.count(),
    votes: voteCount,
  };
  console.log("📊 Counts:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
