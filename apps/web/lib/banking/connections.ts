import { getAuthUrl, getAvailableProviders } from '@genwel/banking/truelayer';
import { db, Prisma } from '@genwel/db';
import { createBankConnectState } from '@/lib/auth-mobile';
import { getEntitlementsForUser } from '@/lib/entitlements';

export type BankConnectTarget = 'mobile' | 'web';

export const getAvailableBankProviders = () => getAvailableProviders();

export class BankConnectionLimitError extends Error {
  constructor() {
    super('Bank connection limit reached');
    this.name = 'BankConnectionLimitError';
  }
}

/** Re-checkable connection allowance used when minting and redeeming a link. */
export async function getBankConnectionAllowanceForUser(userId: string) {
  const entitlements = await getEntitlementsForUser(userId);
  const max = entitlements.features.maxBankConnections;
  if (max === null) return { allowed: true as const, max };

  const existing = await db.bankConnection.count({ where: { userId } });
  return { allowed: existing < max, max, existing };
}

/** Count and create under serializable isolation so parallel callbacks cannot
 * both consume the final free connection slot. Serialization conflicts retry
 * before surfacing an error to the callback. */
export async function createBankConnectionForUser(
  userId: string,
  max: number | null,
  data: Omit<Prisma.BankConnectionUncheckedCreateInput, 'userId'>,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          if (max !== null) {
            const existing = await tx.bankConnection.count({
              where: { userId },
            });
            if (existing >= max) throw new BankConnectionLimitError();
          }
          return tx.bankConnection.create({ data: { ...data, userId } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      lastError = error;
      if ((error as { code?: string })?.code !== 'P2034' || attempt === 2) {
        throw error;
      }
    }
  }
  throw lastError;
}

/** Safe connection/account data for dashboard and native clients (no tokens). */
export async function getBankConnectionsForUser(userId: string) {
  const rows = await db.bankConnection.findMany({
    where: { userId },
    select: {
      id: true,
      providerId: true,
      providerName: true,
      connectedAt: true,
      lastSyncedAt: true,
      bankAccounts: {
        select: {
          id: true,
          accountType: true,
          displayName: true,
          currency: true,
          balance: true,
          balanceUpdatedAt: true,
        },
        orderBy: { displayName: 'asc' },
      },
    },
    orderBy: { connectedAt: 'desc' },
  });

  return rows.map((connection) => ({
    ...connection,
    bankAccounts: connection.bankAccounts.map((account) => ({
      ...account,
      balance: Number(account.balance) || 0,
    })),
  }));
}

/** Enforce the shared plan cap, then mint a signed TrueLayer callback state. */
export async function createBankConnectUrlForUser(
  userId: string,
  target: BankConnectTarget,
  providerId?: string,
) {
  const allowance = await getBankConnectionAllowanceForUser(userId);
  if (!allowance.allowed) {
    return {
      upgradeRequired: true as const,
      error: `Free accounts can connect up to ${allowance.max} banks. Upgrade to Pro for unlimited connections.`,
    };
  }

  const [providers, user] = await Promise.all([
    providerId ? getAvailableBankProviders() : Promise.resolve(null),
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);
  if (
    providerId &&
    !providers?.some((provider) => provider.id === providerId)
  ) {
    return {
      error: 'That bank is not available. Refresh the list and try again.',
    } as const;
  }

  const state = await createBankConnectState(userId, target);
  return {
    url: getAuthUrl(state, { providerId, userEmail: user?.email }),
  };
}

/** Delete only a connection belonging to this authenticated user. */
export async function disconnectBankForUser(
  userId: string,
  connectionId: string,
) {
  if (!connectionId) return { error: 'connectionId is required' } as const;

  const connection = await db.bankConnection.findFirst({
    where: { id: connectionId, userId },
    select: { id: true },
  });
  if (!connection) return { error: 'Connection not found' } as const;

  await db.bankConnection.delete({ where: { id: connectionId } });
  return { success: true } as const;
}
