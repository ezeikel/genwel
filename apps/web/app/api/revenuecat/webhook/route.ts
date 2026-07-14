import { db } from '@genwel/db';
import { timingSafeEqual } from 'crypto';
import {
  type RevenueCatWebhookBody,
  syncRevenueCatEvent,
} from '@/lib/revenuecat-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) {
    return Response.json({ error: 'Not configured' }, { status: 503 });
  }
  const supplied = request.headers.get('authorization') ?? '';
  const valid =
    safeEqual(supplied, expected) || safeEqual(supplied, `Bearer ${expected}`);
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request
    .json()
    .catch(() => null)) as RevenueCatWebhookBody | null;
  const event = body?.event;
  if (!event?.id || !event.type) {
    return Response.json({ error: 'Invalid event' }, { status: 400 });
  }
  if (event.type === 'TEST') {
    return Response.json({ received: true, test: true });
  }

  const processed = await db.webhookEvent.findUnique({
    where: { id: event.id },
    select: { id: true },
  });
  if (processed) {
    return Response.json({ received: true, skipped: true });
  }

  try {
    const result = await syncRevenueCatEvent(event);
    await db.webhookEvent.upsert({
      where: { id: event.id },
      update: {},
      create: {
        id: event.id,
        platform: 'REVENUECAT',
        eventType: event.type,
      },
    });
    return Response.json({ received: true, ...result });
  } catch (error) {
    console.error(`[revenuecat] handler failed for ${event.type}:`, error);
    return Response.json({ error: 'Handler failed' }, { status: 500 });
  }
}
