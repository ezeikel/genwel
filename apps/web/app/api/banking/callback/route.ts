import {
  exchangeCode,
  getAccountBalance,
  getAccounts,
  getCardBalance,
  getCards,
  mapAccountType,
} from '@genwel/banking/truelayer';
import { db } from '@genwel/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyBankConnectState } from '@/lib/auth-mobile';
import {
  BankConnectionLimitError,
  createBankConnectionForUser,
  getBankConnectionAllowanceForUser,
} from '@/lib/banking/connections';
import { triggerTransactionSync } from '@/lib/worker';
import { track, trackWithUser } from '@/utils/analytics-server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const verifiedState = state ? await verifyBankConnectState(state) : null;
  const redirect = (status: 'success' | 'error', reason?: string) => {
    if (verifiedState?.target === 'mobile') {
      const url = new URL('genwel://bank-connect');
      url.searchParams.set('status', status);
      if (reason) url.searchParams.set('reason', reason);
      return NextResponse.redirect(url);
    }

    const url = new URL('/dashboard', request.url);
    url.searchParams.set(
      status === 'success' ? 'success' : 'error',
      status === 'success' ? 'bank_connected' : (reason ?? 'connection_failed'),
    );
    return NextResponse.redirect(url);
  };

  // Handle errors from TrueLayer
  if (error) {
    const errorDescription = searchParams.get('error_description');
    console.error('TrueLayer error:', error, errorDescription);
    await track('bank_connect_failed', {
      reason: 'truelayer_error',
      error,
      errorDescription,
    });
    return redirect('error', 'connection_failed');
  }

  if (!code || !state) {
    return redirect('error', 'invalid_callback');
  }

  if (!verifiedState) {
    return redirect('error', 'invalid_state');
  }
  const { userId } = verifiedState;

  try {
    // Re-check at redemption so two links opened in parallel cannot bypass the
    // free connection cap between URL creation and callback.
    const allowance = await getBankConnectionAllowanceForUser(userId);
    if (!allowance.allowed) {
      return redirect('error', 'connection_limit');
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    // Get accounts AND credit cards from TrueLayer (cards are a separate
    // endpoint — a user may have only a credit card, only accounts, or both).
    // Cards are best-effort: a card fetch failure (e.g. token without the
    // `cards` scope) must NEVER abort a connection whose accounts fetched fine.
    const accounts = await getAccounts(tokens.access_token);
    let cards: Awaited<ReturnType<typeof getCards>> = [];
    try {
      cards = await getCards(tokens.access_token);
    } catch (cardErr) {
      console.error('[callback] Failed to fetch cards (non-fatal):', cardErr);
    }

    if (accounts.length === 0 && cards.length === 0) {
      await trackWithUser(userId, 'bank_connect_failed', {
        reason: 'no_accounts',
      });
      return redirect('error', 'no_accounts');
    }

    // Get provider info from the first account, falling back to the first card
    // (card-only connections have no accounts to read the provider from).
    const provider = (accounts[0] ?? cards[0]).provider;

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Create bank connection
    const bankConnection = await createBankConnectionForUser(
      userId,
      allowance.max,
      {
        providerId: provider.provider_id,
        providerName: provider.display_name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
        lastSyncedAt: new Date(),
      },
    );

    let syncedAccountCount = 0;

    // Sync accounts and balances
    for (const account of accounts) {
      try {
        const balance = await getAccountBalance(
          tokens.access_token,
          account.account_id,
        );

        await db.bankAccount.create({
          data: {
            connectionId: bankConnection.id,
            externalId: account.account_id,
            accountType: mapAccountType(account.account_type),
            displayName: account.display_name,
            currency: account.currency,
            balance: balance.current,
            balanceUpdatedAt: new Date(balance.update_timestamp),
          },
        });
        syncedAccountCount += 1;
      } catch (err) {
        console.error(`Failed to sync account ${account.account_id}:`, err);
        // Continue with other accounts
      }
    }

    // Sync credit cards and balances (cards are always credit_card type)
    for (const card of cards) {
      try {
        const balance = await getCardBalance(
          tokens.access_token,
          card.account_id,
        );

        await db.bankAccount.create({
          data: {
            connectionId: bankConnection.id,
            externalId: card.account_id,
            accountType: 'credit_card',
            displayName: card.display_name,
            currency: card.currency,
            // `current` on a card is the amount OWED (positive = debt).
            balance: balance.current,
            balanceUpdatedAt: new Date(balance.update_timestamp),
          },
        });
        syncedAccountCount += 1;
      } catch (err) {
        console.error(`Failed to sync card ${card.account_id}:`, err);
        // Continue with other cards
      }
    }

    // Don't leave behind a token-bearing connection with no usable accounts.
    // The user can retry the provider flow once its balance API recovers.
    if (syncedAccountCount === 0) {
      await db.bankConnection.delete({ where: { id: bankConnection.id } });
      await trackWithUser(userId, 'bank_connect_failed', {
        reason: 'account_sync_failed',
      });
      return redirect('error', 'no_accounts');
    }

    // Hand the transaction sync + categorization to the background worker,
    // which drains the whole backlog (no serverless timeout). Fire-and-forget:
    // we only wait for the worker's fast ack, then redirect the user to the
    // dashboard while the data fills in.
    await triggerTransactionSync(userId);

    await trackWithUser(userId, 'bank_connected', {
      provider: provider.display_name,
      providerId: provider.provider_id,
      accountCount: accounts.length,
      cardCount: cards.length,
      syncedAccountCount,
    });

    return redirect('success');
  } catch (err) {
    if (err instanceof BankConnectionLimitError) {
      return redirect('error', 'connection_limit');
    }
    console.error('Failed to connect bank:', err);
    await trackWithUser(userId, 'bank_connect_failed', {
      reason: 'exception',
      message: err instanceof Error ? err.message : String(err),
    });
    return redirect('error', 'connection_failed');
  }
}
