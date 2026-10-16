# Pitch CodeXchange — hackathon 25 octobre

Durée cible : **3 minutes de démo + 2 minutes Q&R**.

## Storyboard (3 min)

1. **0:00 – 0:20** Intro : « Les devs africains sont isolés : résultats dispersés dans Discord, WhatsApp, Twitter. CodeXchange centralise la vie tech locale. »
2. **0:20 – 0:45** Landing : chiffres réels (31 membres, 15 sujets, 10 offres, 8 projets, 6 événements, 8 tutos), 6 cartes de sections.
3. **0:45 – 1:15** Forum : ouvrir un sujet, répondre, aimer (démo d'idempotence), filtre par tag.
4. **1:15 – 1:40** Annuaire : filtrer par pays/stack, profil public avec drapeau, compteur de stack.
5. **1:40 – 2:10** Emplois + projets : publier une offre, postuler, idempotence ; rejoindre un projet ; badges.
6. **2:10 – 2:35** Tutos markdown + mentorat : ouvrir un tuto, demander un mentor (409 sur doublon).
7. **2:35 – 3:00** Rappeler : mobile-first, FR, 0 €, **237 tests verts** (dont contrastes WCAG calculés dans les deux thèmes et clavier vérifié en DOM), déployable Vercel+Neon en 10 min.

## Ce qui différencie l'UI (à placer en Q&R)

- **Design system à tokens** (`--cx-*`, thème clair/sombre) : un seul accent
  orange par vue, bleu réservé aux liens/état actif/données.
- **Zéro dégradé** : la profondeur vient des bordures, ombres et du rythme
  typographique — pas d'effets.
- **Accessibilité mesurée, pas promise** : `tests/contraste.test.ts` calcule
  WCAG 2.1 sur les tokens (texte ≥ 4,5:1, interface ≥ 3:1) dans les deux
  thèmes ; la navigation clavier (menus, dialogues, drawer) est testée en DOM.
- **Mobile-first vérifié** : `h-dvh`, safe-areas iOS, drawer avec contenu
  derrière en `inert`, cibles tactiles ≥ 44 px sur les actions.
- **Mouvement sobre** : transitions ≤ 200 ms sur `transform`/`opacity`,
  `prefers-reduced-motion` respecté.
- Preuves : `docs/verification-ui.md`.

## Plan B — vidéo de secours (24 oct)

- Enregistrer une vidéo de démo de 3 min en full HD, locale, hors-réseau, avec le `README.md` ouvert.
- Telecharger la vidéo sur Google Drive et YouTube unlisted — lien à porter.
- Servir le tunnel `cloudflared` comme plan C (URL stable le 24 pendant la nuit).

## Checklist du 25

- [ ] `npm run lint` ✅ ; `npm test` ✅ (237) ; `npm run build` ✅ (vérifiés avant de partir)
- [ ] Passe navigateur 375/768/1024/1440 (checklist `docs/verification-ui.md` §3) faite la veille
- [ ] `npm run seed` lancé → dev.db avec données réelles
- [ ] URL publique ouverte en onglet secret sur mobile + desktop
- [ ] navigator Incognito / Safari + Firefox testés
- [ ] Script de pitch imprimé en 3 exemplaires
- [ ] Générateur de QR code pour l'URL collé sur le stand
- [ ] Points à défendre aux juges :
  - Fonctionnel sur 100 % des features annoncées
  - Tests réels (237, TDD, pas de mock décoratif) — dont conformité design et WCAG
  - Identité africaine (drapeaux, villes, data réelle)
  - Déploiement en Production ready (DB interchangeable SQLite→Postgres)

## Risques connus

- Tunnel cloudflared instable : vidéo de secours dispo sur téléphone + laptop.
- DB locale perdue au redémarrage : `npm run seed` en 10 s.
- Langue : si un juge non-francophone, rediriger vers les projets en Anglais (non promis).