import { z } from 'zod';
import {
  REVENUECAT_PRO_ENTITLEMENT,
  REVENUECAT_PRODUCTS,
} from '@/lib/revenuecat-config';
import type { RevenueCatEvent } from '@/lib/revenuecat-sync';

const nullableDateString = z.string().nullable().optional();

const entitlementSchema = z
  .object({
    expires_date: nullableDateString,
    grace_period_expires_date: nullableDateString,
    product_identifier: z.string().min(1),
    purchase_date: nullableDateString,
  })
  .passthrough();

const subscriptionSchema = z
  .object({
    billing_issues_detected_at: nullableDateString,
    expires_date: nullableDateString,
    grace_period_expires_date: nullableDateString,
    is_sandbox: z.boolean().optional(),
    original_purchase_date: nullableDateString,
    period_type: z.string().optional(),
    purchase_date: nullableDateString,
    refunded_at: nullableDateString,
    store: z.string().optional(),
    store_transaction_id: z.union([z.string(), z.number()]).optional(),
    unsubscribe_detected_at: nullableDateString,
  })
  .passthrough();

const subscriberResponseSchema = z
  .object({
    request_date: z.string().optional(),
    request_date_ms: z.number().finite().optional(),
    subscriber: z
      .object({
        entitlements: z.record(z.string(), entitlementSchema),
        original_app_user_id: z.string().optional(),
        subscriptions: z.record(z.string(), subscriptionSchema),
      })
      .passthrough(),
  })
  .passthrough();

export type RevenueCatSubscriberResponse = z.infer<
  typeof subscriberResponseSchema
>;

export type RevenueCatProSnapshot = {
  billingPeriod: 'MONTHLY' | 'ANNUAL';
  cancelledAt: Date | null;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  event: RevenueCatEvent;
  gracePeriodEnd: Date | null;
  originalAppUserId?: string;
  productId: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED';
  transactionId: string | null;
};

export type RevenueCatProSelection =
  | { active: true; snapshot: RevenueCatProSnapshot }
  | {
      active: false;
      reason:
        | 'expired_entitlement'
        | 'invalid_entitlement_dates'
        | 'missing_entitlement'
        | 'refunded';
    };

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';
const LIFETIME_EXPIRATION = new Date('9999-12-31T23:59:59.999Z');

const dateOrNull = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const latestDate = (...values: Array<Date | null>) => {
  const dates = values.filter((value): value is Date => value !== null);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
};

const observedAtMs = (response: RevenueCatSubscriberResponse, now: Date) =>
  response.request_date_ms ??
  dateOrNull(response.request_date)?.getTime() ??
  now.getTime();

/** Parse RevenueCat's v1 Customer Info response without trusting its shape. */
export const parseRevenueCatSubscriberResponse = (
  value: unknown,
): RevenueCatSubscriberResponse => subscriberResponseSchema.parse(value);

/**
 * Return a normalized snapshot only when RevenueCat itself reports the exact
 * genwel_pro entitlement as currently active. Product records alone never
 * grant access.
 */
