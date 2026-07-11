'use server';

import { getAuthUrl } from '@genwel/banking/truelayer';
import { db } from '@genwel/db';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getEntitlementsForUser } from '@/lib/entitlements';

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
  const userId = session.user.id;

  // Enforce the free-tier connection cap.
  const entitlements = await getEntitlementsForUser(userId);
  const { maxBankConnections } = entitlements.features;
  if (Number.isFinite(maxBankConnections)) {
    const existing = await db.bankConnection.count({ where: { userId } });
    if (existing >= maxBankConnections) {
      return {
        upgradeRequired: true as const,
        error: `Free accounts can connect up to ${maxBankConnections} banks. Upgrade to Pro for unlimited connections.`,
      };
    }
  }

  // State carries the userId plus random entropy. Verified on callback.
  const state = `${userId}:${randomBytes(16).toString('hex')}`;

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
