import { createBankConnectUrlForUser } from '@/lib/banking/connections';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export async function POST() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const result = await createBankConnectUrlForUser(userId, 'mobile');
  if ('upgradeRequired' in result && result.upgradeRequired) {
    return mobileJson(result, { status: 402 });
  }
  return mobileJson(result);
}

export const OPTIONS = () => mobileOptions('POST');
