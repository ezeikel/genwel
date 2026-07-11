import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { triggerTransactionSync } from '@/lib/worker';

/**
 * Transaction sync trigger.
 *
 * Triggered from the dashboard (button or on-load effect). Hands the
 * I/O-heavy + rate-limited work (TrueLayer sync + AI categorization) to the
 * background worker on Hetzner, which runs the WHOLE backlog to completion —
 * unlike the old Vercel `after()`, which was bounded by the serverless
 * execution ceiling and only chipped ~100 transactions per call. Returns
 * immediately; results land in the shared DB and the dashboard re-reads them.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await triggerTransactionSync(session.user.id);

  return NextResponse.json({ ok: true, queued: true });
}
