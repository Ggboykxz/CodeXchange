# CodeXchange — SEO context

## Product
- **What:** African developer community platform — forum, jobs, projects (co-founders), directory, tutorials, events, mentorship, private messaging, favorites. All in French (EN covered). (source: README.md)
- **Who buys:** Developers in Africa (francophone primarily), plus recruiters and founders looking for African dev talent. (source: README.md, src/app/page.tsx hero copy)
- **Conversion action:** Sign up / create an account (`/inscription`). (source: src/app/page.tsx CTA "Créer un compte")
- **Pricing:** Free. No paid tier in codebase. (source: grep "premium|subscription|pricing" → none)
- **Stack:** Next.js 16, TypeScript, Tailwind v4, Prisma (SQLite→Postgres), Vitest. Deployed on Vercel. (source: README.md, vercel.json)

## Live site
- URL: https://code-x-change-seven.vercel.app (source: src/app/layout.tsx metadataBase)
- Health: /api/sante
- Sitemap: /sitemap.xml (fixed base URL to vercel.app on 2026-10-17)
- robots.txt: Allow all, sitemap declared.

## Features (v1) — source: README.md
Forum, Jobs, Projects, Directory, Tutorials, Events, Mentorship, Notifications, Global search, Private messaging, Favorites, Reactions, Profile (avatar upload), Admin dashboard.

## Competitors
To be determined (run competitor discovery). Candidates in African dev space: (none listed in repo — needs research).

## Claims & limits
- "Par les devs, pour les devs" (tagline). (source: footer)
- 31 demo members, 15 posts, 10 jobs, 8 projects, 6 events, 8 tutorials, 6 mentors (seed). (source: README.md, prisma/seed.ts)
- Free, French-first, mobile-friendly. (source: README.md)

## Keywords (seed, to be expanded)
- communauté développeurs Afrique
- forum développeurs francophone
- offres emploi développeur Afrique
- mentorat développeur
- projets open source Afrique
- événements tech Afrique

## Notes
- Demo scheduled 2026-10-25 (hackathon). SEO is post-demo priority but sitemap/robots fixed now.
- No analytics integration detected (no GA/Plausible in code). Add for measurement.
EOF
echo written