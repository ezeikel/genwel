import { z } from 'zod';
import type {
  TrueLayerAccount,
  TrueLayerAvailableProvider,
  TrueLayerBalance,
  TrueLayerCard,
  TrueLayerCardBalance,
  TrueLayerResponse,
  TrueLayerTokenResponse,
  TrueLayerTransaction,
} from './types';

const TRUELAYER_ENV = process.env.NEXT_PUBLIC_TRUELAYER_ENV || 'sandbox';

const AUTH_BASE_URL =
  TRUELAYER_ENV === 'sandbox'
    ? 'https://auth.truelayer-sandbox.com'
    : 'https://auth.truelayer.com';

const API_BASE_URL =
  TRUELAYER_ENV === 'sandbox'
    ? 'https://api.truelayer-sandbox.com'
    : 'https://api.truelayer.com';

const CLIENT_ID = process.env.TRUELAYER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI!;

// Scopes for Data API. `cards` is required to read /data/v1/cards* — without it
// credit cards return 403. (Users connected before this scope was added must
// reconnect their bank for the card scope to apply to their token.)
const SCOPES = [
  'info',
  'accounts',
  'cards',
  'balance',
  'transactions',
  'offline_access',
];

const availableProviderSchema = z.object({
  provider_id: z.string().min(1),
  display_name: z.string().min(1),
  country: z.string().min(1),
  logo_url: z.string().optional(),
  // Older responses used logo_uri. Accept it so a provider rollout cannot
  // blank the native picker while TrueLayer's schemas are transitioning.
  logo_uri: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

const availableProvidersSchema = z.array(availableProviderSchema);

const httpsAsset = (value: string | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

/** Parse and sanitize TrueLayer's public provider directory. */
export function parseAvailableProviders(
  input: unknown,
): TrueLayerAvailableProvider[] {
  return availableProvidersSchema
    .parse(input)
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.display_name,
      logoUrl: httpsAsset(provider.logo_url ?? provider.logo_uri),
      country: provider.country.toLowerCase(),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'en-GB'));
}

/**
 * Fetch only the banks enabled for Genwel's client and requested Data scopes.
 * This stays server-side: the mobile app receives a small sanitized projection.
 */
export async function getAvailableProviders(): Promise<
  TrueLayerAvailableProvider[]
> {
  if (!CLIENT_ID) throw new Error('TrueLayer client is not configured');

  const url = new URL('/api/providers', AUTH_BASE_URL);
  url.searchParams.set('clientId', CLIENT_ID);
  url.searchParams.set('country', 'uk');
  url.searchParams.set('scopes', SCOPES.join(' '));

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(
      `TrueLayer providers request failed: ${response.status} ${await safeErrorDetail(response)}`,
    );
  }

  return parseAvailableProviders(await response.json());
}

/**
 * Read an error response body safely. TrueLayer error responses are sometimes
 * empty (e.g. a 403 with no body), which makes `response.json()` throw
 * "Unexpected end of JSON input". Return a best-effort detail string instead,
 * never throwing.
 */
async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.text();
    if (!body) return response.statusText || 'no response body';
    try {
      const parsed = JSON.parse(body);
      return parsed.error_description || parsed.error || body;
    } catch {
      return body;
    }
  } catch {
    return response.statusText || 'unreadable response body';
  }
}

/**
 * Generate the TrueLayer authorization URL for bank connection
 */
export function getAuthUrl(
  state: string,
  options: { providerId?: string; userEmail?: string | null } = {},
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    state,
    providers: TRUELAYER_ENV === 'sandbox' ? 'mock' : 'uk-ob-all uk-oauth-all',
  });

  if (options.providerId) params.set('provider_id', options.providerId);
  if (options.userEmail) params.set('user_email', options.userEmail);

  return `${AUTH_BASE_URL}/?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCode(
  code: string,
): Promise<TrueLayerTokenResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    // TrueLayer's token endpoint returns { error, error_description } — surface
    // BOTH (error code is often present when description isn't) plus the status,
    // so failures like invalid_grant / invalid_client / redirect mismatch are
    // diagnosable instead of a generic "Failed to exchange code".
    const body = await response.text();
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail =
        parsed.error_description || parsed.error || JSON.stringify(parsed);
    } catch {
      // non-JSON body — keep raw text
    }
    throw new Error(`Failed to exchange code (${response.status}): ${detail}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshToken(
  refreshToken: string,
): Promise<TrueLayerTokenResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  return response.json();
}

/**
 * Get all accounts for a user
 */
