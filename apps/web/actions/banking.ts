'use server';

import { db } from '@genwel/db';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  getAccountBalance,
  getAuthUrl,
  getAccounts as getTrueLayerAccounts,
  getTransactions as getTrueLayerTransactions,
  mapAccountType,
  mapTransactionCategory,
  refreshToken,
} from '@/lib/truelayer/client';

/**
 * Initiate bank connection - returns TrueLayer auth URL
 */
export async function connectBank() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Generate a state parameter to prevent CSRF attacks
  // Include user ID so we can identify them on callback
  const state = `${session.user.id}:${randomBytes(16).toString('hex')}`;

  const url = getAuthUrl(state);

  return { url };
}

/**
 * Get all connected bank accounts for the current user
 */
export async function getAccounts() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', accounts: [] };
  }

  // Get all bank connections for user
  const connections = await db.bankConnection.findMany({
    where: { userId: session.user.id },
    include: {
      bankAccounts: true,
    },
  });

  // Check if any connections need token refresh (expired or expiring soon)
  for (const connection of connections) {
    const isExpired = connection.tokenExpiresAt < new Date();
    const expiresInOneHour =
      connection.tokenExpiresAt < new Date(Date.now() + 60 * 60 * 1000);

    if (isExpired || expiresInOneHour) {
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
          `Failed to refresh token for connection ${connection.id}:`,
          err,
        );
        continue;
      }
    }
  }

  // Check if data is stale (older than 1 hour) and refresh
  for (const connection of connections) {
    const isStale =
      !connection.lastSyncedAt ||
      connection.lastSyncedAt < new Date(Date.now() - 60 * 60 * 1000);

    if (isStale) {
      try {
        const accounts = await getTrueLayerAccounts(connection.accessToken);

        for (const account of accounts) {
          const balance = await getAccountBalance(
            connection.accessToken,
            account.account_id,
          );

          await db.bankAccount.upsert({
            where: {
              connectionId_externalId: {
                connectionId: connection.id,
                externalId: account.account_id,
              },
            },
            create: {
              connectionId: connection.id,
              externalId: account.account_id,
              accountType: mapAccountType(account.account_type),
              displayName: account.display_name,
              currency: account.currency,
              balance: balance.current,
              balanceUpdatedAt: new Date(balance.update_timestamp),
            },
            update: {
              balance: balance.current,
              balanceUpdatedAt: new Date(balance.update_timestamp),
            },
          });
        }

        await db.bankConnection.update({
          where: { id: connection.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (err) {
        console.error(
          `Failed to sync accounts for connection ${connection.id}:`,
          err,
        );
      }
    }
  }

  // Fetch updated data
  const updatedConnections = await db.bankConnection.findMany({
    where: { userId: session.user.id },
    include: {
      bankAccounts: true,
    },
    orderBy: { connectedAt: 'desc' },
  });

  // Format response
  const accounts = updatedConnections.flatMap(
    (connection: (typeof updatedConnections)[number]) =>
      connection.bankAccounts.map(
        (account: (typeof connection.bankAccounts)[number]) => ({
          id: account.id,
          connectionId: connection.id,
          providerName: connection.providerName,
          providerId: connection.providerId,
          accountType: account.accountType,
          displayName: account.displayName,
          currency: account.currency,
          balance: account.balance?.toString() || '0',
          balanceUpdatedAt: account.balanceUpdatedAt,
          connectedAt: connection.connectedAt,
        }),
      ),
  );

  return { accounts };
}

/**
 * Get transactions for the current user
 */
export async function getTransactions(options?: {
  accountId?: string;
  from?: Date;
  to?: Date;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Unauthorized', transactions: [] };
  }

  const { accountId, from, to } = options || {};

  // Parse date range (default to last 30 days)
  const toDate = to || new Date();
  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get accounts that need syncing
  const accounts = await db.bankAccount.findMany({
    where: accountId
      ? { id: accountId, connection: { userId: session.user.id } }
      : { connection: { userId: session.user.id } },
    include: {
      connection: true,
    },
  });

  // Sync transactions from TrueLayer
  for (const account of accounts) {
    const connection = account.connection;

    // Check if token needs refresh
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
        toDate,
      );

      // Upsert transactions
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
      }
    } catch (err) {
      console.error(
        `Failed to sync transactions for account ${account.id}:`,
        err,
      );
    }
  }

  // Build query
  const whereClause: {
    account: { connection: { userId: string } };
    accountId?: string;
    timestamp?: { gte: Date; lte: Date };
  } = {
    account: {
      connection: {
        userId: session.user.id,
      },
    },
    timestamp: {
      gte: fromDate,
      lte: toDate,
    },
  };

  if (accountId) {
    whereClause.accountId = accountId;
  }

  // Fetch transactions from database
  const transactions = await db.transaction.findMany({
    where: whereClause,
    include: {
      account: {
        select: {
          displayName: true,
          accountType: true,
          connection: {
            select: {
              providerName: true,
            },
          },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Format response
  const formattedTransactions = transactions.map(
    (tx: (typeof transactions)[number]) => ({
      id: tx.id,
      accountId: tx.accountId,
      accountName: tx.account.displayName,
      providerName: tx.account.connection.providerName,
      amount: tx.amount.toString(),
      currency: tx.currency,
      description: tx.description,
      category: tx.category,
      merchantName: tx.merchantName,
      timestamp: tx.timestamp,
    }),
  );

  return { transactions: formattedTransactions };
}

/**
 * Disconnect a bank connection
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
