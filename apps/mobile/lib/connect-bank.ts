import * as WebBrowser from 'expo-web-browser';
import { apiFetch } from '@/lib/api';

export type BankConnectResult = 'success' | 'cancelled' | 'failed';

export const connectBank = async (
  token: string,
): Promise<BankConnectResult> => {
  const { url } = await apiFetch<{ url: string }>(
    '/api/mobile/accounts/connect',
    { method: 'POST', token },
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
