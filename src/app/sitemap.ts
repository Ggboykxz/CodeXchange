import type { MetadataRoute } from "next";

const SECTIONS = ["forum", "jobs", "projets", "annuaire", "tutos", "evenements", "mentorat"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://code-x-change-seven.vercel.app";
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...SECTIONS.map((s) => ({
      url: `${base}/${s}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
