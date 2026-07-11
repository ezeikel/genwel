import { db } from '@genwel/db';
import type Stripe from 'stripe';
import { mapStripePriceToPlan, mapStripeStatus, stripe } from '@/lib/stripe';

/**
 * Stripe → DB sync. A `subscriptions` row is a normalized local cache of
 * Stripe's truth, keyed by (platform, externalId). This upserts that row from a
 * Stripe Subscription object and appends an audit event. Called by the webhook
 * (and a reconcile job) — all writes go through here so the DB stays the single
 * source of truth shared with RevenueCat on mobile.
 */
export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  opts: { userId?: string; eventId?: string } = {},
): Promise<void> {
  const item = subscription.items.data[0];
  const priceId = item.price.id;
  const { planName, billingPeriod } = mapStripePriceToPlan(priceId);
  const status = mapStripeStatus(subscription.status);

  const currentPeriodEnd = new Date(item.current_period_end * 1000);
  const currentPeriodStart = new Date(item.current_period_start * 1000);
  const trialStart = subscription.trial_start
    ? new Date(subscription.trial_start * 1000)
    : null;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;
  const cancelledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000)
    : null;

  // Resolve the user: prefer an explicit userId (from checkout
  // client_reference_id), else look up by Stripe customer id.
  let userId = opts.userId;
  if (!userId) {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    userId = user?.id;
  }
  if (!userId) {
    console.error(
      `[stripe-sync] no user for subscription ${subscription.id}; skipping`,
    );
    return;
  }

  const existing = await db.subscription.findUnique({
    where: { externalId: subscription.id },
    select: { id: true, status: true, planName: true },
  });

  const data = {
    userId,
    platform: 'STRIPE' as const,
    externalId: subscription.id,
    planName,
    billingPeriod,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    trialStart,
    trialEnd,
    cancelledAt,
  };

  const record = await db.subscription.upsert({
    where: { externalId: subscription.id },
    create: data,
    update: data,
  });

  // Audit event — one row per lifecycle change. Idempotent on externalEventId.
  const eventType = !existing
    ? status === 'TRIALING'
      ? 'TRIAL_STARTED'
      : 'SUBSCRIPTION_STARTED'
    : existing.status !== status
      ? status === 'CANCELLED'
        ? 'CANCELLED'
        : status === 'ACTIVE'
          ? 'RENEWAL_SUCCESS'
          : status === 'PAST_DUE'
            ? 'BILLING_ISSUE_DETECTED'
            : 'SUBSCRIPTION_STARTED'
      : 'RENEWAL_SUCCESS';

  try {
    await db.subscriptionEvent.create({
      data: {
        subscriptionId: record.id,
        platform: 'STRIPE',
        eventType,
        externalEventId: opts.eventId ?? null,
        previousStatus: existing?.status ?? null,
        newStatus: status,
        previousPlan: existing?.planName ?? null,
        newPlan: planName,
        rawPayload: subscription as unknown as object,
      },
    });
  } catch (err) {
    // Duplicate externalEventId (re-delivered event) — the upsert above already
    // reconciled state, so the audit dup is harmless.
    console.warn('[stripe-sync] audit event insert skipped:', err);
  }
}

/** Fetch + sync a subscription by id (used on checkout.session.completed). */
export async function syncStripeSubscriptionById(
  subscriptionId: string,
  opts: { userId?: string; eventId?: string } = {},
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription, opts);
}
