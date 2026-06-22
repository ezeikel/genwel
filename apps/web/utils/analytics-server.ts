import { getPostHogClient, shutdownPostHog } from '@/lib/posthog-server';

type EventProperties = Record<string, unknown>;

export async function track(
  eventName: string,
  properties?: EventProperties,
): Promise<void> {
  const posthog = getPostHogClient();

  const enrichedProperties = {
    ...properties,
    environment: process.env.NODE_ENV,
    source: 'server',
  };

  posthog.capture({
    distinctId: 'server',
    event: eventName,
    properties: enrichedProperties,
  });

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[Analytics Server]', eventName, enrichedProperties);
  }

  // Ensure the event is sent before the function completes
  await shutdownPostHog();
}

export async function trackWithUser(
  userId: string,
  eventName: string,
  properties?: EventProperties,
): Promise<void> {
  const posthog = getPostHogClient();

  const enrichedProperties = {
    ...properties,
    userId,
    environment: process.env.NODE_ENV,
    source: 'server',
  };

  posthog.capture({
    distinctId: userId,
    event: eventName,
    properties: enrichedProperties,
  });

  if (process.env.NODE_ENV === 'development') {
    console.info('[Analytics Server]', eventName, enrichedProperties);
  }

  await shutdownPostHog();
}
