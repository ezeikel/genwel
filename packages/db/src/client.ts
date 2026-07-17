import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { PrismaClient } from './generated/prisma/client';

// Configure WebSocket for Neon (required for Node.js environments)
neonConfig.webSocketConstructor = ws;

// Enable querying over fetch for edge environments (Vercel)
neonConfig.poolQueryViaFetch = true;

type PrismaGlobal = typeof globalThis & {
  __genwelPrisma?: PrismaClient;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }]
        : undefined,
  });
};

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

/**
 * Lazily-instantiated singleton Prisma client. Cached on globalThis so Next.js
 * hot-reloads / serverless invocations reuse one connection pool.
 */
export const getDb = () => {
  const globalForPrisma = globalThis as PrismaGlobal;
  if (!globalForPrisma.__genwelPrisma) {
    globalForPrisma.__genwelPrisma = createPrismaClient();
  }
  return globalForPrisma.__genwelPrisma;
};

/**
 * Convenience proxy that forwards to the lazy singleton. Lets consumers write
 * `db.user.findUnique(...)` (e.g. NextAuth's `PrismaAdapter(db)`) without each
 * call site invoking `getDb()`. The client is only created on first property
 * access, so importing `db` never throws when DATABASE_URL is absent — this is
 * what keeps an env-less `next build` (CI page-data collection) green.
 * (Pattern mirrors cadem-sports.)
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
