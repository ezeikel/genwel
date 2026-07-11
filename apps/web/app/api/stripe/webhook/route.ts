import { db } from '@genwel/db';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import {
  syncStripeSubscription,
  syncStripeSubscriptionById,
} from '@/lib/stripe-sync';

/**
 * Stripe webhook — the ONLY writer of subscription state. Verifies the
 * signature, dedupes re-delivered events via the webhook_events table, and
 * routes each event to the DB sync so the `subscriptions` table stays the
 * source of truth. Must read the raw body (Stripe signs the exact bytes).
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency — skip events we've already processed (Stripe re-delivers).
  const already = await db.webhookEvent.findUnique({ where: { id: event.id } });
  if (already) {
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          // client_reference_id is our userId (set when the user is logged in).
          const userId = session.client_reference_id ?? undefined;
          // Backfill the customer id onto the user for future portal/lookups.
          if (userId && session.customer) {
            const customerId =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer.id;
            await db.user.update({
              where: { id: userId },
              data: { stripeCustomerId: customerId },
            });
          }
          await syncStripeSubscriptionById(subscriptionId, {
            userId,
            eventId: event.id,
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(subscription, { eventId: event.id });
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const sub = invoice.subscription;
        if (sub) {
          const subscriptionId = typeof sub === 'string' ? sub : sub.id;
          await syncStripeSubscriptionById(subscriptionId, {
            eventId: event.id,
          });
        }
        break;
      }

      default:
        // Unhandled event types are fine — we still record them as processed.
        break;
    }

    await db.webhookEvent.create({
      data: { id: event.id, platform: 'STRIPE', eventType: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[stripe/webhook] handler failed for ${event.type}:`, err);
    // Return 500 so Stripe retries (we haven't recorded the event as processed).
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
