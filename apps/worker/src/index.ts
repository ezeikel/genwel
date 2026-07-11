// Sentry must be imported first — it patches the runtime on init, so this
// import has to stay above the others. The ignore stops Biome's import sorter
// from alphabetising it back down.
// biome-ignore assist/source/organizeImports: Sentry must be imported first
import { Sentry } from './instrument.js';
import { db } from '@genwel/db';
import { categorizeUserTransactions } from '@genwel/banking/categorize';
import { isSyncStale, syncUserTransactions } from '@genwel/banking/sync';
import { serve } from '@hono/node-server';
import { type Context, Hono } from 'hono';
import { logger } from 'hono/logger';

// Genwel background worker. Runs on the shared Hetzner box (port 3080) as the
// `genwel-worker` systemd service. It owns the long, rate-limited bank work —
// TrueLayer transaction sync + AI categorization — that previously ran in a
// Next.js `after()` and was bounded by the serverless execution ceiling (which
// forced the "visit the dashboard twice to categorize everything" behaviour).
// Here there is no timeout, so it drains the whole backlog in one go.
// Env is loaded by tsx's --env-file locally and systemd's EnvironmentFile on
// the box.

const app = new Hono();
app.use('*', logger());

app.onError((err, c) => {
  console.error(`[onError] ${c.req.method} ${c.req.path}:`, err);
  Sentry.captureException(err);
  return c.json(
    { error: err instanceof Error ? err.message : 'Internal server error' },
    500,
  );
});

// Bearer auth for the privileged endpoints — only trusted callers (the web app)
// may trigger a sync. Sent as `Authorization: Bearer <WORKER_SECRET>`. Unset
// secret = open (local dev). /health stays unauthenticated + lightweight.
const bearerAuth = async (
  c: Context,
  next: () => Promise<void>,
): Promise<Response | void> => {
  const secret = process.env.WORKER_SECRET;
  if (!secret) return next();
  if (c.req.header('authorization') !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
};
app.use('/sync/*', bearerAuth);

app.get('/health', (c) => c.json({ status: 'ok', service: 'genwel-worker' }));

// Drain the categorization backlog. categorizeUserTransactions is deliberately
// bounded per call (a page-sized query + a handful of AI batches) so a single
// call stays cheap; the worker just loops it until nothing is left. The loop is
// capped so a bug can't spin forever, and stops early if a pass makes no
// progress (e.g. the AI provider is rate-limited and every batch failed).
const MAX_CATEGORIZE_PASSES = 100;
async function drainCategorization(userId: string): Promise<void> {
  for (let pass = 0; pass < MAX_CATEGORIZE_PASSES; pass += 1) {
    const { aiCategorized, cached, remaining } =
      await categorizeUserTransactions(userId, { maxAiBatches: 5 });
    console.log(
      `[sync/transactions] pass ${pass + 1}: ai=${aiCategorized} cached=${cached} remaining=${remaining}`,
    );
    if (remaining === 0) return;
    // No progress this pass (provider errored / rate-limited) — stop rather
    // than hammer it. The next trigger will pick the backlog back up.
    if (aiCategorized === 0 && cached === 0) {
      console.warn(
        `[sync/transactions] no progress with ${remaining} remaining; stopping`,
      );
      return;
    }
  }
  console.warn(
    `[sync/transactions] hit MAX_CATEGORIZE_PASSES for user ${userId}`,
  );
}

// POST /sync/transactions  Body: { userId: string }
// Fire-and-forget: ack immediately (the web caller only waits for the 202) and
// run sync + full categorization in the background. Results land in the shared
// Neon DB, which the dashboard re-reads — no completion webhook needed.
app.post('/sync/transactions', async (c) => {
  const { userId } = await c.req
    .json<{ userId?: string }>()
    .catch(() => ({ userId: undefined }));
  if (!userId) return c.json({ error: 'userId is required' }, 400);

  void (async () => {
    // Neon's serverless driver uses a WebSocket that can drop during the long
    // idle gaps between a TrueLayer fetch and the next AI batch; a 60s ping
    // keeps it warm so the next query doesn't hang on a dead socket.
    const keepalive = setInterval(() => {
      db.$queryRaw`SELECT 1`.catch(() => {});
    }, 60_000);
    try {
      if (await isSyncStale(userId)) {
        const result = await syncUserTransactions(userId, { days: 90 });
        console.log(
          `[sync/transactions] synced ${result.synced} txns (${result.errors} errors) for ${userId}`,
        );
      }
      await drainCategorization(userId);
      console.log(`[sync/transactions] done for ${userId}`);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { route: 'sync/transactions' },
        extra: { userId },
      });
      console.error('[sync/transactions] failed:', err);
    } finally {
      clearInterval(keepalive);
    }
  })();

  return c.json({ ok: true, accepted: true, userId }, 202);
});

const port = parseInt(process.env.PORT ?? '3080', 10);
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`[genwel-worker] listening on http://0.0.0.0:${port}`);
});
