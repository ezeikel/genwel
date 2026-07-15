import { db } from '@genwel/db';
import { z } from 'zod';
import { deleteAccountForUser } from '@/lib/account-deletion';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  /** Must be the literal DELETE (case-insensitive) or the account email. */
  confirmation: z.string().trim().min(1).max(320),
});

export async function DELETE(request: Request) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return mobileError(
      'Type DELETE or your account email to confirm deletion',
      400,
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return mobileError('Account not found', 404);

  const confirmation = parsed.data.confirmation.trim().toLowerCase();
  const email = user.email.trim().toLowerCase();
  const accepted = confirmation === 'delete' || confirmation === email;
  if (!accepted) {
    return mobileError(
      'Confirmation does not match. Type DELETE or your account email.',
      400,
    );
  }

  const result = await deleteAccountForUser(user.id);
  if ('error' in result && result.error) {
    return mobileError(result.error, 404);
  }

  return mobileJson({
    success: true,
    message: 'Your account and Genwel data have been deleted.',
  });
}

export const OPTIONS = () => mobileOptions('DELETE');
