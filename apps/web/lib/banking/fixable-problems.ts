import { getDisplayMerchant, getMerchantKey } from '@/lib/banking/merchant';

/**
 * Fixable-problems detection — the Genwel "wedge".
 *
 * Pure heuristics over transaction rows (no AI, no external calls). The output
 * makes money claims to users, so the bias is deliberately CONSERVATIVE: a
 * false positive ("cancel your rent") is far worse than a miss. Every detector
 * is gated on multiple signals and estimates savings on the low side.
 */

export type TxnInput = {
  amount: number; // signed; debits negative
  description: string;
  merchantName: string | null;
  aiCategory: string | null;
  category: string | null; // TrueLayer category
  timestamp: Date;
};

export type RecurringPayment = {
  merchantKey: string;
  merchant: string;
  serviceClass: ServiceClass | null;
  occurrences: number;
  averageAmount: number;
  lastAmount: number;
  firstAmount: number;
  monthlyAmount: number;
  cadenceDays: number;
  lastSeen: Date;
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

// Categories/descriptions that are recurring but are NOT cancellable
// subscriptions — never surface these as fixable.
const EXCLUDED_AI_CATEGORIES = new Set([
  'CASH',
  'TRANSFER',
  'FEES',
  'INCOME',
  'SAVINGS',
  'GROCERIES',
]);

const EXCLUDED_MERCHANT_KEYS = new Set([
  'save the change',
  'outgoing dd',
  'returned dd',
  'returned direct debit',
  'account overdraft fee',
  'lnk atm withdrawal',
  'lnk atm london',
  'rent',
]);

// Descriptions that look like person-to-person transfers (title + name).
const PERSON_TRANSFER_RE = /^(mr|mrs|ms|miss|dr)\s+[a-z]+\s+[a-z]+$/i;

type ServiceClass =
  | 'streaming'
  | 'music'
  | 'mobile'
  | 'broadband'
  | 'cloud_storage'
  | 'gym';

// Brand → service class. Matched on WORD BOUNDARIES (not loose substrings) so
// e.g. "EE" never matches inside "Fleet". Only used to detect OVERLAPPING
// services (two of the same class), so a false match = a false money claim —
// precision is everything here. Short/ambiguous brands ("ee", "o2", "three",
// "bt") are matched as whole words only.
const SERVICE_CLASS_KEYWORDS: Record<ServiceClass, string[]> = {
  streaming: [
    'netflix',
    'disney+',
    'disney plus',
    'now tv',
    'nowtv',
    'paramount+',
    'apple tv',
    'britbox',
    'hayu',
    'discovery+',
    'prime video',
  ],
  music: ['spotify', 'apple music', 'tidal', 'deezer', 'youtube music'],
  mobile: [
    'ee',
    'o2',
    'vodafone',
    'three',
    'tesco mobile',
    'giffgaff',
    'sky mobile',
    'lebara',
    'lyca',
    'lycamobile',
    't-mobile',
    'id mobile',
  ],
  broadband: [
    'talktalk',
    'virgin media',
    'sky broadband',
    'plusnet',
    'hyperoptic',
    'community fibre',
  ],
  cloud_storage: ['icloud', 'dropbox', 'google one', 'onedrive'],
  gym: ['puregym', 'nuffield', 'david lloyd', 'anytime fitness'],
};

function matchesKeyword(merchant: string, keyword: string): boolean {
  // Whole-phrase, word-boundary match: keyword must appear as its own token(s),
  // not as a substring inside another word. Escape regex-significant chars.
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(merchant);
}

function classifyService(merchant: string): ServiceClass | null {
  const m = merchant.toLowerCase();
  for (const [cls, keywords] of Object.entries(SERVICE_CLASS_KEYWORDS)) {
    if (keywords.some((k) => matchesKeyword(m, k))) return cls as ServiceClass;
  }
  return null;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Detect recurring subscription-like payments. Conservative gates:
 * - >= 3 occurrences
 * - low amount variance (coefficient of variation < 0.15)
 * - regular ~monthly cadence (median gap 24-35 days)
 * - not an excluded category / merchant / person transfer
 */
export function detectRecurringPayments(txns: TxnInput[]): RecurringPayment[] {
  const groups = new Map<string, TxnInput[]>();

  for (const tx of txns) {
    if (tx.amount >= 0) continue; // debits only
    if (tx.aiCategory && EXCLUDED_AI_CATEGORIES.has(tx.aiCategory)) continue;
    if (PERSON_TRANSFER_RE.test(tx.description.trim())) continue;

    const key = getMerchantKey(tx.merchantName ?? tx.description);
    if (!key || EXCLUDED_MERCHANT_KEYS.has(key)) continue;

    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }

  const recurring: RecurringPayment[] = [];

  for (const [key, list] of groups) {
    if (list.length < 3) continue;

    const sorted = [...list].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (mean < 1) continue; // ignore £0.01 mock noise / round-ups

    // Amount stability — subscriptions charge (nearly) the same each time.
    const variance =
      amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv > 0.15) continue;

    // Cadence — gaps between consecutive charges should be ~monthly.
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const days =
        (sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()) /
        (1000 * 60 * 60 * 24);
      if (days > 0) gaps.push(days);
    }
    const medianGap = median([...gaps].sort((a, b) => a - b));
    if (medianGap < 24 || medianGap > 35) continue; // monthly only, for now

    const merchant = getDisplayMerchant(
      sorted[0].merchantName ?? sorted[0].description,
    );

    recurring.push({
      merchantKey: key,
      merchant,
      serviceClass: classifyService(merchant),
      occurrences: sorted.length,
      averageAmount: mean,
      firstAmount: amounts[0],
      lastAmount: amounts[amounts.length - 1],
      monthlyAmount: mean, // monthly cadence, so avg charge ≈ monthly cost
      cadenceDays: medianGap,
      lastSeen: sorted[sorted.length - 1].timestamp,
    });
  }

  return recurring.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

/**
 * Rank fixable problems from recurring payments + budget overspend.
 * Returns the highest-impact issues with conservative £/year estimates.
 */
export function detectFixableProblems(args: {
  txns: TxnInput[];
  overBudget?: { category: string; overspend: number }[];
}): FixableProblem[] {
  const recurring = detectRecurringPayments(args.txns);
  const problems: FixableProblem[] = [];

  // 1. Duplicate / overlapping subscriptions — 2+ in the same service class.
  const byClass = new Map<ServiceClass, RecurringPayment[]>();
  for (const r of recurring) {
    if (!r.serviceClass) continue;
    const list = byClass.get(r.serviceClass);
    if (list) list.push(r);
    else byClass.set(r.serviceClass, [r]);
  }

  for (const [cls, subs] of byClass) {
    if (subs.length < 2) continue;
    // Saving = drop the cheapest of the overlapping pair (keep the priciest as
    // "the one you probably want"). Conservative: only the smallest one.
    const cheapest = subs.reduce((a, b) =>
      a.monthlyAmount <= b.monthlyAmount ? a : b,
    );
    const annualSaving = Math.round(cheapest.monthlyAmount * 12);
    problems.push({
      id: `dup-${cls}`,
      kind: 'duplicate_subscription',
      title: `You have ${subs.length} ${classLabel(cls)} subscriptions`,
      detail: `${subs
        .map((s) => `${s.merchant} (${formatMoney(s.monthlyAmount)}/mo)`)
        .join(
          ' and ',
        )}. Cancelling ${cheapest.merchant} could save around ${formatMoney(cheapest.monthlyAmount)}/mo.`,
      estimatedSaving: annualSaving,
      merchants: subs.map((s) => s.merchant),
      severity: annualSaving >= 100 ? 'high' : 'medium',
    });
  }

  // 2. Price increases — last charge meaningfully higher than the first.
  for (const r of recurring) {
    if (r.occurrences < 4) continue;
    const increase = r.lastAmount - r.firstAmount;
    if (increase <= 0.5) continue;
    const pct = increase / r.firstAmount;
    if (pct < 0.1) continue; // ignore <10% drift
    problems.push({
      id: `price-${r.merchantKey}`,
      kind: 'price_increase',
      title: `${r.merchant} went up`,
      detail: `${r.merchant} rose from ${formatMoney(r.firstAmount)} to ${formatMoney(r.lastAmount)} (${Math.round(pct * 100)}%). Worth checking you're still on the best deal.`,
      estimatedSaving: Math.round(increase * 12),
      merchants: [r.merchant],
      severity: 'low',
    });
  }

  // 3. Over-budget categories (passed in from budget progress). We report the
  // THIS-PERIOD overspend as the recoverable amount — deliberately NOT
  // annualised, since a single period's overspend isn't a guaranteed recurring
  // loss (that would overstate the claim).
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

function classLabel(cls: ServiceClass): string {
  const labels: Record<ServiceClass, string> = {
    streaming: 'streaming',
    music: 'music',
    mobile: 'mobile phone',
    broadband: 'broadband',
    cloud_storage: 'cloud storage',
    gym: 'gym',
  };
  return labels[cls];
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}
