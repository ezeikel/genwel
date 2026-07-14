import { db } from '@genwel/db';
import { Suspense } from 'react';
import { getSubscriptionReport } from '@/actions/subscriptions';
import { auth } from '@/auth';
import AccountGroup from '@/components/dashboard/AccountGroup';
import BalanceSplitChart, {
  type SplitSlice,
} from '@/components/dashboard/BalanceSplitChart';
import ConnectBankButton from '@/components/dashboard/ConnectBankButton';
import EmptyState from '@/components/dashboard/EmptyState';
import FixableProblems from '@/components/dashboard/FixableProblems';
import NetWorthHero from '@/components/dashboard/NetWorthHero';
import OverviewInsight from '@/components/dashboard/OverviewInsight';
import SubscriptionsCard from '@/components/dashboard/subscriptions/SubscriptionsCard';
import TransactionList from '@/components/dashboard/TransactionList';
import { buildNetWorthSummary, type OverviewAccount } from '@/lib/accounts';
import { effectiveCategory } from '@/lib/budget-utils';

// Brand-token chart colours for the balance split.
const SPLIT_COLORS: Record<string, string> = {
  Cash: 'var(--primary)',
  Savings: 'oklch(0.6 0.13 160)', // emerald-ish, on-brand
  'Credit cards': 'var(--accent)',
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const bankAccounts = await db.bankAccount.findMany({
    where: { connection: { userId } },
    include: { connection: { select: { providerName: true } } },
  });

  if (bankAccounts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Dashboard</h1>
        <EmptyState />
      </div>
    );
  }

  const accounts: OverviewAccount[] = bankAccounts.map((a) => ({
    id: a.id,
    accountType: a.accountType,
    displayName: a.displayName,
    providerName: a.connection.providerName,
    currency: a.currency,
    balance: Number(a.balance) || 0,
    balanceUpdatedAt: a.balanceUpdatedAt,
  }));

  const summary = buildNetWorthSummary(accounts);

  // Month delta: net of this calendar month's transactions (income − spend).
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthAgg = await db.transaction.aggregate({
    where: {
      account: { connection: { userId } },
      timestamp: { gte: monthStart },
    },
    _sum: { amount: true },
  });
  const monthDelta =
    monthAgg._sum.amount !== null ? Number(monthAgg._sum.amount) : null;

  // Recent transactions
  const recentTransactions = await db.transaction.findMany({
    where: { account: { connection: { userId } } },
    include: {
      account: {
        select: {
          displayName: true,
          connection: { select: { providerName: true } },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 8,
  });

  // Balance-split slices (only groups with a non-zero total)
  const slices: SplitSlice[] = summary.groups
    .filter((g) => g.displayTotal > 0)
    .map((g) => ({
      label: g.label,
      value: g.displayTotal,
      signed: g.total,
      color: SPLIT_COLORS[g.label] ?? 'oklch(0.7 0.02 180)',
    }));

  const cash = summary.groups.find((g) => g.kind === 'cash')?.total ?? 0;
  const savings = summary.groups.find((g) => g.kind === 'savings')?.total ?? 0;
  const creditDebt =
    summary.groups.find((g) => g.kind === 'credit')?.displayTotal ?? 0;

  // Subscriptions summary for the overview card (deterministic detection).
  const subResult = await getSubscriptionReport();
  const subscriptionReport = 'report' in subResult ? subResult.report : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <ConnectBankButton />
      </div>

      {/* Net-worth hero + on-demand sync */}
      <NetWorthHero
        netWorth={summary.netWorth}
        monthDelta={monthDelta}
        accountCount={accounts.length}
        lastSyncedAt={summary.lastSyncedAt?.toISOString() ?? null}
      />

      {/* AI "where you stand" strip — streams in, never blocks the numbers */}
      <Suspense fallback={null}>
        <OverviewInsight
          userId={userId}
          input={{
            netWorth: summary.netWorth,
            cash,
            savings,
            creditDebt,
            monthDelta,
            accountCount: accounts.length,
          }}
        />
      </Suspense>

      {/* Split donut + account groups */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BalanceSplitChart slices={slices} netWorth={summary.netWorth} />
        </div>
        <div className="space-y-4 lg:col-span-3">
          {summary.groups.map((group) => (
            <AccountGroup key={group.kind} group={group} />
          ))}
        </div>
      </div>

      {/* Subscriptions summary */}
      {subscriptionReport && <SubscriptionsCard report={subscriptionReport} />}

      {/* Fixable Problems (the wedge) */}
      <FixableProblems />

      {/* Recent transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent transactions
          </h2>
          <a
            href="/dashboard/transactions"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </a>
        </div>
        <TransactionList
          transactions={recentTransactions.map((tx) => ({
            id: tx.id,
            description: tx.description,
            amount: Number(tx.amount),
            currency: tx.currency,
            category: effectiveCategory(tx),
            merchantName: tx.merchantName,
            timestamp: tx.timestamp,
            accountName: tx.account.displayName,
            providerName: tx.account.connection.providerName,
          }))}
        />
      </div>
    </div>
  );
}
