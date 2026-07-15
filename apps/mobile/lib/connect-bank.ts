import * as WebBrowser from 'expo-web-browser';
import { apiFetch } from '@/lib/api';
import type { AccountsResponse } from '@/lib/types';

export type BankConnectResult = 'success' | 'cancelled' | 'failed';

export type BankProvider = {
  id: string;
  name: string;
  logoUrl: string | null;
  country: string;
};

export type BankProvidersResponse = { providers: BankProvider[] };

/**
 * Reconcile device-local onboarding with the signed-in account. Onboarding is
 * stored on the device, while bank connections belong to the server account,
 * so a fresh install must ask the API before prompting a returning user to
 * connect again.
 */
export const hasConnectedBank = async (token: string): Promise<boolean> => {
  const { connections } = await apiFetch<AccountsResponse>(
    '/api/mobile/accounts',
    { token },
  );
  return connections.length > 0;
};

export const connectBank = async (
  token: string,
  providerId: string,
): Promise<BankConnectResult> => {
  const { url } = await apiFetch<{ url: string }>(
    '/api/mobile/accounts/connect',
    {
      method: 'POST',
      token,
      body: JSON.stringify({ providerId }),
    },
  );
  const result = await WebBrowser.openAuthSessionAsync(
    url,
    'genwel://bank-connect',
  );
  if (result.type !== 'success') return 'cancelled';
  return new URL(result.url).searchParams.get('status') === 'success'
    ? 'success'
    : 'failed';
};
