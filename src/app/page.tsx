"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { HomeSection } from "@/components/sections/home-section";
import { ForumSection } from "@/components/sections/forum-section";
import { JobsSection } from "@/components/sections/jobs-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { MentoratSection } from "@/components/sections/mentorat-section";
import { TutosSection } from "@/components/sections/tutos-section";
import { AnnuaireSection } from "@/components/sections/annuaire-section";

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
        return <AnnuaireSection />;
      case "dashboard":
        // For now, dashboard redirects to annuaire with the user's username
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
