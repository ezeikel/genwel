import { db } from '@genwel/db';
import { after, NextRequest, NextResponse } from 'next/server';
import { categorizeUserTransactions } from '@/lib/banking/categorize';
import { syncUserTransactions } from '@/lib/banking/sync';
import {
  exchangeCode,
  getAccountBalance,
  getAccounts,
  mapAccountType,
} from '@/lib/truelayer/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle errors from TrueLayer
  if (error) {
    const errorDescription = searchParams.get('error_description');
    console.error('TrueLayer error:', error, errorDescription);
    return NextResponse.redirect(
      new URL('/dashboard?error=connection_failed', request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_callback', request.url),
    );
  }

  // Extract user ID from state
  const [userId] = state.split(':');
  if (!userId) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url),
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    // Get accounts from TrueLayer
    const accounts = await getAccounts(tokens.access_token);

    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_accounts', request.url),
      );
    }

    // Get provider info from first account
    const provider = accounts[0].provider;

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Create bank connection
    const bankConnection = await db.bankConnection.create({
      data: {
        userId,
        providerId: provider.provider_id,
        providerName: provider.display_name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
        lastSyncedAt: new Date(),
      },
    });

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
      } catch (err) {
        console.error(`Failed to sync account ${account.account_id}:`, err);
        // Continue with other accounts
      }
    }

    // Seed transactions + a first categorization pass after the redirect is
    // sent, so the user lands on the dashboard immediately while data fills in.
    after(async () => {
      try {
        await syncUserTransactions(userId, { days: 90 });
        await categorizeUserTransactions(userId, { maxAiBatches: 5 });
      } catch (err) {
        console.error('[callback] Post-connect sync/categorize failed:', err);
      }
    });

    return NextResponse.redirect(
      new URL('/dashboard?success=bank_connected', request.url),
    );
  } catch (err) {
    console.error('Failed to connect bank:', err);
    return NextResponse.redirect(
      new URL('/dashboard?error=connection_failed', request.url),
    );
  }
}
