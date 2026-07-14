import { getEntitlementsForUser } from '@/lib/entitlements';
import {
  generateInsightsForUser,
  getInsightsForUser,
  getSpendingTrendForUser,
} from '@/lib/insights-data';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const entitlements = await getEntitlementsForUser(userId);
  const [result, trend] = entitlements.features.aiInsights
    ? await Promise.all([
        getInsightsForUser(userId, { generateIfMissing: false }),
        getSpendingTrendForUser(userId),
      ])
    : [{ insights: [], emptyReason: null }, []];
  return mobileJson({ ...result, trend, entitlements });
}

export async function POST() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const entitlements = await getEntitlementsForUser(userId);
  if (!entitlements.features.aiInsights) {
    return mobileError('Smart insights are a Pro feature', 403);
  }
  return mobileJson(await generateInsightsForUser(userId));
}

export const OPTIONS = () => mobileOptions('GET, POST');
