# Déploiement CodeXchange

Trois niveaux, du plus robuste au dernier recours. Le choix est tranché le **21 octobre** selon le compte Vercel du commanditaire.

## 1. Principal — Vercel + Neon (si compte Vercel créé)

```bash
# Produit
vercel link            # associer le dépôt au projet
vercel env add DATABASE_URL   # chaîne de connexion Neon (gratuit, via dashboard Vercel)
vercel --prod          # déploiement
```

Dans le dashboard Vercel → Settings → Environment Variables : `DATABASE_URL` = `postgres://…` (Neon).
Premier déploiement en prod :

```bash
DATABASE_URL="postgres://…" npx prisma migrate deploy
DATABASE_URL="postgres://…" npm run seed
```

## 2. Pont — tunnel cloudflared (0 compte)

À défaut de compte au 21 oct. :

```bash
cloudflared tunnel --url http://localhost:3000
```

Donne une URL `https://…trycloudflare.com` publique tant que la machine reste allumée. Build local (`next build && npm start`) puis tunnel. La machine **doit** rester en ligne pendant toute la démo — garder une vidéo de secours (voir `docs/pitch.md`).

## 3. Dernier recours — GitHub Pages (export statique)

Sans backend : export Next (`output: 'export'`) avec données dans le navigateur. Perte de la persistance multi-utilisateur mais garantit une URL stable. Activé uniquement si le niveau 2 tombe le 24 oct.

## CI

Vérifiée verte depuis le commit `e94177f` : `npm ci` → `prisma generate` → `prisma migrate deploy` (`DATABASE_URL=file:./dev.db`) → lint → tests, tous bloquants.

## Checklist pré-démo (24 oct)

- [ ] `npm run build` vert localement
- [ ] `scripts/demo.sh` lancé (seed + serve)
- [ ] URL ouverte sur téléphone + navigation complète
- [ ] Capture d'écran et vidéo de secours à jour