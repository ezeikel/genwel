import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

// Initialize Sentry
import './sentry.client.config';

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });

  // Link Sentry and PostHog
  Sentry.setTag('posthog_distinct_id', posthog.get_distinct_id());
}

export function onRouteError(error: Error) {
  Sentry.captureException(error);
}