export const selectActiveRevenueCatPro = (
  response: RevenueCatSubscriberResponse,
  now = new Date(),
): RevenueCatProSelection => {
  const subscriber = response.subscriber;
  const entitlement = subscriber.entitlements[REVENUECAT_PRO_ENTITLEMENT];
  if (!entitlement) return { active: false, reason: 'missing_entitlement' };

  const productId = entitlement.product_identifier;
  const subscription = subscriber.subscriptions[productId];
  if (dateOrNull(subscription?.refunded_at)) {
    return { active: false, reason: 'refunded' };
  }

  const entitlementExpiry = dateOrNull(entitlement.expires_date);
  const gracePeriodEnd = latestDate(
    dateOrNull(entitlement.grace_period_expires_date),
    dateOrNull(subscription?.grace_period_expires_date),
  );
  const hasLifetimeAccess = entitlement.expires_date === null;
  const effectiveAccessEnd = latestDate(entitlementExpiry, gracePeriodEnd);
  if (
    entitlement.expires_date !== null &&
    entitlement.expires_date !== undefined &&
    !entitlementExpiry
  ) {
    return { active: false, reason: 'invalid_entitlement_dates' };
  }
  if (
    !hasLifetimeAccess &&
    (!effectiveAccessEnd || effectiveAccessEnd.getTime() <= now.getTime())
  ) {
    return { active: false, reason: 'expired_entitlement' };
  }

  const currentPeriodEnd =
    entitlementExpiry ?? gracePeriodEnd ?? LIFETIME_EXPIRATION;
  const currentPeriodStart =
    dateOrNull(subscription?.purchase_date) ??
    dateOrNull(entitlement.purchase_date) ??
    now;
  const cancelledAt = dateOrNull(subscription?.unsubscribe_detected_at);
  const billingIssueAt = dateOrNull(subscription?.billing_issues_detected_at);
  const isTrial = subscription?.period_type?.toLowerCase() === 'trial';
  const status = cancelledAt
    ? ('CANCELLED' as const)
    : billingIssueAt
      ? ('PAST_DUE' as const)
      : isTrial
        ? ('TRIALING' as const)
        : ('ACTIVE' as const);
  const transactionId =
    subscription?.store_transaction_id === undefined
      ? null
      : String(subscription.store_transaction_id);
  const timestamp = observedAtMs(response, now);
  const eventType =
    status === 'CANCELLED'
      ? ('CANCELLATION' as const)
      : status === 'PAST_DUE'
        ? ('BILLING_ISSUE' as const)
        : ('INITIAL_PURCHASE' as const);
  const billingPeriod =
    productId === REVENUECAT_PRODUCTS.annual || /annual|year/i.test(productId)
      ? ('ANNUAL' as const)
      : ('MONTHLY' as const);

  const event: RevenueCatEvent = {
    id: [
      'rc:reconcile',
      transactionId ?? productId,
      status,
      currentPeriodEnd.toISOString(),
    ].join(':'),
    type: eventType,
    original_app_user_id: subscriber.original_app_user_id,
    product_id: productId,
    entitlement_ids: [REVENUECAT_PRO_ENTITLEMENT],
    period_type: isTrial ? 'TRIAL' : 'NORMAL',
    event_timestamp_ms: timestamp,
    purchased_at_ms: currentPeriodStart.getTime(),
    expiration_at_ms: currentPeriodEnd.getTime(),
    grace_period_expiration_at_ms: gracePeriodEnd?.getTime() ?? null,
    transaction_id: transactionId ?? undefined,
    environment: subscription?.is_sandbox ? 'SANDBOX' : 'PRODUCTION',
    store: subscription?.store,
    cancel_reason: cancelledAt ? 'UNSUBSCRIBE' : undefined,
    cancelled_at_ms: cancelledAt?.getTime(),
    source: 'RECONCILE',
  };

  return {
    active: true,
    snapshot: {
      billingPeriod,
      cancelledAt,
      currentPeriodEnd,
      currentPeriodStart,
      event,
      gracePeriodEnd,
      originalAppUserId: subscriber.original_app_user_id,
      productId,
      status,
      transactionId,
    },
  };
};

export class RevenueCatConfigurationError extends Error {
  constructor() {
    super('REVENUECAT_SECRET_API_KEY is not configured');
    this.name = 'RevenueCatConfigurationError';
  }
}

export class RevenueCatRequestError extends Error {
  constructor(
    message: string,
    readonly upstreamStatus?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RevenueCatRequestError';
  }
}

type FetchRevenueCatOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

/** Fetch authoritative customer state with a server-only RevenueCat v1 key. */
export const fetchRevenueCatSubscriber = async (
  userId: string,
  options: FetchRevenueCatOptions = {},
): Promise<RevenueCatSubscriberResponse> => {
  const apiKey = options.apiKey ?? process.env.REVENUECAT_SECRET_API_KEY;
  if (!apiKey) throw new RevenueCatConfigurationError();

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      `${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(userId)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
        signal: options.signal ?? AbortSignal.timeout(8_000),
      },
    );
  } catch (error) {
    throw new RevenueCatRequestError('RevenueCat request failed', undefined, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new RevenueCatRequestError(
      'RevenueCat returned an unsuccessful response',
      response.status,
    );
  }

  const body = await response.json().catch((error: unknown) => {
    throw new RevenueCatRequestError(
      'RevenueCat returned invalid JSON',
      undefined,
      {
        cause: error,
      },
    );
  });
  try {
    return parseRevenueCatSubscriberResponse(body);
  } catch (error) {
    throw new RevenueCatRequestError(
      'RevenueCat returned an invalid customer response',
      undefined,
      { cause: error },
    );
  }
};
