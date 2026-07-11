import type { BillingPeriod, PlanName, SubscriptionStatus } from '@genwel/db';
import Stripe from 'stripe';

/**
 * Stripe server client + the small mapping layer that keeps the DB the source
 * of truth. Price IDs come from env so the same code runs against test/live
 * Stripe accounts without edits.
 */

// Lazily construct the client so an unset STRIPE_SECRET_KEY doesn't throw at
// build/import time (Next collects route metadata at build with no runtime env).
// A dummy key keeps construction safe; real calls fail loudly at request time
// if the key is genuinely missing.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder_build_time',
  {
    // Pin to the version this SDK ships with so object shapes stay stable.
    apiVersion: '2026-06-24.dahlia',
    typescript: true,
  },
);

/** 7-day free trial on Pro (matches the approved pricing plan). */
export const TRIAL_PERIOD_DAYS = 7;

/**
 * Env-driven price IDs. Set these to the Genwel Stripe Product's two Prices
 * (£6.99/mo and £54.99/yr). Kept out of the bundle except the public ones the
 * client needs to start checkout.
 */
export const STRIPE_PRICES = {
  proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
  proAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? '',
} as const;

/**
 * Map a Stripe price id back to our plan + billing period. The webhook uses
 * this to write normalized rows; if a price id isn't recognised we fall back to
 * PRO/MONTHLY and log, rather than dropping the subscription.
 */
export function mapStripePriceToPlan(priceId: string): {
  planName: PlanName;
  billingPeriod: BillingPeriod;
} {
  if (priceId === STRIPE_PRICES.proAnnual) {
    return { planName: 'PRO', billingPeriod: 'ANNUAL' };
  }
  if (priceId === STRIPE_PRICES.proMonthly) {
    return { planName: 'PRO', billingPeriod: 'MONTHLY' };
  }
  console.warn(
    `[stripe] unrecognised price id ${priceId} — defaulting to PRO/MONTHLY`,
  );
  return { planName: 'PRO', billingPeriod: 'MONTHLY' };
}

/**
 * Normalize Stripe's subscription status into our enum. Both Stripe (web) and
 * RevenueCat (mobile) map into this single status set so entitlement checks are
 * provider-agnostic.
 */
export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'unpaid':
      return 'PAST_DUE';
    case 'paused':
      return 'PAUSED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'EXPIRED';
    default:
      return 'EXPIRED';
  }
}
