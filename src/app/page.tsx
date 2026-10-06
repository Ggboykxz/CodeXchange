"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { HomeSection } from "@/components/sections/home-section";

/**
 * Découpage du bundle.
 *
 * Les 6 sections secondaires sont chargées à la demande : elles représentent
 * l'essentiel du poids applicatif (listes, filtres, dialogs, markdown), et
 * l'utilisateur n'en ouvre qu'une par session. La home reste synchrone pour
 * que la page d'accueil soit servie rendue (LCP / SEO).
 *
 * Objectif du CDC : première charge < 150 Ko compressé.
 */
function SectionLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid grid-cols-1 md:grid-cols-2 gap-4"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Chargement…</span>
      <div className="h-44 rounded-lg bg-muted animate-pulse" />
      <div className="h-44 rounded-lg bg-muted animate-pulse" />
      <div className="h-44 rounded-lg bg-muted animate-pulse" />
      <div className="h-44 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

// Next 16 exige un objet littéral passé en ligne à `dynamic()` :
// on ne peut pas extraire les options dans une constante partagée.
const ForumSection = dynamic(
  () => import("@/components/sections/forum-section").then((m) => m.ForumSection),
  { ssr: false, loading: SectionLoading }
);
const JobsSection = dynamic(
  () => import("@/components/sections/jobs-section").then((m) => m.JobsSection),
  { ssr: false, loading: SectionLoading }
);
const ProjectsSection = dynamic(
  () => import("@/components/sections/projects-section").then((m) => m.ProjectsSection),
  { ssr: false, loading: SectionLoading }
);
const MentoratSection = dynamic(
  () => import("@/components/sections/mentorat-section").then((m) => m.MentoratSection),
  { ssr: false, loading: SectionLoading }
);
const TutosSection = dynamic(
  () => import("@/components/sections/tutos-section").then((m) => m.TutosSection),
  { ssr: false, loading: SectionLoading }
);
const AnnuaireSection = dynamic(
  () => import("@/components/sections/annuaire-section").then((m) => m.AnnuaireSection),
  { ssr: false, loading: SectionLoading }
);

export default function Page() {
  const section = useAppStore((s) => s.section);
  const navigate = useAppStore((s) => s.navigate);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  // Try to fetch current user on mount
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Parse initial hash on mount (e.g. #forum or #forum/some-slug)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const [sectionName, param] = hash.split("/");
    if (
      ["forum", "jobs", "projects", "mentorat", "tutos", "annuaire"].includes(
        sectionName
      )
    ) {
      navigate(sectionName, param);
    }
  }, [navigate]);

  const renderSection = () => {
    switch (section) {
      case "forum":
        return <ForumSection />;
      case "jobs":
        return <JobsSection />;
      case "projects":
        return <ProjectsSection />;
      case "mentorat":
        return <MentoratSection />;
      case "tutos":
        return <TutosSection />;
      case "annuaire":
      case "dashboard":
        // Le "dashboard" ouvre pour l'instant l'annuaire (voir roadmap).
        return <AnnuaireSection />;
      case "home":
      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{renderSection()}</main>
      <Footer />
    </div>
  );
}
