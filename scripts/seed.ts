/**
 * CodeXchange — Database seed
 * Seeds realistic mock data for the African dev platform.
 */
import { db } from "../src/lib/db";

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
    pinned: true,
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
];

async function main() {
  console.log("🗑️  Cleaning existing data...");
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
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const user = await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: "member",
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
  for (const t of threads) {
    const authorId = userMap.get(t.author);
    if (!authorId) continue;
    const slug = slugify(t.title);
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
      },
    });
    threadMap.set(slug, thread.id);
  }

  console.log("💬 Creating posts...");
  for (const p of posts) {
    const threadId = threadMap.get(p.threadSlug);
    const authorId = userMap.get(p.author);
    if (!threadId || !authorId) continue;
    await db.post.create({
      data: {
        threadId,
        authorId,
        body: p.body,
        upvotes: p.upvotes,
        isAnswer: p.isAnswer,
      },
    });
  }

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
