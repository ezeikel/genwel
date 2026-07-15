import * as WebBrowser from 'expo-web-browser';
import { apiFetch } from '@/lib/api';

export type BankConnectResult = 'success' | 'cancelled' | 'failed';

export type BankProvider = {
  id: string;
  name: string;
  logoUrl: string | null;
  country: string;
};

export type BankProvidersResponse = { providers: BankProvider[] };

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
