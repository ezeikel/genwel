import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';
import { triggerTransactionSync } from '@/lib/worker';

export async function POST() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  await triggerTransactionSync(userId, { force: true });
  return mobileJson({ ok: true, queued: true }, { status: 202 });
}

export const OPTIONS = () => mobileOptions('POST');
