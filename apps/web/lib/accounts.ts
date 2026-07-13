import { signedBalance } from '@genwel/banking/balance';

/**
 * Account grouping + net-worth maths for the dashboard overview.
 *
 * Groups connected accounts into the three buckets a user thinks in — spendable
 * cash, savings, and credit-card debt — each with a signed subtotal and the
 * per-account breakdown behind it. Net worth = cash + savings − card debt.
 *
 * Plain module (no "use server"): safe to import in server components.
 */

export type AccountKind = 'cash' | 'savings' | 'credit';

/** A single connected account, in the shape the overview needs. */
export type OverviewAccount = {
  id: string;
  accountType: string; // current | savings | credit_card
  displayName: string;
  providerName: string;
  currency: string;
  /** raw stored balance (card = amount owed, positive) */
  balance: number;
  balanceUpdatedAt: Date | null;
};

export type AccountGroup = {
  kind: AccountKind;
  label: string;
  /** signed subtotal: cash/savings positive, credit negative (debt) */
  total: number;
  /** magnitude for display (credit shows "£X owed") */
  displayTotal: number;
  accounts: OverviewAccount[];
};

export type NetWorthSummary = {
  netWorth: number;
  groups: AccountGroup[];
  /** true if any group has accounts */
  hasAccounts: boolean;
  /** most recent balanceUpdatedAt across all accounts */
  lastSyncedAt: Date | null;
};

/** Which bucket an account type falls into. */
export function accountKind(accountType: string): AccountKind {
  if (accountType === 'credit_card') return 'credit';
  if (accountType === 'savings') return 'savings';
  return 'cash'; // current + anything else spendable
}

const KIND_LABEL: Record<AccountKind, string> = {
  cash: 'Cash',
  savings: 'Savings',
  credit: 'Credit cards',
};

const KIND_ORDER: AccountKind[] = ['cash', 'savings', 'credit'];

/**
 * Build the full net-worth summary from a flat list of accounts.
 * Empty groups are omitted so the UI only renders buckets you actually use.
 */
export function buildNetWorthSummary(
  accounts: OverviewAccount[],
): NetWorthSummary {
  const byKind = new Map<AccountKind, OverviewAccount[]>();
  for (const account of accounts) {
    const kind = accountKind(account.accountType);
    const list = byKind.get(kind) ?? [];
    list.push(account);
    byKind.set(kind, list);
  }

  const groups: AccountGroup[] = KIND_ORDER.filter((k) => byKind.has(k)).map(
    (kind) => {
      const groupAccounts = byKind.get(kind) ?? [];
      const total = groupAccounts.reduce(
        (sum, a) => sum + signedBalance(a.accountType, a.balance),
        0,
      );
      return {
        kind,
        label: KIND_LABEL[kind],
        total,
        displayTotal: Math.abs(total),
        accounts: groupAccounts.sort(
          (a, b) => Math.abs(b.balance) - Math.abs(a.balance),
        ),
      };
    },
  );

  const netWorth = groups.reduce((sum, g) => sum + g.total, 0);

  const lastSyncedAt = accounts.reduce<Date | null>((latest, a) => {
    if (!a.balanceUpdatedAt) return latest;
    if (!latest || a.balanceUpdatedAt > latest) return a.balanceUpdatedAt;
    return latest;
  }, null);

  return {
    netWorth,
    groups,
    hasAccounts: accounts.length > 0,
    lastSyncedAt,
  };
}

/** GBP-style currency, no decimals for big figures. */
export function formatMoney(
  amount: number,
  currency = 'GBP',
  opts?: { decimals?: boolean },
): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(amount);
}
