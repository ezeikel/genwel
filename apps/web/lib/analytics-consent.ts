export const ANALYTICS_CONSENT_KEY = 'genwel:analytics-consent:v1';
export const ANALYTICS_CONSENT_EVENT = 'genwel:analytics-consent';
export const OPEN_COOKIE_SETTINGS_EVENT = 'genwel:open-cookie-settings';

export type AnalyticsConsent = 'analytics' | 'essential';

type StoredAnalyticsConsent = {
  choice: AnalyticsConsent;
  updatedAt: number;
  version: 1;
};

const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredAnalyticsConsent>;
    const choice: AnalyticsConsent | null =
      stored.choice === 'analytics' || stored.choice === 'essential'
        ? stored.choice
        : null;
    const isCurrent =
      typeof stored.updatedAt === 'number' &&
      Date.now() - stored.updatedAt < CONSENT_MAX_AGE_MS;

    return stored.version === 1 && choice && isCurrent ? choice : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(choice: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;

  const stored: StoredAnalyticsConsent = {
    choice,
    updatedAt: Date.now(),
    version: 1,
  };

  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(stored));
  window.dispatchEvent(
    new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_EVENT, {
      detail: choice,
    }),
  );
}

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
