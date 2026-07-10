import { db } from '@genwel/db';
import {
  getAccountBalance,
  getCardBalance,
  getCardTransactions,
  getTransactions as getTrueLayerTransactions,
  mapTransactionCategory,
  refreshToken,
} from '@/lib/truelayer/client';

/**
 * Sync transactions from TrueLayer for a given user.
 *
 * Plain utility (NOT a server action) so it can be called from server
 * components / route handlers / background jobs without RSC serialization
 * issues. Refreshes expired tokens, fetches the requested window, and upserts
 * into the DB.
 */
export async function syncUserTransactions(
  userId: string,
  options?: { days?: number },
): Promise<{ synced: number; errors: number }> {
  const days = options?.days ?? 90;
  const toDate = new Date();
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const accounts = await db.bankAccount.findMany({
    where: { connection: { userId } },
    include: { connection: true },
  });

  let synced = 0;
  let errors = 0;

  for (const account of accounts) {
    const { connection } = account;

    // Refresh token if expired or expiring within 5 minutes.
    if (connection.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
      try {
        const tokens = await refreshToken(connection.refreshToken);
        await db.bankConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
        });
        connection.accessToken = tokens.access_token;
      } catch (err) {
        console.error(
          `[sync] Failed to refresh token for connection ${connection.id}:`,
          err,
        );
        errors += 1;
        continue;
      }
    }

    const isCard = account.accountType === 'credit_card';

    // Refresh the balance (best-effort; don't fail the whole sync). Cards use a
    // separate endpoint — calling the accounts endpoint with a card id 404s.
    try {
      const balance = isCard
        ? await getCardBalance(connection.accessToken, account.externalId)
        : await getAccountBalance(connection.accessToken, account.externalId);
      await db.bankAccount.update({
        where: { id: account.id },
        data: {
          balance: balance.current,
          balanceUpdatedAt: new Date(balance.update_timestamp),
        },
      });
    } catch (err) {
      console.error(
        `[sync] Failed to refresh balance for account ${account.id}:`,
        err,
      );
    }

    try {
      const trueLayerTransactions = isCard
        ? await getCardTransactions(
            connection.accessToken,
            account.externalId,
            fromDate,
            toDate,
          )
        : await getTrueLayerTransactions(
            connection.accessToken,
            account.externalId,
            fromDate,
            toDate,
          );

      for (const tx of trueLayerTransactions) {
        await db.transaction.upsert({
          where: {
            accountId_externalId: {
              accountId: account.id,
              externalId: tx.transaction_id,
            },
          },
          create: {
            accountId: account.id,
            externalId: tx.transaction_id,
            amount: tx.amount,
            currency: tx.currency,
            description: tx.description,
            category: mapTransactionCategory(tx.transaction_category),
            merchantName: tx.merchant_name,
            timestamp: new Date(tx.timestamp),
          },
          update: {
            description: tx.description,
            category: mapTransactionCategory(tx.transaction_category),
            merchantName: tx.merchant_name,
          },
        });
        synced += 1;
      }
    } catch (err) {
      console.error(
        `[sync] Failed to sync transactions for account ${account.id}:`,
        err,
      );
      errors += 1;
    }
  }

  // Stamp lastSyncedAt on the user's connections.
  await db.bankConnection.updateMany({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });

  return { synced, errors };
}

/**
 * Whether the user's data is stale enough to warrant a re-sync.
 * Avoids re-syncing on every page load.
 */
export async function isSyncStale(
  userId: string,
  maxAgeMs = 15 * 60 * 1000,
): Promise<boolean> {
  const connection = await db.bankConnection.findFirst({
    where: { userId },
    orderBy: { lastSyncedAt: 'desc' },
    select: { lastSyncedAt: true },
  });

  if (!connection) return false; // no connection = nothing to sync
  if (!connection.lastSyncedAt) return true;
  return connection.lastSyncedAt < new Date(Date.now() - maxAgeMs);
}
