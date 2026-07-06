/**
 * Thin client for the Genwel API (app.genwel.com). The mobile app is a client of
 * the web app's routes: it authenticates and reads/writes through the Next.js
 * /api/* handlers. Base URL comes from EXPO_PUBLIC_API_URL (a local/staging
 * override in dev), else the production host.
 */

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_APP_URL ??
  'https://www.genwel.com';

type ApiOptions = {
  method?: string;
  body?: string;
  /** Bearer session token, when the caller already has one in hand. */
  token?: string;
};

/** Fetch + JSON-parse an API route, throwing on a non-2xx response. */
export const apiFetch = async <T>(
  path: string,
  { method = 'GET', body, token }: ApiOptions = {},
): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
};
