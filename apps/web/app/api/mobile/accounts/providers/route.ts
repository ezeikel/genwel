import { getAvailableBankProviders } from '@/lib/banking/connections';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export async function GET() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  try {
    const providers = await getAvailableBankProviders();
    return mobileJson(
      { providers },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    );
  } catch (error) {
    console.error('[mobile] bank providers failed', error);
    return mobileError('Banks are temporarily unavailable', 502);
  }
}

export const OPTIONS = () => mobileOptions('GET');
