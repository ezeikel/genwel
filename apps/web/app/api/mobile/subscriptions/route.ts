import { db } from '@genwel/db';
import { getEntitlementsForUser } from '@/lib/entitlements';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';
import { getSubscriptionReportForUser } from '@/lib/subscription-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const [report, accountCount, entitlements] = await Promise.all([
    getSubscriptionReportForUser(userId),
    db.bankAccount.count({ where: { connection: { userId } } }),
    getEntitlementsForUser(userId),
  ]);
  return mobileJson({ report, hasAccounts: accountCount > 0, entitlements });
}

export const OPTIONS = () => mobileOptions('GET');
