/**
 * Fire-and-forget trigger for the Genwel background worker (Hetzner box).
 *
 * The worker owns the long, rate-limited bank work — TrueLayer sync + AI
 * categorization — which the Vercel serverless runtime can't run to completion
 * (execution ceiling). We POST the job and only wait for the worker's fast 202
 * ack; the actual work runs on the box and writes straight to the shared DB.
 *
 * If GENWEL_WORKER_URL is unset or the worker is unreachable, this logs and
 * returns without throwing — the caller should never fail because the worker is
 * down (the next trigger will retry, and the dashboard still renders).
 */
export async function triggerTransactionSync(
  userId: string,
  options?: { force?: boolean },
): Promise<void> {
  const workerUrl = process.env.GENWEL_WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl) {
    console.warn('[worker] GENWEL_WORKER_URL not set — skipping sync trigger');
    return;
  }

  try {
    await fetch(`${workerUrl}/sync/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(workerSecret ? { Authorization: `Bearer ${workerSecret}` } : {}),
      },
      body: JSON.stringify({ userId, force: options?.force ?? false }),
      // Wait only for the worker's 202 ack, not the work itself.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error('[worker] failed to trigger transaction sync:', err);
  }
}

/**
 * Generic fire-and-forget POST to the Genwel worker. The body carries only job
 * params — never API keys. Auth is the shared bearer (WORKER_SECRET) that must
 * match the worker's value. Returns the worker's Response (typically a fast 202
 * ack); the actual work runs on the box. Throws if GENWEL_WORKER_URL is unset or
 * the worker is unreachable — callers decide how to surface that.
 */
export async function postToWorker(
  path: string,
  body: unknown = {},
): Promise<Response> {
  const workerUrl = process.env.GENWEL_WORKER_URL?.replace(/\/+$/, '');
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerUrl) throw new Error('GENWEL_WORKER_URL not set');
  return fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(workerSecret ? { Authorization: `Bearer ${workerSecret}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    // 10s ack budget; the worker runs the job asynchronously.
    signal: AbortSignal.timeout(10_000),
  });
}
