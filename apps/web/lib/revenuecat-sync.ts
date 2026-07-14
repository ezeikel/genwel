import { db, Prisma, type SubscriptionStatus } from '@genwel/db';

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'EXPIRATION'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_EXTENDED'
  | 'REFUND'
  | 'REFUND_REVERSED'
  | 'TEMPORARY_ENTITLEMENT_GRANT'
  | 'SUBSCRIBER_ALIAS'
  | 'TRANSFER'
  | 'NON_RENEWING_PURCHASE'
  | 'TEST';

export type RevenueCatEvent = {
  id: string;
  type: RevenueCatEventType;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
  product_id?: string;
  new_product_id?: string;
  entitlement_ids?: string[];
  period_type?: 'NORMAL' | 'TRIAL' | 'INTRO';
  event_timestamp_ms?: number;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  original_transaction_id?: string;
  transaction_id?: string;
  environment?: 'SANDBOX' | 'PRODUCTION';
  store?: string;
  cancel_reason?: string;
};

export type RevenueCatWebhookBody = {
  api_version?: string;
  event: RevenueCatEvent;
};

export const REVENUECAT_PRO_ENTITLEMENT = 'genwel_pro';
export const REVENUECAT_PRODUCTS = {
  monthly: 'genwel_pro_monthly',
  annual: 'genwel_pro_annual',
} as const;

const isProProduct = (event: RevenueCatEvent) => {
  if (event.entitlement_ids?.length) {
    return event.entitlement_ids.includes(REVENUECAT_PRO_ENTITLEMENT);
  }
  const products = [event.product_id, event.new_product_id]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  return products.some(
    (product) => product.includes('genwel') && product.includes('pro'),
  );
};

const hasProductSignal = (event: RevenueCatEvent) =>
  event.entitlement_ids !== undefined ||
  Boolean(event.product_id || event.new_product_id);

const activeStatus = (event: RevenueCatEvent) =>
  event.period_type === 'TRIAL' ? ('TRIALING' as const) : ('ACTIVE' as const);

const mapStatus = (
  event: RevenueCatEvent,
  existingStatus?: SubscriptionStatus,
) => {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
    case 'REFUND_REVERSED':
      return activeStatus(event);
    case 'SUBSCRIPTION_EXTENDED':
      // An extension changes the access end, not necessarily auto-renewal.
      return existingStatus && existingStatus !== 'EXPIRED'
        ? existingStatus
        : activeStatus(event);
    case 'CANCELLATION':
      return 'CANCELLED' as const;
    case 'BILLING_ISSUE':
      return 'PAST_DUE' as const;
    case 'SUBSCRIPTION_PAUSED':
      return 'PAUSED' as const;
    case 'EXPIRATION':
    case 'REFUND':
      return 'EXPIRED' as const;
    default:
      return null;
  }
};

const mapEventType = (event: RevenueCatEvent) => {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      return event.period_type === 'TRIAL'
        ? ('TRIAL_STARTED' as const)
        : ('SUBSCRIPTION_STARTED' as const);
    case 'RENEWAL':
    case 'SUBSCRIPTION_EXTENDED':
      return 'RENEWAL_SUCCESS' as const;
    case 'CANCELLATION':
      return 'CANCELLATION_SCHEDULED' as const;
    case 'UNCANCELLATION':
    case 'REFUND_REVERSED':
      return 'REACTIVATED' as const;
    case 'BILLING_ISSUE':
      return 'BILLING_ISSUE_DETECTED' as const;
    case 'PRODUCT_CHANGE':
      return 'PLAN_UPGRADED' as const;
    case 'SUBSCRIPTION_PAUSED':
    case 'REFUND':
      return 'CANCELLED' as const;
    case 'EXPIRATION':
      return 'EXPIRED' as const;
    default:
      return null;
  }
};

const dateFromMs = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? new Date(value) : null;

const objectMetadata = (value: unknown): Prisma.InputJsonObject =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : {};

const eventMetadata = (
  event: RevenueCatEvent,
  previous: unknown,
): Prisma.InputJsonObject => {
  const previousMetadata = objectMetadata(previous);
  return {
    ...previousMetadata,
    store: event.store ?? null,
    environment: event.environment ?? null,
    entitlement: REVENUECAT_PRO_ENTITLEMENT,
    lastEventAtMs:
      event.event_timestamp_ms ?? previousMetadata.lastEventAtMs ?? 0,
  };
};

const isStale = (event: RevenueCatEvent, metadata: unknown) => {
  const previous = objectMetadata(metadata).lastEventAtMs;
  return (
    typeof event.event_timestamp_ms === 'number' &&
    typeof previous === 'number' &&
    event.event_timestamp_ms < previous
  );
};

