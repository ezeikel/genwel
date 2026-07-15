import { getEntitlementsForUser } from '@/lib/entitlements';
import {
  getMobileUserId,
  mobileError,
  mobileJson,
  mobileOptions,
} from '@/lib/mobile-api';
import {
  fetchRevenueCatSubscriber,
  RevenueCatConfigurationError,
  RevenueCatRequestError,
  selectActiveRevenueCatPro,
} from '@/lib/revenuecat-subscriber';
import {
  expireRevenueCatAccessForUser,
  syncRevenueCatEvent,
} from '@/lib/revenuecat-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const userId = await getMobileUserId();
  if (!userId) return mobileError('Unauthorized', 401);

  try {
    const customer = await fetchRevenueCatSubscriber(userId);
    const selection = selectActiveRevenueCatPro(customer);

    if (!selection.active) {
      if (selection.reason === 'invalid_entitlement_dates') {
        console.error(
          '[revenuecat] reconcile returned invalid entitlement dates',
        );
        return mobileError('Could not verify purchase', 502);
      }

      const revocation = await expireRevenueCatAccessForUser(
        userId,
        selection.reason,
        customer.request_date_ms
          ? new Date(customer.request_date_ms)
          : new Date(),
      );
      return mobileJson({
        reconciled: true,
        revenueCatActive: false,
        reason: selection.reason,
        expiredSubscriptions: revocation.expired,
        entitlements: await getEntitlementsForUser(userId),
      });
    }

    const event = {
      ...selection.snapshot.event,
      id: `${selection.snapshot.event.id}:${userId}`,
      app_user_id: userId,
    };
    const result = await syncRevenueCatEvent(event);
    if ('ignored' in result && result.ignored !== 'stale_event') {
      console.error(
        '[revenuecat] reconcile event was not synchronized',
        result,
      );
      return mobileError('Could not reconcile purchase', 500);
    }

    return mobileJson({
      reconciled: true,
      revenueCatActive: true,
      entitlements: await getEntitlementsForUser(userId),
    });
  } catch (error) {
    if (error instanceof RevenueCatConfigurationError) {
      console.error('[revenuecat] reconcile is not configured');
      return mobileError('Billing reconciliation is unavailable', 503);
    }
    if (error instanceof RevenueCatRequestError) {
      console.error(
        '[revenuecat] reconcile request failed',
        error.upstreamStatus ?? 'network_or_payload',
      );
      return mobileError('Could not verify purchase', 502);
    }
    console.error('[revenuecat] reconcile failed', error);
    return mobileError('Could not reconcile purchase', 500);
  }
}

export const OPTIONS = () => mobileOptions('POST');
