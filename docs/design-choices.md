# Choix de design — CodeXchange

Retenu le **2026-10-13** via le moteur du skill `ui-ux-pro-max` (requête « developer community SaaS dashboard »).

## Style
**SaaS professionnel** (glassmorphism light) — validé sur la checklist accessibilité du skill (contraste 4.5:1 minimum, focus visible). Évite le thème « Dark Mode (OLED) » que le skill proposait autrement : une démo à la lumière d'une salle est illisible sur un thème OLED-only.

## Palette
| Rôle | Clair | Sombre |
|---|---|---|
| Fond | `#F8FAFC` | `#0F172A` |
| Texte | `#1E293B` | `#F8FAFC` |
| Primaire (blue trust) | `#2563EB` | `#60A5FA` |
| Primaire (fg) | `#FFFFFF` | `#0F172A` |
| Accent CTA (orange) | `#EA580C` | `#FB923C` |
| Carte | `#FFFFFF` | `#1E293B` |
| Muted | `#E9EFF8` | `#334155` |
| Muted fg | `#475569` | `#CBD5E1` |
| Bordure | `#E2E8F0` | `#334155` |
| Destructive | `#DC2626` | `#EF4444` |

## Typographie
- **Plus Jakarta Sans** (400/500/600/700) pour titres **et** texte — une seule famille, chargement léger (~30 ko), mood friendly/modern/saas/clean/approachable/professional. Chargée avec `next/font/google` (variable `--font-plex`, `display: swap`).

## Rayons / ombres
- Rayons : `rounded-xl` pour les cartes, `rounded-full` pour les boutons (pilule), `rounded-full` pour les avatars/tags.
- Ombre carte : `shadow-sm` en clair, aucune ombre en sombre (Borders only).
- Transitions : 150–250 ms sur hover/focus.

## Anti-patterns écartés
- Pas d'emojis comme icônes (lucide-react ou SVG Heroicons si nécessaire).
- Pas d'animation lourde ; `prefers-reduced-motion` respecté (voir `globals.css`).
- Pas de dark mode par défaut (clair first) conformément à la recommandation du skill.

## Conventions
- Couleurs via les classes `cx-*` (Tailwind v4 `@theme inline`) plutôt que les hex bruts dans les composants — changement de palette = une seule source.
- Utiliser `bg-cx-bg` / `text-cx-fg` / `bg-cx-primary` / `text-cx-primary-fg` / `bg-cx-accent` / `bg-cx-card` / `text-cx-card-fg` / `bg-cx-muted` / `text-cx-muted-fg` / `border-cx-border` / `text-cx-destructive`.