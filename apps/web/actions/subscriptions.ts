'use server';

import { auth } from '@/auth';
import { getSubscriptionReportForUser } from '@/lib/subscription-data';
import type { SubscriptionReport } from '@/lib/subscriptions';

/**
 * Build the subscription report for the signed-in user from their last ~6
 * months of debits. Detection is deterministic (see lib/subscriptions.ts).
 */
export async function getSubscriptionReport(): Promise<
  { report: SubscriptionReport } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  return { report: await getSubscriptionReportForUser(session.user.id) };
}
