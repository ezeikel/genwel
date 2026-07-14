'use server';

import { db } from '@genwel/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const MAX_NAME_LENGTH = 80;

export async function updateUserName(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const normalizedName = name.replace(/\s+/g, ' ').trim();
  if (!normalizedName)
    return { error: 'Enter the name you would like to use.' };
  if (normalizedName.length > MAX_NAME_LENGTH) {
    return { error: `Keep your name under ${MAX_NAME_LENGTH} characters.` };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: normalizedName },
  });

  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
