import { after, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { categorizeUserTransactions } from '@/lib/banking/categorize';
import { isSyncStale, syncUserTransactions } from '@/lib/banking/sync';

/**
 * Non-blocking sync + categorize endpoint.
 *
 * Triggered from the dashboard (button or on-load effect). Returns immediately
 * and does the I/O-heavy + rate-limited work in `after()`, so it never blocks a
 * page render. Categorization is bounded per call and incremental, so repeated
 * calls steadily chip away at the backlog.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  after(async () => {
    try {
      if (await isSyncStale(userId)) {
        await syncUserTransactions(userId, { days: 90 });
      }
      await categorizeUserTransactions(userId, { maxAiBatches: 5 });
    } catch (err) {
      console.error('[api/banking/sync] background work failed:', err);
    }
  });

  return NextResponse.json({ ok: true, queued: true });
}
