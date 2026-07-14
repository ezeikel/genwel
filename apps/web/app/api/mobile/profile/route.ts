import { db } from '@genwel/db';
import { z } from 'zod';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';

const profileSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function PATCH(request: Request) {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  const parsed = profileSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return mobileError('Enter a name up to 80 characters', 400);

  const user = await db.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true, image: true },
  });
  return mobileJson({ user });
}

export const OPTIONS = () => mobileOptions('PATCH');
