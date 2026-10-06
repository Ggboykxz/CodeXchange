import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Client Prisma singleton.
 *
 * Le log `['query']` était actif **en production** : chaque statement SQL
 * (dont les lookups de `passwordHash` pendant le login) partait dans stdout,
 * et `package.json` pipe cette sortie via `tee dev.log` / `tee server.log` —
 * soit des credentials intermédiaires écrits en clair sur disque.
 * On ne garde le log des requêtes qu'en développement.
 */
const isDev = process.env.NODE_ENV !== 'production'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (isDev) globalForPrisma.prisma = db