const createAuditEvent = async ({
  event,
  subscriptionId,
  externalEventId = event.id,
  eventType,
  previousStatus,
  newStatus,
}: {
  event: RevenueCatEvent;
  subscriptionId: string;
  externalEventId?: string;
  eventType:
    | 'TRIAL_STARTED'
    | 'SUBSCRIPTION_STARTED'
    | 'RENEWAL_SUCCESS'
    | 'PLAN_UPGRADED'
    | 'CANCELLATION_SCHEDULED'
    | 'CANCELLED'
    | 'REACTIVATED'
    | 'BILLING_ISSUE_DETECTED'
    | 'EXPIRED'
    | 'TRANSFERRED';
  previousStatus: SubscriptionStatus | null;
  newStatus: SubscriptionStatus;
}) => {
  await db.subscriptionEvent.upsert({
    where: { externalEventId },
    update: {},
    create: {
      subscriptionId,
      eventType,
      platform: 'REVENUECAT',
      externalEventId,
      previousStatus,
      newStatus,
      previousPlan: previousStatus ? 'PRO' : null,
      newPlan: 'PRO',
      rawPayload: event as unknown as object,
    },
  });
};

const syncTransfer = async (event: RevenueCatEvent) => {
  const from = [...new Set(event.transferred_from?.filter(Boolean) ?? [])];
  const to = [...new Set(event.transferred_to?.filter(Boolean) ?? [])];
  const identifiers = [...new Set([...from, ...to])];
  if (!from.length || !to.length) {
    return { ignored: 'invalid_transfer' } as const;
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        { id: { in: identifiers } },
        { revenuecatUserId: { in: identifiers } },
      ],
    },
    select: { id: true, revenuecatUserId: true },
  });
  const matches = (user: (typeof users)[number], ids: string[]) =>
    ids.includes(user.id) ||
    (user.revenuecatUserId !== null && ids.includes(user.revenuecatUserId));
  const target =
    users.find((user) => to.includes(user.id)) ??
    users.find((user) => matches(user, to));
  const sourceUserIds = [
    ...new Set(
      users.filter((user) => matches(user, from)).map((user) => user.id),
    ),
  ];
  if (!sourceUserIds.length) return { ignored: 'unknown_transfer_source' };

  if (target && !target.revenuecatUserId && to.includes(target.id)) {
    await db.user.update({
      where: { id: target.id },
      data: { revenuecatUserId: target.id },
    });
  }

  const subscriptions = await db.subscription.findMany({
    where: { platform: 'REVENUECAT', userId: { in: sourceUserIds } },
  });
  if (!subscriptions.length) return { ignored: 'no_transfer_subscriptions' };

  const now = new Date();
  for (const subscription of subscriptions) {
    if (isStale(event, subscription.metadata)) continue;
    const status = target ? subscription.status : ('EXPIRED' as const);
    const record = await db.subscription.update({
      where: { id: subscription.id },
      data: target
        ? {
            userId: target.id,
            metadata: eventMetadata(event, subscription.metadata),
          }
        : {
            status,
            currentPeriodEnd: now,
            gracePeriodEnd: null,
            metadata: eventMetadata(event, subscription.metadata),
          },
    });
    await createAuditEvent({
      event,
      subscriptionId: record.id,
      externalEventId:
        subscriptions.length === 1 ? event.id : `${event.id}:${record.id}`,
      eventType: 'TRANSFERRED',
      previousStatus: subscription.status,
      newStatus: status,
    });
  }

  return {
    transferred: subscriptions.length,
    targetUserId: target?.id ?? null,
  } as const;
};

const syncTemporaryEntitlement = async (event: RevenueCatEvent) => {
  const appUserId = event.app_user_id;
  if (!appUserId || appUserId.startsWith('$RCAnonymousID:')) {
    return { ignored: 'anonymous_user' } as const;
  }
  const user = await db.user.findFirst({
    where: { OR: [{ id: appUserId }, { revenuecatUserId: appUserId }] },
    select: { id: true, revenuecatUserId: true },
  });
  if (!user) return { ignored: 'unknown_user' } as const;
  if (!user.revenuecatUserId) {
    await db.user.update({
      where: { id: user.id },
      data: { revenuecatUserId: appUserId },
    });
  }

  const startedAt = dateFromMs(event.event_timestamp_ms) ?? new Date();
  const currentPeriodEnd =
    dateFromMs(event.expiration_at_ms) ??
    new Date(startedAt.getTime() + 24 * 60 * 60 * 1000);
  const externalId = `rc:temporary:${user.id}`;
  const existing = await db.subscription.findUnique({ where: { externalId } });
  if (existing && isStale(event, existing.metadata)) {
    return { ignored: 'stale_event' } as const;
  }
  const record = await db.subscription.upsert({
    where: { externalId },
    create: {
      userId: user.id,
      platform: 'REVENUECAT',
      externalId,
      planName: 'PRO',
      billingPeriod: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: startedAt,
      currentPeriodEnd,
      metadata: {
        ...eventMetadata(event, null),
        temporaryEntitlement: true,
      },
    },
    update: {
      userId: user.id,
      status: 'ACTIVE',
      currentPeriodStart: startedAt,
      currentPeriodEnd,
      metadata: {
        ...eventMetadata(event, existing?.metadata),
        temporaryEntitlement: true,
      },
    },
  });
  await createAuditEvent({
    event,
    subscriptionId: record.id,
    eventType: 'SUBSCRIPTION_STARTED',
    previousStatus: existing?.status ?? null,
    newStatus: 'ACTIVE',
  });
  return { subscriptionId: record.id, temporary: true } as const;
};

