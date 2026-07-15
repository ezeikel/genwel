// TrueLayer API response types

export interface TrueLayerTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface TrueLayerProvider {
  provider_id: string;
  display_name: string;
  logo_uri: string;
  country: string;
}

/** Provider-directory record used before a user starts an auth journey. */
export interface TrueLayerAvailableProvider {
  id: string;
  name: string;
  logoUrl: string | null;
  country: string;
}

export interface TrueLayerAccount {
  account_id: string;
  account_type: 'TRANSACTION' | 'SAVINGS' | 'BUSINESS' | 'CREDIT_CARD';
  display_name: string;
  currency: string;
  account_number?: {
    iban?: string;
    swift_bic?: string;
    number?: string;
    sort_code?: string;
  };
  provider: TrueLayerProvider;
}

export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
  overdraft?: number;
  update_timestamp: string;
}

// Credit cards are served from a SEPARATE endpoint set (/data/v1/cards*) and
// have no `account_type` field — they are always credit cards. The card id is
// carried in `account_id` (same slot as TrueLayerAccount), so it maps onto the
// same DB `externalId` column.
export interface TrueLayerCard {
  account_id: string;
  card_network: string; // e.g. "VISA", "MASTERCARD"
  card_type: string; // e.g. "CREDIT", "CHARGE"
  currency: string;
  display_name: string;
  partial_card_number: string; // last 4 digits
  name_on_card?: string;
  valid_from?: string;
  valid_to?: string;
  update_timestamp: string;
  provider: TrueLayerProvider;
}

// Card balance shares available/current/update_timestamp with TrueLayerBalance
// (so it drops into the same persistence), plus credit-specific extras. Note the
// semantics differ: `current` is the amount OWED (positive = debt), `available`
// is the remaining credit.
export interface TrueLayerCardBalance {
  currency: string;
  available: number;
  current: number;
  credit_limit?: number;
  last_statement_balance?: number;
  last_statement_date?: string;
  payment_due?: number;
  payment_due_date?: string;
  update_timestamp: string;
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: 'DEBIT' | 'CREDIT';
  transaction_category:
    | 'ATM'
    | 'BILL_PAYMENT'
    | 'CASH'
    | 'CASHBACK'
    | 'CHEQUE'
    | 'CORRECTION'
    | 'CREDIT'
    | 'DIRECT_DEBIT'
    | 'DIVIDEND'
    | 'FEE_CHARGE'
    | 'INTEREST'
    | 'OTHER'
    | 'PURCHASE'
    | 'STANDING_ORDER'
    | 'TRANSFER'
    | 'DEBIT';
  transaction_classification: string[];
  merchant_name?: string;
  running_balance?: {
    amount: number;
    currency: string;
  };
}

export interface TrueLayerIdentity {
  full_name: string;
  emails: string[];
  phones: string[];
  addresses: {
    address: string;
    city: string;
    zip: string;
    country: string;
  }[];
}

// API response wrappers
export interface TrueLayerResponse<T> {
  results: T[];
  status: string;
}

export interface TrueLayerError {
  error: string;
  error_description?: string;
}
