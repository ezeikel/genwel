'use server';

import { db } from '@genwel/db';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { STRIPE_PRICES, stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe';

/**
 * Billing server actions: start a Pro checkout and open the Stripe billing
 * portal. Subscription state is written by the webhook, never here — these just
 * hand the user off to Stripe-hosted pages.
 */

type CheckoutResult = { url: string } | { error: string };

/**
 * Create a Stripe Checkout Session for Pro (monthly or annual). Reuses the
 * user's Stripe customer if one exists; attaches a 7-day trial for first-time
 * subscribers. Returns the hosted checkout URL to redirect to.
 */
export async function createProCheckout(
  billingPeriod: 'monthly' | 'annual',
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Please sign in to upgrade.' };
  const userId = session.user.id;

  const priceId =
    billingPeriod === 'annual'
      ? STRIPE_PRICES.proAnnual
      : STRIPE_PRICES.proMonthly;
  if (!priceId) {
    return { error: 'Billing is not configured yet. Please try again later.' };
  }

  const origin =
    (await headers()).get('origin') ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, subscriptions: true },
  });

  // Only offer a trial to users who have never subscribed before.
  const isTrialEligible = !user?.subscriptions?.length;

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer: user?.stripeCustomerId ?? undefined,
      customer_email: user?.stripeCustomerId
        ? undefined
        : (user?.email ?? undefined),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: isTrialEligible
        ? {
            trial_period_days: TRIAL_PERIOD_DAYS,
            trial_settings: {
              end_behavior: { missing_payment_method: 'cancel' },
            },
          }
        : undefined,
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing`,
    });

    if (!checkout.url) return { error: 'Could not start checkout.' };
    return { url: checkout.url };
  } catch (err) {
    console.error('[billing] checkout failed:', err);
    return { error: 'Could not start checkout. Please try again.' };
  }
}

/**
 * Open the Stripe billing portal so the user can update payment details, switch
 * plans, or cancel. Requires an existing Stripe customer.
 */
export async function createBillingPortalSession(): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Please sign in.' };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return { error: 'No billing account found. Upgrade to Pro first.' };
  }

  const origin =
    (await headers()).get('origin') ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/dashboard/accounts`,
    });
    return { url: portal.url };
  } catch (err) {
    console.error('[billing] portal failed:', err);
    return { error: 'Could not open billing portal.' };
  }
}