/** Normalize a verified RevenueCat lifecycle event into the shared DB model. */
export async function syncRevenueCatEvent(event: RevenueCatEvent) {
  if (event.type === 'TRANSFER') return syncTransfer(event);
  if (event.type === 'TEMPORARY_ENTITLEMENT_GRANT') {
    if (!hasProductSignal(event) || !isProProduct(event)) {
      return { ignored: 'non_pro_product' } as const;
    }
    return syncTemporaryEntitlement(event);
  }
  if (!event.app_user_id || event.app_user_id.startsWith('$RCAnonymousID:')) {
    return { ignored: 'anonymous_user' } as const;
  }

  const user = await db.user.findFirst({
    where: {
      OR: [{ id: event.app_user_id }, { revenuecatUserId: event.app_user_id }],
    },
    select: { id: true, revenuecatUserId: true },
  });
  if (!user) return { ignored: 'unknown_user' } as const;

  const transactionId =
    event.original_transaction_id ?? event.transaction_id ?? null;
  const existing =
    (transactionId
      ? await db.subscription.findUnique({
          where: { externalId: transactionId },
        })
      : null) ??
    (await db.subscription.findFirst({
      where: { userId: user.id, platform: 'REVENUECAT' },
      orderBy: { updatedAt: 'desc' },
    }));

  const status = mapStatus(event, existing?.status);
  const auditType = mapEventType(event);
  if (!status || !auditType) return { ignored: event.type } as const;
  if (
    (hasProductSignal(event) && !isProProduct(event)) ||
    (!hasProductSignal(event) && !existing)
  ) {
    return { ignored: 'non_pro_product' } as const;
  }
  if (existing && isStale(event, existing.metadata)) {
    return { ignored: 'stale_event' } as const;
  }

  if (!user.revenuecatUserId) {
    await db.user.update({
      where: { id: user.id },
      data: { revenuecatUserId: event.app_user_id },
    });
  }

  const purchasedAt =
    dateFromMs(event.purchased_at_ms) ??
    existing?.currentPeriodStart ??
    new Date();
  const currentPeriodEnd =
    dateFromMs(event.expiration_at_ms) ?? existing?.currentPeriodEnd ?? null;
  if (!currentPeriodEnd) {
    return { ignored: 'missing_expiration' } as const;
  }

  const productId =
    event.type === 'PRODUCT_CHANGE'
      ? (event.new_product_id ?? event.product_id)
      : (event.product_id ?? existing?.storeProductId);
  const billingPeriod = productId
    ? /annual|year/.test(productId.toLowerCase())
      ? ('ANNUAL' as const)
      : ('MONTHLY' as const)
    : (existing?.billingPeriod ?? ('MONTHLY' as const));
  const externalId = existing?.externalId ?? transactionId ?? `rc:${user.id}`;
  const gracePeriodEnd =
    event.type === 'BILLING_ISSUE'
      ? (dateFromMs(event.grace_period_expiration_at_ms) ??
        existing?.gracePeriodEnd)
      : null;
  const cancelledAt =
    event.type === 'CANCELLATION'
      ? (dateFromMs(event.event_timestamp_ms) ?? new Date())
      : event.type === 'UNCANCELLATION' ||
          event.type === 'RENEWAL' ||
          event.type === 'REFUND_REVERSED' ||
          event.type === 'INITIAL_PURCHASE' ||
          event.type === 'PRODUCT_CHANGE'
        ? null
        : existing?.cancelledAt;

  const record = await db.subscription.upsert({
    where: { externalId },
    create: {
      userId: user.id,
      platform: 'REVENUECAT',
      externalId,
      planName: 'PRO',
      billingPeriod,
      status,
      currentPeriodStart: purchasedAt,
      currentPeriodEnd,
      trialStart: event.period_type === 'TRIAL' ? purchasedAt : null,
      trialEnd: event.period_type === 'TRIAL' ? currentPeriodEnd : null,
      cancelledAt,
      gracePeriodEnd,
      storeProductId: productId,
      metadata: eventMetadata(event, null),
    },
    update: {
      userId: user.id,
      platform: 'REVENUECAT',
      planName: 'PRO',
      billingPeriod,
      status,
      currentPeriodStart: purchasedAt,
      currentPeriodEnd,
      trialStart:
        event.period_type === 'TRIAL'
          ? (existing?.trialStart ?? purchasedAt)
          : existing?.trialStart,
      trialEnd:
        event.period_type === 'TRIAL' ? currentPeriodEnd : existing?.trialEnd,
      cancelledAt,
      gracePeriodEnd,
      storeProductId: productId,
      metadata: eventMetadata(event, existing?.metadata),
    },
  });

  await createAuditEvent({
    event,
    subscriptionId: record.id,
    eventType: auditType,
    previousStatus: existing?.status ?? null,
    newStatus: status,
  });

  return { subscriptionId: record.id } as const;
}
