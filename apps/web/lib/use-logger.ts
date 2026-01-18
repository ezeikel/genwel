'use client';

/**
 * Client-side logger hook
 *
 * Integrates with PostHog for analytics tracking while providing
 * consistent logging across the client application.
 */

import { usePostHog } from 'posthog-js/react';
import { useMemo } from 'react';
import { createClientLogger, type LogContext } from './logger';

export function useLogger(context?: Partial<LogContext>) {
  const posthog = usePostHog();

  const clientLogger = useMemo(() => {
    return createClientLogger(posthog, context);
  }, [posthog, context]);

  return clientLogger;
}
