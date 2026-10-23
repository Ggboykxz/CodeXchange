"use client";

import { useEffect } from "react";
import { useToast } from "./toast";

/** Guide rapide affiché une seule fois aux nouveaux membres. */
export default function Onboarding() {
  const toast = useToast();
  useEffect(() => {
    try {
      if (localStorage.getItem("cx_onboarded")) return;
      setTimeout(() => toast.info("Bienvenue sur CodeXchange", "Pose ta première question au forum, consulte les offres, recrute des co-fondateurs."), 1500);
      setTimeout(() => toast.info("Parcours rapide", "Explore les profils, suis des tags et accède au mentorat."), 12000);
      setTimeout(() => toast.info("Explore la plateforme", "Les événements, tutos et projets sont au menu."), 24000);
      localStorage.setItem("cx_onboarded", "1");
    } catch {
      // silencieux
    }
  }, [toast]);
  return null;
}
