import { getOverviewForUser } from '@/lib/dashboard-data';
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
  return mobileJson(await getOverviewForUser(userId));
}

export const OPTIONS = () => mobileOptions('GET');
