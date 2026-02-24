import { db } from "@genwel/db";
import {
  getTransactions as getTrueLayerTransactions,
  refreshToken,
  mapTransactionCategory,
} from "@/lib/truelayer/client";

/**
 * Sync transactions from TrueLayer for a given user.
 * Refreshes expired tokens, fetches the last 90 days, and upserts into DB.
 * This is a plain utility (NOT a server action) so it can be called from
 * server components without RSC serialization issues.
 */
export async function syncUserTransactions(userId: string) {
  const toDate = new Date();
  const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const accounts = await db.bankAccount.findMany({
    where: { connection: { userId } },
    include: { connection: true },
  });

  let syncedCount = 0;

  for (const account of accounts) {
    const connection = account.connection;

    // Refresh token if expired
    if (connection.tokenExpiresAt < new Date()) {
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
        console.error(`Failed to refresh token:`, err);
        continue;
      }
    }

    try {
      const trueLayerTransactions = await getTrueLayerTransactions(
        connection.accessToken,
        account.externalId,
        fromDate,
        toDate
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
        syncedCount++;
      }
    } catch (err) {
      console.error(
        `Failed to sync transactions for account ${account.id}:`,
        err
      );
    }
  }

  return syncedCount;
}
