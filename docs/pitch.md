# Pitch CodeXchange — hackathon 25 octobre

Durée cible : **3 minutes de démo + 2 minutes Q&R**.

## Storyboard (3 min)

1. **0:00 – 0:20** Intro : « Les devs africains sont isolés : résultats dispersés dans Discord, WhatsApp, Twitter. CodeXchange centralise la vie tech locale. »
2. **0:20 – 0:45** Landing : chiffres réels (28 membres, 15 sujets, 10 offres), 6 cartes de sections.
3. **0:45 – 1:15** Forum : ouvrir un sujet, répondre, aimer (démo d'idempotence), filtre par tag.
4. **1:15 – 1:40** Annuaire : filtrer par pays/stack, profil public avec drapeau, compteur de stack.
5. **1:40 – 2:10** Emplois + projets : publier une offre, postuler, idempotence ; rejoindre un projet ; badges.
6. **2:10 – 2:35** Tutos markdown + mentorat : ouvrir un tuto, demander un mentor (409 sur doublon).
7. **2:35 – 3:00** Rappeler : mobile-first, FR, 0 €, tests unitaires (100+ verts), déployable Vercel+Neon en 10 min.

## Plan B — vidéo de secours (24 oct)

- Enregistrer une vidéo de démo de 3 min en full HD, locale, hors-réseau, avec le `README.md` ouvert.
- Telecharger la vidéo sur Google Drive et YouTube unlisted — lien à porter.
- Servir le tunnel `cloudflared` comme plan C (URL stable le 24 pendant la nuit).

## Checklist du 25

- [ ] `npm run lint` ✅ ; `npm test` ✅ ; `npm run build` ✅ (vérifiés avant de partir)
- [ ] `npm run seed` lancé → dev.db avec données réelles
- [ ] URL publique ouverte en onglet secret sur mobile + desktop
- [ ] navigator Incognito / Safari + Firefox testés
- [ ] Script de pitch imprimé en 3 exemplaires
- [ ] Générateur de QR code pour l'URL collé sur le stand
- [ ] Points à défendre aux juges :
  - Fonctionnel sur 100 % des features annoncées
  - Tests réels (≥ 100, TDD, not mocking fluff)
  - Identité africaine (drapeaux, villes, data réelle)
  - Déploiement en Production ready (DB interchangeable SQLite→Postgres)

## Risques connus

- Tunnel cloudflared instable : vidéo de secours dispo sur téléphone + laptop.
- DB locale perdue au redémarrage : `npm run seed` en 10 s.
- Langue : si un juge non-francophone, rediriger vers les projets en Anglais (non promis).