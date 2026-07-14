import type {
  PlanName,
  SubscriptionPlatform,
  SubscriptionStatus,
} from '@genwel/db';
import { db } from '@genwel/db';

/**
 * Entitlements — the ONE place feature access is resolved. Reads only the DB
 * `subscriptions` table (never Stripe/RevenueCat live), so it answers correctly
 * whether the subscription came from web (Stripe) or mobile (RevenueCat).
 *
 * FREE is the absence of an active subscription — not a stored plan.
 */

export type Plan = PlanName | 'FREE';

export type Features = {
  /** Max bank/card connections (`null` = unlimited). Free tier = 2. */
  maxBankConnections: number | null;
  /** Full Fixable-Problems wedge (vs 1/month teaser on free). */
  fullFixableProblems: boolean;
  /** AI insights beyond the free current-month category view. */
  aiInsights: boolean;
  /** Ask Genwel conversational agent (ships later; gated now). */
  askGenwel: boolean;
  /** Monthly budgets with AI-suggested limits. */
  budgets: boolean;
  /** Custom categories + rules. */
  customCategories: boolean;
  /** Full history/trends beyond current month. */
  fullHistory: boolean;
  /** CSV/data export. */
  dataExport: boolean;
};

export const PLAN_FEATURES: Record<Plan, Features> = {
  FREE: {
    maxBankConnections: 2,
    fullFixableProblems: false,
    aiInsights: false,
    askGenwel: false,
    budgets: false,
    customCategories: false,
    fullHistory: false,
    dataExport: false,
  },
  PRO: {
    maxBankConnections: null,
    fullFixableProblems: true,
    aiInsights: true,
    askGenwel: true,
    budgets: true,
    customCategories: true,
    fullHistory: true,
    dataExport: true,
  },
};

export type Entitlements = {
  hasAccess: boolean;
  plan: Plan;
  status: SubscriptionStatus | 'NONE';
  platform: SubscriptionPlatform | null;
  expiresAt: string | null;
  isTrialing: boolean;
  isCancelled: boolean;
  features: Features;
};

const FREE_ENTITLEMENTS: Entitlements = {
  hasAccess: false,
  plan: 'FREE',
  status: 'NONE',
  platform: null,
  expiresAt: null,
  isTrialing: false,
  isCancelled: false,
  features: PLAN_FEATURES.FREE,
};

/**
 * DEV-ONLY entitlement override. Set DEV_ENTITLEMENT=pro (or =free) in
 * .env.local to force the plan locally without touching Stripe — flip it to
 * eyeball the Free vs Pro states. Hard-guarded to development: it is IGNORED in
 * production, so it can never grant free access to real users.
 */
function devEntitlementOverride(): Entitlements | null {
  if (process.env.NODE_ENV === 'production') return null;
  const flag = process.env.DEV_ENTITLEMENT?.toLowerCase();
  if (flag === 'pro') {
    return {
      hasAccess: true,
      plan: 'PRO',
      status: 'ACTIVE',
      platform: null,
      expiresAt: null,
      isTrialing: false,
      isCancelled: false,
      features: PLAN_FEATURES.PRO,
    };
  }
  if (flag === 'free') return FREE_ENTITLEMENTS;
  return null;
}

/**
 * Resolve a user's entitlements from the DB. A subscription grants access when
 * it is ACTIVE or TRIALING before its stored expiry, is PAST_DUE but still in
 * its paid/grace window, or is CANCELLED before the paid period end.
 */
export async function getEntitlementsForUser(
  userId: string,
): Promise<Entitlements> {
  const override = devEntitlementOverride();
  if (override) return override;

  const subscriptions = await db.subscription.findMany({
    where: { userId },
    orderBy: { currentPeriodEnd: 'desc' },
  });

  const now = new Date();
  const active = subscriptions.find(
    (sub) =>
      ((sub.status === 'ACTIVE' || sub.status === 'TRIALING') &&
        sub.currentPeriodEnd > now) ||
      (sub.status === 'PAST_DUE' &&
        (sub.currentPeriodEnd > now ||
          (sub.gracePeriodEnd !== null && sub.gracePeriodEnd > now))) ||
      (sub.status === 'CANCELLED' && sub.currentPeriodEnd > now),
  );

  if (!active) return FREE_ENTITLEMENTS;

  return {
    hasAccess: true,
    plan: active.planName,
    status: active.status,
    platform: active.platform,
    expiresAt: active.currentPeriodEnd.toISOString(),
    isTrialing: active.status === 'TRIALING',
    isCancelled: active.cancelledAt !== null,
    features: PLAN_FEATURES[active.planName],
  };
}

/** Convenience: is the user on any paid (Pro) access right now? */
export async function isPro(userId: string): Promise<boolean> {
  const ent = await getEntitlementsForUser(userId);
  return ent.hasAccess;
}
