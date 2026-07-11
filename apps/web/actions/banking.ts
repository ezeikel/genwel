'use server';

import { getAuthUrl } from '@genwel/banking/truelayer';
import { db } from '@genwel/db';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

/**
 * Initiate bank connection - returns TrueLayer auth URL.
 */
export async function connectBank() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // State carries the userId plus random entropy. Verified on callback.
  const state = `${session.user.id}:${randomBytes(16).toString('hex')}`;

  const url = getAuthUrl(state);

  return { url };
}

/**
 * Disconnect a bank connection.
 */
export async function disconnectBank(connectionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  if (!connectionId) {
    return { error: 'connectionId is required' };
  }

  // Verify the connection belongs to the user
  const connection = await db.bankConnection.findFirst({
    where: {
      id: connectionId,
      userId: session.user.id,
    },
  });

  if (!connection) {
    return { error: 'Connection not found' };
  }

  // Delete connection (cascades to accounts and transactions)
  await db.bankConnection.delete({
    where: { id: connectionId },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard/transactions');

  return { success: true };
}
