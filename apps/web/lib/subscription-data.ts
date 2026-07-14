import { db } from '@genwel/db';
import {
  buildSubscriptionReport,
  type SubscriptionReport,
  type TxnLike,
} from '@/lib/subscriptions';

/** Build the shared recurring-payment report for one authenticated user. */
export async function getSubscriptionReportForUser(
  userId: string,
): Promise<SubscriptionReport> {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const rows = await db.transaction.findMany({
    where: {
      account: { connection: { userId } },
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

  return buildSubscriptionReport(
    rows.map(
      (row): TxnLike => ({
        description: row.description,
        merchantName: row.merchantName,
        amount: Number(row.amount),
        aiCategory: row.aiCategory,
        category: row.category,
        timestamp: row.timestamp,
      }),
    ),
  );
}
