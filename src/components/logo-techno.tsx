import {
  siAngular,
  siAnsible,
  siApollographql,
  siApacheairflow,
  siApachekafka,
  siArduino,
  siBabel,
  siBiome,
  siBlender,
  siCelery,
  siCss,
  siCypress,
  siDart,
  siDeno,
  siDjango,
  siDocker,
  siEthers,
  siExpo,
  siFastapi,
  siFigma,
  siFirebase,
  siFlutter,
  siGit,
  siGithub,
  siGo,
  siGradle,
  siGraphql,
  siHibernate,
  siHotjar,
  siJenkins,
  siJest,
  siJetpackcompose,
  siJavascript,
  siKotlin,
  siKubernetes,
  siLangchain,
  siLaravel,
  siMqtt,
  siMongodb,
  siNextdotjs,
  siNestjs,
  siNodedotjs,
  siNotion,
  siNpm,
  siNuxt,
  siPinia,
  siPostgresql,
  siPnpm,
  siPrisma,
  siPrettier,
  siPython,
  siPytorch,
  siReact,
  siRedis,
  siRedux,
  siReactivex,
  siR,
  siRust,
  siSqlalchemy,
  siSqlite,
  siSolana,
  siSolidity,
  siSpring,
  siSpringboot,
  siSwift,
  siTailwindcss,
  siTensorflow,
  siTerraform,
  siTypescript,
  siUikit,
  siUnity,
  siVite,
  siVitest,
  siVuedotjs,
  siSupabase,
} from "simple-icons";

import { cn } from "@/lib/cn";

type IconeTechno = { path: string; hex: string; title: string };

/**
 * Registre des logos technologiques. Normalisation : on enlève espaces,
 * ponctuation et accents (lowercase), donc « Next.js », « NextJS » et
 * « nextjs » résolvent au même logo.
 */
const LOGOS: Record<string, IconeTechno> = {
  angular: siAngular,
  ansible: siAnsible,
  mongo: siMongodb,
  apollo: siApollographql,
  apollographql: siApollographql,
  airflow: siApacheairflow,
  apacheairflow: siApacheairflow,
  kafka: siApachekafka,
  apachekafka: siApachekafka,
  arduino: siArduino,
  babel: siBabel,
  biome: siBiome,
  blender: siBlender,
  celery: siCelery,
  css: siCss,
  css3: siCss,
  cypress: siCypress,
  dart: siDart,
  deno: siDeno,
  django: siDjango,
  docker: siDocker,
  ethers: siEthers,
  ethersjs: siEthers,
  expo: siExpo,
  fastapi: siFastapi,
  figma: siFigma,
  firebase: siFirebase,
  flutter: siFlutter,
  git: siGit,
  github: siGithub,
  go: siGo,
  golang: siGo,
  gradle: siGradle,
  graphql: siGraphql,
  hibernate: siHibernate,
  hotjar: siHotjar,
  jenkins: siJenkins,
  jest: siJest,
  jetpackcompose: siJetpackcompose,
  js: siJavascript,
  javascript: siJavascript,
  spring: siSpring,
  kotlin: siKotlin,
  kubernetes: siKubernetes,
  k8s: siKubernetes,
  langchain: siLangchain,
  laravel: siLaravel,
  mongodb: siMongodb,
  mqtt: siMqtt,
  nestjs: siNestjs,
  nextjs: siNextdotjs,
  next: siNextdotjs,
  node: siNodedotjs,
  nodejs: siNodedotjs,
  notion: siNotion,
  npm: siNpm,
  nuxt: siNuxt,
  nuxtjs: siNuxt,
  pinia: siPinia,
  postgres: siPostgresql,
  postgresql: siPostgresql,
  postgresqlite: siSqlite,
  pnpm: siPnpm,
  prettier: siPrettier,
  prisma: siPrisma,
  python: siPython,
  pytorch: siPytorch,
  r: siR,
  react: siReact,
  reactnative: siReact,
  redis: siRedis,
  redux: siRedux,
  reactivex: siReactivex,
  rxjs: siReactivex,
  rust: siRust,
  solana: siSolana,
  solidity: siSolidity,
  springboot: siSpringboot,
  sqlite: siSqlite,
  supabase: siSupabase,
  swift: siSwift,
  tailwind: siTailwindcss,
  tailwindcss: siTailwindcss,
  tensorflow: siTensorflow,
  terraform: siTerraform,
  typescript: siTypescript,
  ts: siTypescript,
  uikit: siUikit,
  unity: siUnity,
  vite: siVite,
  vitest: siVitest,
  vue: siVuedotjs,
  vuejs: siVuedotjs,
  sqlalchemy: siSqlalchemy,
};

// Aliases fonctionnels (variante d'écriture ou nom complet).
const ALIAS: Record<string, string> = {
  "tailwindcss": "tailwind",
  "tailwindcssv3": "tailwind",
  "tailwindcssv4": "tailwind",
  "ci/cd": "cicd",
  "ci-cd": "cicd",
  "ci cd": "cicd",
  "next js": "nextjs",
  "react native": "reactnative",
  "spring boot": "springboot",
  "node js": "nodedotjs",
  "node.js": "nodedotjs",
  "vue js": "vue",
  "tailwind css": "tailwind",
  "postgre sql": "postgresql",
  "powerball": "python",
};

export function logoTechno(nom: string): IconeTechno | null {
  const cle = String(nom ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (LOGOS[cle]) return LOGOS[cle];
  const aliasCle = ALIAS[String(nom ?? "").toLowerCase().trim()];
  if (aliasCle && LOGOS[aliasCle]) return LOGOS[aliasCle];
  return null;
}

/** Composant badge technologique — vrai logo Simple Icons, sinon initiales. */
export default function LogoTechno({ nom, className = "size-4" }: { nom: string; className?: string }) {
  const icon = logoTechno(nom);
  if (!icon) {
    const initiales = String(nom || "?")
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((mot) => mot[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md bg-cx-muted/40 text-[10px] font-bold leading-none text-cx-muted-fg",
          className,
        )}
      >
        {initiales}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={icon.title}
      className={cn("shrink-0", className)}
      fill={`#${icon.hex}`}
      style={{ color: `#${icon.hex}` }}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}
