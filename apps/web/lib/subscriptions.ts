import { getDisplayMerchant, getMerchantKey } from '@genwel/banking/merchant';
import type { SpendingCategory } from '@genwel/db';

/**
 * Recurring-payment (subscription) detection.
 *
 * Deterministic — no AI. Groups a user's debits by merchant key (derived from
 * the description, since banks like the mock provider return a NULL
 * merchantName), then keeps groups that look like a recurring charge: several
 * occurrences at a roughly regular interval and a stable amount. For each it
 * computes the cadence, the predicted next charge date, and flags price rises.
 * Duplicate/overlap detection (e.g. two streaming services) is layered on top.
 *
 * Pure module (no "use server", no db) — feed it plain transaction rows.
 */

export type TxnLike = {
  description: string;
  merchantName: string | null;
  amount: number; // negative = debit
  aiCategory: SpendingCategory | null;
  category: string | null;
  timestamp: Date;
};

export type Cadence = 'weekly' | 'monthly' | 'yearly' | 'irregular';

export type Subscription = {
  key: string;
  name: string;
  category: SpendingCategory | null;
  cadence: Cadence;
  /** typical charge amount (most recent) */
  amount: number;
  /** normalised to a monthly figure for totals */
  monthlyAmount: number;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  /** predicted next charge date, or null if cadence is irregular */
  nextRenewal: Date | null;
  /** amount went up vs the earliest charge (price rise), else null */
  priceRise: { from: number; to: number; delta: number } | null;
};

export type DuplicateGroup = {
  label: string; // e.g. "streaming"
  subscriptions: Subscription[];
  /** potential monthly saving if you cut all but the priciest */
  potentialMonthlySaving: number;
};

export type SubscriptionReport = {
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  duplicates: DuplicateGroup[];
  /** renewals within the next 14 days, soonest first */
  upcoming: Subscription[];
};

const DAY = 24 * 60 * 60 * 1000;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function cadenceFromGapDays(gapDays: number): Cadence {
  if (gapDays >= 5 && gapDays <= 9) return 'weekly';
  if (gapDays >= 25 && gapDays <= 35) return 'monthly';
  if (gapDays >= 350 && gapDays <= 380) return 'yearly';
  return 'irregular';
}

function monthlyFactor(cadence: Cadence): number {
  switch (cadence) {
    case 'weekly':
      return 52 / 12;
    case 'monthly':
      return 1;
    case 'yearly':
      return 1 / 12;
    default:
      return 1;
  }
}

// Categories that are almost never "subscriptions" — a recurring ATM
// withdrawal, grocery shop or transfer isn't a bill to cut. Excluding them
// keeps the list to genuine subscriptions/bills.
const NON_SUBSCRIPTION_CATEGORIES = new Set<SpendingCategory>([
  'CASH',
  'TRANSFER',
  'GROCERIES',
  'EATING_OUT',
  'INCOME',
  'SHOPPING',
  'HEALTH',
  'PERSONAL_CARE',
]);

