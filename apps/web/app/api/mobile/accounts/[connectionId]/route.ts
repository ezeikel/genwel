import { disconnectBankForUser } from '@/lib/banking/connections';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ connectionId: string }> },
) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const { connectionId } = await context.params;
  const result = await disconnectBankForUser(userId, connectionId);
  if ('error' in result && result.error) return mobileError(result.error, 404);
  return mobileJson(result);
}

export const OPTIONS = () => mobileOptions('DELETE');
