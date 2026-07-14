export type SpendingCategory =
  | 'SHOPPING'
  | 'GROCERIES'
  | 'EATING_OUT'
  | 'BILLS'
  | 'TRANSPORT'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'PERSONAL_CARE'
  | 'EDUCATION'
  | 'TRANSFER'
  | 'CASH'
  | 'INCOME'
  | 'FEES'
  | 'SAVINGS'
  | 'REMITTANCES'
  | 'SUBSCRIPTIONS'
  | 'OTHER';

export type Entitlements = {
  hasAccess: boolean;
  plan: 'FREE' | 'PRO';
  status:
    | 'NONE'
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'PAUSED';
  platform: 'STRIPE' | 'REVENUECAT' | null;
  expiresAt: string | null;
  isTrialing: boolean;
  isCancelled: boolean;
  features: {
    /** `null` is the wire representation for an unlimited Pro allowance. */
    maxBankConnections: number | null;
    fullFixableProblems: boolean;
    aiInsights: boolean;
    askGenwel: boolean;
    budgets: boolean;
    customCategories: boolean;
    fullHistory: boolean;
    dataExport: boolean;
  };
};

export type ApiTransaction = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: SpendingCategory;
  merchantName: string | null;
  merchantDomain: string | null;
  timestamp: string;
  accountName: string;
  providerName: string;
};

export type OverviewAccount = {
  id: string;
  accountType: string;
  displayName: string;
  providerName: string;
  currency: string;
  balance: number;
  balanceUpdatedAt: string | null;
};

export type AccountGroup = {
  kind: 'cash' | 'savings' | 'credit';
  label: string;
  total: number;
  displayTotal: number;
  accounts: OverviewAccount[];
};

export type FixableProblem = {
  id: string;
  kind: 'duplicate_subscription' | 'price_increase' | 'over_budget';
  title: string;
  detail: string;
  estimatedSaving: number;
  merchants: string[];
  severity: 'high' | 'medium' | 'low';
};

export type Subscription = {
  key: string;
  name: string;
  category: SpendingCategory | null;
  serviceClass:
    | 'streaming'
    | 'music'
    | 'mobile'
    | 'broadband'
    | 'cloud_storage'
    | 'gym'
    | null;
  cadence: 'weekly' | 'monthly' | 'yearly' | 'irregular';
  amount: number;
  monthlyAmount: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  nextRenewal: string | null;
  priceRise: { from: number; to: number; delta: number } | null;
};

export type SubscriptionReport = {
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  duplicates: {
    label: string;
    subscriptions: Subscription[];
    potentialMonthlySaving: number;
  }[];
  upcoming: Subscription[];
};

export type OverviewResponse = {
  summary: {
    netWorth: number;
    groups: AccountGroup[];
    hasAccounts: boolean;
    lastSyncedAt: string | null;
  };
  monthDelta: number | null;
  recentTransactions: ApiTransaction[];
  subscriptions: SubscriptionReport;
  fixableProblems: {
    problems: FixableProblem[];
    totalSaving: number;
    locked: boolean;
    lockedCount: number;
  };
  insight: { id: string; type: string; title: string; body: string } | null;
  entitlements: Entitlements;
};

export type BankAccount = {
  id: string;
  accountType: string;
  displayName: string;
  currency: string;
  balance: number;
  balanceUpdatedAt: string | null;
};

export type BankConnection = {
  id: string;
  providerId: string;
  providerName: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  bankAccounts: BankAccount[];
};

export type AccountsResponse = {
  connections: BankConnection[];
  entitlements: Entitlements;
};

export type TransactionsResponse = {
  days: number;
  hasAccounts: boolean;
  transactions: ApiTransaction[];
  spendingByCategory: { category: SpendingCategory; amount: number }[];
  entitlements: Entitlements;
};

export type SubscriptionsResponse = {
  report: SubscriptionReport;
  hasAccounts: boolean;
  entitlements: Entitlements;
};

export type InsightsResponse = {
  insights: {
    id: string;
    type: string;
    title: string;
    body: string;
    metadata: Record<string, unknown> | null;
    read: boolean;
    createdAt: string;
  }[];
  emptyReason:
    | 'no_accounts'
    | 'no_recent_activity'
    | 'generation_failed'
    | null;
  trend: ({ month: string; total: number } & Record<string, string | number>)[];
  entitlements: Entitlements;
};

export type BudgetResponse = {
  config: {
    id: string;
    periodType: 'CALENDAR_MONTH' | 'PAYDAY';
    paydayDate: number | null;
    budgets: {
      id: string;
      category: SpendingCategory;
      amount: string;
    }[];
  } | null;
  progress: {
    progress: {
      category: SpendingCategory;
      budgetAmount: number;
      spent: number;
      remaining: number;
      percentUsed: number;
      status: 'on_track' | 'warning' | 'over_budget';
    }[];
    totalBudgeted: number;
    totalSpent: number;
    periodStart?: string;
    periodEnd?: string;
  };
  entitlements: Entitlements;
};
