/**
 * Thin client for the Genwel API (www.genwel.com). The mobile app is a client of
 * the web app's routes: it authenticates and reads/writes through the Next.js
 * /api/* handlers. Development talks to the local Next.js app (which uses the
 * Neon development branch + TrueLayer sandbox); preview and production talk
 * to the deployed production API.
 */

import { Platform } from 'react-native';

const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development';
const configuredApi =
  process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_APP_URL;
const defaultApi =
  environment === 'development'
    ? 'http://localhost:3000'
    : 'https://www.genwel.com';
const resolvedApi = configuredApi ?? defaultApi;

// Android emulators reach the host machine through 10.0.2.2. iOS Simulator
// shares the Mac's localhost network, so it uses the configured URL verbatim.
export const API_BASE = (
  environment === 'development' && Platform.OS === 'android'
    ? resolvedApi.replace('://localhost', '://10.0.2.2')
    : resolvedApi
).replace(/\/$/, '');

type ApiOptions = Omit<RequestInit, 'headers'> & {
  /** Bearer session token, when the caller already has one in hand. */
  token?: string;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiRequest = async (
  path: string,
  { token, headers, ...options }: ApiOptions = {},
) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

/** Fetch + JSON-parse an API route, throwing on a non-2xx response. */
export const apiFetch = async <T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
  const res = await apiRequest(path, options);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }
  return (await res.json()) as T;
};
