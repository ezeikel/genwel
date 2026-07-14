import { getTransactionsForUser } from '@/lib/dashboard-data';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const value = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const days = Number.isFinite(value) ? value : 30;
  return mobileJson(await getTransactionsForUser(userId, days));
}

export const OPTIONS = () => mobileOptions('GET');
