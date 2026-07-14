import type { SubscriptionReport } from '@/lib/subscriptions';

/**
 * Fixable-problems ("the Genwel wedge") — ranked, conservative money-saving
 * findings. Recurring detection now lives in one place (lib/subscriptions.ts);
 * this module DERIVES its duplicate-subscription and price-increase problems
 * from that report, and adds over-budget problems from budget progress. The
 * bias stays deliberately CONSERVATIVE: a false "cancel your rent" is far worse
 * than a miss.
 */

export type TxnInput = {
  amount: number; // signed; debits negative
  description: string;
  merchantName: string | null;
  aiCategory: string | null;
  category: string | null; // TrueLayer category
  timestamp: Date;
};

export type FixableProblem = {
  id: string;
  kind: 'duplicate_subscription' | 'price_increase' | 'over_budget';
  title: string;
  detail: string;
  /**
   * Conservative estimated saving in GBP. For subscriptions this is annualised
   * (monthly charge × 12); for over-budget it is the this-period overspend.
   * The `detail` text states the timeframe, so the UI shows the raw figure.
   */
  estimatedSaving: number;
  merchants: string[];
  severity: 'high' | 'medium' | 'low';
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

/**
 * Rank fixable problems from a subscription report + budget overspend.
 * Single source of truth for recurring detection = lib/subscriptions.ts.
 */
export function detectFixableProblems(args: {
  report: SubscriptionReport;
  overBudget?: { category: string; overspend: number }[];
}): FixableProblem[] {
  const problems: FixableProblem[] = [];

  // 1. Duplicate / overlapping subscriptions — 2+ of the same service class.
  for (const dup of args.report.duplicates) {
    const cheapest = dup.subscriptions.reduce((a, b) =>
      a.monthlyAmount <= b.monthlyAmount ? a : b,
    );
    const annualSaving = Math.round(cheapest.monthlyAmount * 12);
    problems.push({
      id: `dup-${dup.label.replace(/\s+/g, '-')}`,
      kind: 'duplicate_subscription',
      title: `You have ${dup.subscriptions.length} ${dup.label} subscriptions`,
      detail: `${dup.subscriptions
        .map((s) => `${s.name} (${formatMoney(s.monthlyAmount)}/mo)`)
        .join(
          ' and ',
        )}. Cancelling ${cheapest.name} could save around ${formatMoney(cheapest.monthlyAmount)}/mo.`,
      estimatedSaving: annualSaving,
      merchants: dup.subscriptions.map((s) => s.name),
      severity: annualSaving >= 100 ? 'high' : 'medium',
    });
  }

  // 2. Price increases — a subscription whose amount rose meaningfully.
  for (const sub of args.report.subscriptions) {
    if (!sub.priceRise) continue;
    if (sub.occurrences < 3) continue; // need history to trust the rise
    const { from, to, delta } = sub.priceRise;
    problems.push({
      id: `price-${sub.key}`,
      kind: 'price_increase',
      title: `${sub.name} went up`,
      detail: `${sub.name} rose from ${formatMoney(from)} to ${formatMoney(to)} (${Math.round((delta / from) * 100)}%). Worth checking you're still on the best deal.`,
      estimatedSaving: Math.round(delta * 12),
      merchants: [sub.name],
      severity: 'low',
    });
  }

  // 3. Over-budget categories (from budget progress). Report the THIS-PERIOD
  // overspend as recoverable — deliberately NOT annualised (a single period's
  // overspend isn't a guaranteed recurring loss).
  for (const ob of args.overBudget ?? []) {
    if (ob.overspend <= 0) continue;
    const label = ob.category.toLowerCase().replace(/_/g, ' ');
    problems.push({
      id: `budget-${ob.category}`,
      kind: 'over_budget',
      title: `Over budget on ${label}`,
      detail: `You're ${formatMoney(ob.overspend)} over your ${label} budget this period. Pulling this back keeps ${formatMoney(ob.overspend)} in your pocket.`,
      estimatedSaving: Math.round(ob.overspend),
      merchants: [],
      severity: ob.overspend >= 50 ? 'medium' : 'low',
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  return problems.sort((a, b) => {
    const s = severityRank[a.severity] - severityRank[b.severity];
    return s !== 0 ? s : b.estimatedSaving - a.estimatedSaving;
  });
}