export async function getAccounts(
  accessToken: string,
): Promise<TrueLayerAccount[]> {
  const response = await fetch(`${API_BASE_URL}/data/v1/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to get accounts');
  }

  const data: TrueLayerResponse<TrueLayerAccount> = await response.json();
  return data.results;
}

/**
 * Get balance for a specific account
 */
export async function getAccountBalance(
  accessToken: string,
  accountId: string,
): Promise<TrueLayerBalance> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/accounts/${accountId}/balance`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to get balance');
  }

  const data: TrueLayerResponse<TrueLayerBalance> = await response.json();
  return data.results[0];
}

/**
 * Get transactions for a specific account
 */
export async function getTransactions(
  accessToken: string,
  accountId: string,
  from?: Date,
  to?: Date,
): Promise<TrueLayerTransaction[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());

  const url = `${API_BASE_URL}/data/v1/accounts/${accountId}/transactions${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to get transactions');
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Get pending transactions for a specific account
 */
export async function getPendingTransactions(
  accessToken: string,
  accountId: string,
): Promise<TrueLayerTransaction[]> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/accounts/${accountId}/transactions/pending`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    // Pending transactions may not be supported by all banks
    if (response.status === 501) {
      return [];
    }
    const error = await response.json();
    throw new Error(
      error.error_description || 'Failed to get pending transactions',
    );
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Get all credit cards for a user (separate endpoint from accounts).
 *
 * Resilient by design: if the connection's token lacks the `cards` scope
 * (403 — e.g. a connection made before card support was added) or the provider
 * doesn't support the cards endpoint (404/501), return [] rather than throwing.
 * Callers treat "no cards" and "cards unavailable" the same, and a card failure
 * must never abort a connection whose accounts fetched fine.
 */
export async function getCards(accessToken: string): Promise<TrueLayerCard[]> {
  const response = await fetch(`${API_BASE_URL}/data/v1/cards`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Missing scope / unsupported endpoint → no cards, not a hard error.
    if ([403, 404, 501].includes(response.status)) {
      return [];
    }
    throw new Error(
      `Failed to get cards (${response.status}): ${await safeErrorDetail(response)}`,
    );
  }

  const data: TrueLayerResponse<TrueLayerCard> = await response.json();
  return data.results;
}

/**
 * Get balance for a specific credit card
 */
export async function getCardBalance(
  accessToken: string,
  cardId: string,
): Promise<TrueLayerCardBalance> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/cards/${cardId}/balance`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get card balance (${response.status}): ${await safeErrorDetail(response)}`,
    );
  }

  const data: TrueLayerResponse<TrueLayerCardBalance> = await response.json();
  return data.results[0];
}

/**
 * Get transactions for a specific credit card
 */
export async function getCardTransactions(
  accessToken: string,
  cardId: string,
  from?: Date,
  to?: Date,
): Promise<TrueLayerTransaction[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());

  const url = `${API_BASE_URL}/data/v1/cards/${cardId}/transactions${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get card transactions (${response.status}): ${await safeErrorDetail(response)}`,
    );
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Get pending transactions for a specific credit card
 */
export async function getPendingCardTransactions(
  accessToken: string,
  cardId: string,
): Promise<TrueLayerTransaction[]> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/cards/${cardId}/transactions/pending`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    // Pending transactions may not be supported by all banks
    if (response.status === 501) {
      return [];
    }
    const error = await response.json();
    throw new Error(
      error.error_description || 'Failed to get pending card transactions',
    );
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Map TrueLayer account type to our internal type
 */
export function mapAccountType(
  trueLayerType: TrueLayerAccount['account_type'],
): string {
  switch (trueLayerType) {
    case 'TRANSACTION':
      return 'current';
    case 'SAVINGS':
      return 'savings';
    case 'CREDIT_CARD':
      return 'credit_card';
    case 'BUSINESS':
      return 'business';
    default:
      return 'other';
  }
}

/**
 * Map TrueLayer transaction category to a simpler category
 */
export function mapTransactionCategory(
  category: TrueLayerTransaction['transaction_category'],
): string {
  switch (category) {
    case 'PURCHASE':
      return 'Shopping';
    case 'BILL_PAYMENT':
    case 'DIRECT_DEBIT':
    case 'STANDING_ORDER':
      return 'Bills';
    case 'TRANSFER':
      return 'Transfer';
    case 'ATM':
    case 'CASH':
      return 'Cash';
    case 'INTEREST':
    case 'DIVIDEND':
      return 'Income';
    case 'FEE_CHARGE':
      return 'Fees';
    default:
      return 'Other';
  }
}
