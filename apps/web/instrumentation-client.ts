import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsent,
  readAnalyticsConsent,
} from '@/lib/analytics-consent';

// Initialize Sentry
import './sentry.client.config';

let posthogInitialised = false;

function enablePostHog() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  if (posthogInitialised) {
    posthog.opt_in_capturing();
    posthog.capture('$pageview');
    return;
  }

  posthog.init(apiKey, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    persistence: 'localStorage',
    autocapture: false,
    disable_session_recording: true,
    capture_pageview: true,
    capture_pageleave: true,
  });
  posthogInitialised = true;

  Sentry.setTag('posthog_distinct_id', posthog.get_distinct_id());
}

function disablePostHog() {
  if (!posthogInitialised) return;
  posthog.reset();
  posthog.opt_out_capturing();
  Sentry.setTag('posthog_distinct_id', 'disabled');
}

// PostHog uses persistent browser storage, so it starts only after an explicit
// analytics choice. Plausible and Vercel Web Analytics remain cookieless.
if (typeof window !== 'undefined') {
  if (readAnalyticsConsent() === 'analytics') enablePostHog();

  window.addEventListener(ANALYTICS_CONSENT_EVENT, (event) => {
    const choice = (event as CustomEvent<AnalyticsConsent>).detail;
    if (choice === 'analytics') enablePostHog();
    else disablePostHog();
  });
}

export function onRouteError(error: Error) {
  Sentry.captureException(error);
}

// Instrument client-side navigations (required by Sentry SDK v9+)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
