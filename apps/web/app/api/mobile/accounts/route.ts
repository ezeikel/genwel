import { getBankConnectionsForUser } from '@/lib/banking/connections';
import { getEntitlementsForUser } from '@/lib/entitlements';
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

  const [connections, entitlements] = await Promise.all([
    getBankConnectionsForUser(userId),
    getEntitlementsForUser(userId),
  ]);
  return mobileJson({ connections, entitlements });
}

export const OPTIONS = () => mobileOptions('GET');
