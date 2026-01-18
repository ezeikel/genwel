'use client';

import posthog from 'posthog-js';
import { useCallback } from 'react';

type EventProperties = Record<string, unknown>;

export function useAnalytics() {
  const track = useCallback(
    (eventName: string, properties?: EventProperties) => {
      if (typeof window === 'undefined') return;

      const enrichedProperties = {
        ...properties,
        url: window.location.href,
        environment: process.env.NODE_ENV,
      };

      // PostHog tracking
      posthog.capture(eventName, enrichedProperties);

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventName, enrichedProperties);
      }
    },
    []
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;

      posthog.identify(userId, traits);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Identify', userId, traits);
      }
    },
    []
  );

  return { track, identify };
}
