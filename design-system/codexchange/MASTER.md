# CodeXchange — MASTER design system

> Source of truth generated/extended via the `ui-ux-pro-max` skill.
> Direction chosen: **evolve the existing developer‑terminal identity** (not a
> wholesale rebrand). Read this before editing any UI. Page‑specific
> deviations go in `design-system/codexchange/pages/<page>.md` and override
> this file.

## Identity

Developer‑terminal aesthetic ("OpenCode‑inspired") for the African developer
community. Monospace‑first, ink‑on‑paper, `$ codexchange.dev` prompt motif,
warm‑earth accent. Precise, fast, a bit "hacker", but approachable.

## Foundations

- **Type:** IBM Plex Mono everywhere (`--font-mono`). Weights 300–700.
  - Display: `.display` (weight 700, tracking ‑0.025em, line‑height 1.05).
  - Eyebrow/label: `.eyebrow` (uppercase, 0.7rem, tracking 0.15em, muted).
  - Body stays mono — do **not** reintroduce a proportional serif/sans; that
    was explicitly rejected in favor of the terminal identity.
- **Color tokens** (`src/app/globals.css`, light + `.dark`):
  - Surfaces: `--background` (off‑white / near‑black), `--card`, `--popover`.
  - Ink: `--foreground`; neutrals `--muted*`, `--secondary*`, `--accent*`.
  - **Brand accent:** `--brand` (terracotta, echoes avatar palette) +
    `--brand-foreground`. Used for CTAs, links, active nav, focus ring.
  - `--ring: var(--brand)` — every focus ring is brand‑colored, in both themes.
  - `--destructive` error red; `--chart-1..5` for data viz / tag tones.
- **Radius:** `--radius` 0.375rem → sm/md/lg/xl scale. Keep tight (terminal).
- **Spacing:** 4/8px rhythm; section gaps 24/32/48px. `max-w-6xl` content
  width with `px-4 sm:px-6` gutters.

## Components

- **Button:** default variant = `bg-brand` (primary CTA is terracotta).
  `secondary`/`outline`/`ghost`/`link` = neutral. Link = `text-brand`.
- **Card:** `rounded-xl border shadow-sm`; interactive cards get a hover
  (`border-brand/40` + `rise-in` entrance, staggered ≤8).
- **Tag/Chip:** `font-mono text-[11px]`; semantic `tone` maps to chart palette.
- **Input/Select/Textarea:** focus = brand ring (`--ring`), visible ≥3px.
- **Icons:** Lucide, `stroke-width 1.6`, rounded caps (see globals.css). No
  emoji used as structural icons.

## Motion

- Durations 150–300ms for hover/focus; entrance `rise-in` 240ms with a
  ≤8‑item 45ms stagger; `vote-pop` 220ms on vote. All auto‑disabled under
  `prefers-reduced-motion` (globals.css). No layout‑shifting press states.

## Accessibility (WCAG 2.1 AA — non‑negotiable)

- Visible focus on every operable control; tab order = visual order.
- Body text ≥4.5:1 in **both** themes (verify dark independently).
- Color is never the sole indicator; states also use icon/text.
- Skip‑link (2.4.1); reduced‑motion respected; keyboard‑only operable.
- Focus never obscured by sticky/overlay chrome.

## Do / Don't

- **Do:** use semantic tokens (`bg-brand`, `text-muted-foreground`), keep
  mono, keep the `$` prompt motif, keep CTA accent sparing and consistent.
- **Don't:** hardcode hex per screen, reintroduce non‑mono display fonts,
  drop focus outlines, use emoji as icons, or make every button terracotta
  (only the *primary* action per view).

## Pre‑delivery checklist (from skill)

- [ ] Mono preserved; tokens used (no ad‑hoc colors)
- [ ] `cursor-pointer` on all clickables; hover 150–300ms
- [ ] Focus visible (brand ring) on keyboard nav
- [ ] Contrast ≥4.5:1 light **and** dark
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive 375 / 768 / 1024 / 1440
