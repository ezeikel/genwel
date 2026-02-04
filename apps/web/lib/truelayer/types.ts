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

export interface TrueLayerAccount {
  account_id: string;
  account_type: "TRANSACTION" | "SAVINGS" | "BUSINESS" | "CREDIT_CARD";
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

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: "DEBIT" | "CREDIT";
  transaction_category:
    | "ATM"
    | "BILL_PAYMENT"
    | "CASH"
    | "CASHBACK"
    | "CHEQUE"
    | "CORRECTION"
    | "CREDIT"
    | "DIRECT_DEBIT"
    | "DIVIDEND"
    | "FEE_CHARGE"
    | "INTEREST"
    | "OTHER"
    | "PURCHASE"
    | "STANDING_ORDER"
    | "TRANSFER"
    | "DEBIT";
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
