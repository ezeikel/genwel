import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  fetchRevenueCatSubscriber,
  parseRevenueCatSubscriberResponse,
  RevenueCatConfigurationError,
  selectActiveRevenueCatPro,
} from './revenuecat-subscriber';

const NOW = new Date('2026-07-14T12:00:00.000Z');

const customer = ({
  entitlement = {},
  includeEntitlement = true,
  subscription = {},
}: {
  entitlement?: Record<string, unknown>;
  includeEntitlement?: boolean;
  subscription?: Record<string, unknown>;
} = {}) => ({
  request_date: NOW.toISOString(),
  request_date_ms: NOW.getTime(),
  subscriber: {
    original_app_user_id: '$RCAnonymousID:original',
    entitlements: includeEntitlement
      ? {
          genwel_pro: {
            expires_date: '2027-07-14T12:00:00.000Z',
            grace_period_expires_date: null,
            product_identifier: 'genwel_pro_yearly_v1',
            purchase_date: '2026-07-14T12:00:00.000Z',
            ...entitlement,
          },
        }
      : {},
    subscriptions: {
      genwel_pro_yearly_v1: {
        billing_issues_detected_at: null,
        expires_date: '2027-07-14T12:00:00.000Z',
        grace_period_expires_date: null,
        is_sandbox: true,
        original_purchase_date: '2026-07-14T12:00:00.000Z',
        period_type: 'trial',
        purchase_date: '2026-07-14T12:00:00.000Z',
        refunded_at: null,
        store: 'app_store',
        store_transaction_id: 'store_tx_123',
        unsubscribe_detected_at: null,
        ...subscription,
      },
    },
  },
});

test('normalizes an active annual trial from the exact Pro entitlement', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(customer()),
    NOW,
  );

  assert.equal(result.active, true);
  if (!result.active) return;
  assert.equal(result.snapshot.status, 'TRIALING');
  assert.equal(result.snapshot.billingPeriod, 'ANNUAL');
  assert.equal(result.snapshot.transactionId, 'store_tx_123');
  assert.equal(result.snapshot.event.environment, 'SANDBOX');
  assert.deepEqual(result.snapshot.event.entitlement_ids, ['genwel_pro']);
});

test('does not grant access from a product record without genwel_pro', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(customer({ includeEntitlement: false })),
    NOW,
  );

  assert.deepEqual(result, {
    active: false,
    reason: 'missing_entitlement',
  });
});

test('rejects an expired Pro entitlement', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(
      customer({
        entitlement: {
          expires_date: '2026-07-13T12:00:00.000Z',
        },
      }),
    ),
    NOW,
  );

  assert.deepEqual(result, {
    active: false,
    reason: 'expired_entitlement',
  });
});

test('rejects a refunded Pro subscription', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(
      customer({
        subscription: {
          refunded_at: '2026-07-14T11:00:00.000Z',
        },
      }),
    ),
    NOW,
  );

  assert.deepEqual(result, {
    active: false,
    reason: 'refunded',
  });
});

test('fails closed on malformed entitlement expiry dates', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(
      customer({
        entitlement: {
          expires_date: 'not-a-date',
        },
      }),
    ),
    NOW,
  );

  assert.deepEqual(result, {
    active: false,
    reason: 'invalid_entitlement_dates',
  });
});

test('keeps access during an active billing grace period', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(
      customer({
        entitlement: {
          expires_date: '2026-07-13T12:00:00.000Z',
          grace_period_expires_date: '2026-07-16T12:00:00.000Z',
        },
        subscription: {
          billing_issues_detected_at: '2026-07-13T12:00:00.000Z',
          period_type: 'normal',
        },
      }),
    ),
    NOW,
  );

  assert.equal(result.active, true);
  if (!result.active) return;
  assert.equal(result.snapshot.status, 'PAST_DUE');
  assert.equal(
    result.snapshot.gracePeriodEnd?.toISOString(),
    '2026-07-16T12:00:00.000Z',
  );
});

test('maps active auto-renewal cancellation without revoking paid access', () => {
  const result = selectActiveRevenueCatPro(
    parseRevenueCatSubscriberResponse(
      customer({
        subscription: {
          period_type: 'normal',
          unsubscribe_detected_at: '2026-07-10T12:00:00.000Z',
        },
      }),
    ),
    NOW,
  );

  assert.equal(result.active, true);
  if (!result.active) return;
  assert.equal(result.snapshot.status, 'CANCELLED');
});

test('fetches the encoded authenticated user with the server secret', async () => {
  let requestedUrl = '';
  let requestedAuthorization = '';
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestedAuthorization =
      new Headers(init?.headers).get('authorization') ?? '';
    return Response.json(customer());
  }) as typeof fetch;

  const response = await fetchRevenueCatSubscriber('user/id with spaces', {
    apiKey: 'sk_server_only',
    fetcher,
    signal: new AbortController().signal,
  });

  assert.equal(
    requestedUrl,
    'https://api.revenuecat.com/v1/subscribers/user%2Fid%20with%20spaces',
  );
  assert.equal(requestedAuthorization, 'Bearer sk_server_only');
  assert.equal(
    response.subscriber.original_app_user_id,
    '$RCAnonymousID:original',
  );
});

test('fails closed when the RevenueCat server secret is absent', async () => {
  await assert.rejects(
    fetchRevenueCatSubscriber('user_123', { apiKey: '' }),
    RevenueCatConfigurationError,
  );
});

test('rejects malformed customer responses', () => {
  assert.throws(() =>
    parseRevenueCatSubscriberResponse({ subscriber: { entitlements: [] } }),
  );
});
