"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useAppStore, useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { AuthDialog } from "@/components/shell/auth-dialog";
import { FeedSection } from "@/components/sections/feed-section";

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
const AdminSection = dynamic(
  () => import("@/components/sections/admin-section").then((m) => m.AdminSection),
  { ssr: false, loading: SectionLoading }
);

export default function Page() {
  const section = useAppStore((s) => s.section);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const t = useT();

  // Try to fetch current user on mount
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /**
   * B6 — erreur d'aller-retour OAuth. Le serveur renvoie
   * `/?oauth_error=code` : on traduit en toast puis on nettoie l'URL,
   * sinon le message reviendrait à chaque rafraîchissement.
   * `silent` = l'utilisateur a annulé chez le fournisseur : rien.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oauth_error");
    if (!code) return;
    params.delete("oauth_error");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
    );
    if (code === "silent") return;
    toast.error(
      code === "state"
        ? t("auth.oauth.error_state")
        : code === "email"
          ? t("auth.oauth.error_email")
          : t("auth.oauth.error")
    );
  }, [t]);

  /**
   * L'URL est la source de vérité de la navigation.
   *
   * - au montage : un lien partagé `#forum/slug` ouvre la bonne discussion ;
   * - `hashchange` : clic sur un lien natif (`<a href="#jobs">`) ;
   * - `popstate`   : boutons Retour / Avant du navigateur.
   *
   * `syncFromHash` ne réécrit jamais l'historique, sinon on créerait une
   * boucle (le navigateur écrit → on réécris → …).
   */
  useEffect(() => {
    const sync = () => useAppStore.getState().syncFromHash();
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

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
      case "admin":
        // B8 — l'écran fait sa propre garde (déconnecté / non-admin) :
        // le serveur refuse de toute façon, l'UI ne fait que le dire.
        return <AdminSection />;
      case "home":
      default:
        // L'accueil EST le fil : on arrive sur du contenu vivant, pas sur une
        // page vitrine (cf. Reddit/Facebook : le réseau commence par un flux).
        return <FeedSection />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* `id="contenu"` = cible du lien d'évitement (WCAG 2.4.1). */}
      <main id="contenu" className="flex-1">
        {renderSection()}
      </main>
      <Footer />
      {/* Modale d'auth unique : ouverte par `openAuth()` depuis n'importe où. */}
      <AuthDialog />
    </div>
  );
}
