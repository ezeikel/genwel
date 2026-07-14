'use server';

import { db } from '@genwel/db';
import { auth } from '@/auth';
import {
  buildSubscriptionReport,
  type SubscriptionReport,
} from '@/lib/subscriptions';

/**
 * Build the subscription report for the signed-in user from their last ~6
 * months of debits. Detection is deterministic (see lib/subscriptions.ts).
 */
export async function getSubscriptionReport(): Promise<
  { report: SubscriptionReport } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const txns = await db.transaction.findMany({
    where: {
      account: { connection: { userId: session.user.id } },
      amount: { lt: 0 },
      timestamp: { gte: since },
    },
    select: {
      description: true,
      merchantName: true,
      amount: true,
      aiCategory: true,
      category: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  const report = buildSubscriptionReport(
    txns.map((t) => ({
      description: t.description,
      merchantName: t.merchantName,
      amount: Number(t.amount),
      aiCategory: t.aiCategory,
      category: t.category,
      timestamp: t.timestamp,
    })),
  );

  return { report };
}
