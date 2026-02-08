import type {
  TrueLayerTokenResponse,
  TrueLayerAccount,
  TrueLayerBalance,
  TrueLayerTransaction,
  TrueLayerResponse,
} from "./types";

const TRUELAYER_ENV = process.env.NEXT_PUBLIC_TRUELAYER_ENV || "sandbox";

const AUTH_BASE_URL =
  TRUELAYER_ENV === "sandbox"
    ? "https://auth.truelayer-sandbox.com"
    : "https://auth.truelayer.com";

const API_BASE_URL =
  TRUELAYER_ENV === "sandbox"
    ? "https://api.truelayer-sandbox.com"
    : "https://api.truelayer.com";

const CLIENT_ID = process.env.TRUELAYER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI!;

// Scopes for Data API
const SCOPES = ["info", "accounts", "balance", "transactions", "offline_access"];

/**
 * Generate the TrueLayer authorization URL for bank connection
 */
export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    state,
    providers:
      TRUELAYER_ENV === "sandbox" ? "mock" : "uk-ob-all uk-oauth-all",
  });

  return `${AUTH_BASE_URL}/?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCode(
  code: string
): Promise<TrueLayerTokenResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to exchange code");
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshToken(
  refreshToken: string
): Promise<TrueLayerTokenResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to refresh token");
  }

  return response.json();
}

/**
 * Get all accounts for a user
 */
export async function getAccounts(
  accessToken: string
): Promise<TrueLayerAccount[]> {
  const response = await fetch(`${API_BASE_URL}/data/v1/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to get accounts");
  }

  const data: TrueLayerResponse<TrueLayerAccount> = await response.json();
  return data.results;
}

/**
 * Get balance for a specific account
 */
export async function getAccountBalance(
  accessToken: string,
  accountId: string
): Promise<TrueLayerBalance> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/accounts/${accountId}/balance`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to get balance");
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
  to?: Date
): Promise<TrueLayerTransaction[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());

  const url = `${API_BASE_URL}/data/v1/accounts/${accountId}/transactions${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to get transactions");
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Get pending transactions for a specific account
 */
export async function getPendingTransactions(
  accessToken: string,
  accountId: string
): Promise<TrueLayerTransaction[]> {
  const response = await fetch(
    `${API_BASE_URL}/data/v1/accounts/${accountId}/transactions/pending`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    // Pending transactions may not be supported by all banks
    if (response.status === 501) {
      return [];
    }
    const error = await response.json();
    throw new Error(
      error.error_description || "Failed to get pending transactions"
    );
  }

  const data: TrueLayerResponse<TrueLayerTransaction> = await response.json();
  return data.results;
}

/**
 * Map TrueLayer account type to our internal type
 */
export function mapAccountType(
  trueLayerType: TrueLayerAccount["account_type"]
): string {
  switch (trueLayerType) {
    case "TRANSACTION":
      return "current";
    case "SAVINGS":
      return "savings";
    case "CREDIT_CARD":
      return "credit_card";
    case "BUSINESS":
      return "business";
    default:
      return "other";
  }
}

/**
 * Map TrueLayer transaction category to a simpler category
 */
export function mapTransactionCategory(
  category: TrueLayerTransaction["transaction_category"]
): string {
  switch (category) {
    case "PURCHASE":
      return "Shopping";
    case "BILL_PAYMENT":
    case "DIRECT_DEBIT":
    case "STANDING_ORDER":
      return "Bills";
    case "TRANSFER":
      return "Transfer";
    case "ATM":
    case "CASH":
      return "Cash";
    case "INTEREST":
    case "DIVIDEND":
      return "Income";
    case "FEE_CHARGE":
      return "Fees";
    default:
      return "Other";
  }
}
