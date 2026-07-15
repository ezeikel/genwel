import { z } from 'zod';
import { createBankConnectUrlForUser } from '@/lib/banking/connections';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

const connectSchema = z.object({
  providerId: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9._:-]+$/),
});

export async function POST(request: Request) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const body = connectSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return mobileError('Choose a valid bank', 400);

  try {
    const result = await createBankConnectUrlForUser(
      userId,
      'mobile',
      body.data.providerId,
    );
    if ('upgradeRequired' in result && result.upgradeRequired) {
      return mobileJson(result, { status: 402 });
    }
    if ('error' in result && typeof result.error === 'string') {
      return mobileError(result.error, 400);
    }
    return mobileJson(result);
  } catch (error) {
    console.error('[mobile] bank connect URL failed', error);
    return mobileError('Could not start the secure bank connection', 502);
  }
}

export const OPTIONS = () => mobileOptions('POST');