/** Group transactions into candidate subscriptions and score each. */
export function detectSubscriptions(txns: TxnLike[]): Subscription[] {
  // Debits, excluding categories that don't represent subscriptions/bills.
  const debits = txns.filter(
    (t) =>
      t.amount < 0 &&
      !(t.aiCategory && NON_SUBSCRIPTION_CATEGORIES.has(t.aiCategory)),
  );

  // Group by merchant key.
  const groups = new Map<string, TxnLike[]>();
  for (const t of debits) {
    const key = t.merchantName
      ? getMerchantKey(t.merchantName)
      : getMerchantKey(t.description);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const subs: Subscription[] = [];

  for (const [key, list] of groups) {
    if (list.length < 2) continue; // need a repeat to be recurring

    const sorted = [...list].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Interval between consecutive charges (in days).
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      gaps.push(
        (sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()) /
          DAY,
      );
    }
    const medGap = median(gaps);
    const cadence = cadenceFromGapDays(medGap);

    // Amount stability: most charges should be within ~20% of the median.
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const medAmount = median(amounts);
    if (medAmount === 0) continue;
    const stable =
      amounts.filter((a) => Math.abs(a - medAmount) / medAmount <= 0.2).length /
        amounts.length >=
      0.6;

    // A real subscription recurs on a genuine cadence with a stable amount.
    // (No loose "repeated at any interval" fallback — that catches groceries.)
    const looksRecurring = cadence !== 'irregular' && stable;
    if (!looksRecurring) continue;

    const lastSeen = sorted[sorted.length - 1].timestamp;
    const firstSeen = sorted[0].timestamp;
    const latestAmount = Math.abs(sorted[sorted.length - 1].amount);
    const earliestAmount = Math.abs(sorted[0].amount);

    // Predicted next renewal from the median gap (cadence is regular by now).
    const nextRenewal = new Date(lastSeen.getTime() + medGap * DAY);

    // Price rise: latest meaningfully higher than earliest (>5% and >£0.50).
    let priceRise: Subscription['priceRise'] = null;
    const delta = latestAmount - earliestAmount;
    if (delta > 0.5 && delta / earliestAmount > 0.05) {
      priceRise = { from: earliestAmount, to: latestAmount, delta };
    }

    const factor = monthlyFactor(cadence);
    const name = getDisplayMerchant(
      sorted[sorted.length - 1].merchantName ||
        sorted[sorted.length - 1].description,
    );

    subs.push({
      key,
      name,
      category: sorted[sorted.length - 1].aiCategory,
      cadence,
      amount: latestAmount,
      monthlyAmount: latestAmount * factor,
      occurrences: sorted.length,
      firstSeen,
      lastSeen,
      nextRenewal,
      priceRise,
    });
  }

  // Biggest monthly cost first.
  return subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

// Categories where having two+ overlapping services is a common "cut one" case.
const OVERLAP_LABELS: Partial<Record<SpendingCategory, string>> = {
  ENTERTAINMENT: 'streaming & entertainment',
  SUBSCRIPTIONS: 'subscriptions',
};

/** Find categories with 2+ subscriptions — candidate overlaps to cut. */
function findDuplicates(subs: Subscription[]): DuplicateGroup[] {
  const byCat = new Map<SpendingCategory, Subscription[]>();
  for (const s of subs) {
    if (!s.category) continue;
    const label = OVERLAP_LABELS[s.category];
    if (!label) continue;
    const list = byCat.get(s.category) ?? [];
    list.push(s);
    byCat.set(s.category, list);
  }

  const groups: DuplicateGroup[] = [];
  for (const [cat, list] of byCat) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
    // Saving = everything except the priciest one.
    const potentialMonthlySaving = sorted
      .slice(1)
      .reduce((sum, s) => sum + s.monthlyAmount, 0);
    groups.push({
      label: OVERLAP_LABELS[cat] ?? cat.toLowerCase(),
      subscriptions: sorted,
      potentialMonthlySaving,
    });
  }
  return groups.sort(
    (a, b) => b.potentialMonthlySaving - a.potentialMonthlySaving,
  );
}

/** Build the full report from raw transactions. */
export function buildSubscriptionReport(
  txns: TxnLike[],
  now = new Date(),
): SubscriptionReport {
  const subscriptions = detectSubscriptions(txns);
  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + s.monthlyAmount,
    0,
  );
  const upcoming = subscriptions
    .filter(
      (s) =>
        s.nextRenewal &&
        s.nextRenewal.getTime() >= now.getTime() &&
        s.nextRenewal.getTime() <= now.getTime() + 14 * DAY,
    )
    .sort(
      (a, b) =>
        (a.nextRenewal?.getTime() ?? 0) - (b.nextRenewal?.getTime() ?? 0),
    );

  return {
    subscriptions,
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
    duplicates: findDuplicates(subscriptions),
    upcoming,
  };
}
