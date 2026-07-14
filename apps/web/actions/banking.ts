'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  createBankConnectUrlForUser,
  disconnectBankForUser,
} from '@/lib/banking/connections';

/**
 * Initiate bank connection - returns TrueLayer auth URL.
 *
 * Free tier is capped at 2 bank connections (the primary upgrade trigger);
 * Pro is unlimited. Returns `upgradeRequired` when a free user hits the cap so
 * the UI can prompt the upgrade instead of a generic error.
 */
export async function connectBank() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }
  return createBankConnectUrlForUser(session.user.id, 'web');
}

/**
 * Disconnect a bank connection.
 */
export async function disconnectBank(connectionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const result = await disconnectBankForUser(session.user.id, connectionId);
  if ('error' in result) return result;

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  revalidatePath('/dashboard/transactions');

  return result;
}
