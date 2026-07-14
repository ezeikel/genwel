import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { ApiError, apiFetch } from './api';
import { clearRenewalNotifications } from './notifications';
import type { Entitlements } from './types';

/**
 * Auth/session store (account-based — Genwel is a banking/budgeting app, so
 * there's no anonymous mode; you sign in, then it aggregates YOUR accounts).
 *
 * signIn() POSTs the provider id-token / verified magic-link token to
 * /api/auth/mobile/{apple,google,magic-link/verify} (which return a session
 * token), persists it in SecureStore, then GETs /me to hydrate the user.
 */

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type MeResponse = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  entitlements: Entitlements;
  needsName: boolean;
};

const TOKEN_KEY = 'genwel.session.token.v1';

/** Which mobile-auth route a sign-in provider maps to + its token field. */
type SignInProvider =
  | { kind: 'apple'; identityToken: string; name?: string }
  | { kind: 'google'; idToken: string }
  | { kind: 'facebook'; accessToken: string }
  | { kind: 'magic-link'; token: string };

const PROVIDER_PATH: Record<SignInProvider['kind'], string> = {
  apple: '/api/auth/mobile/apple',
  google: '/api/auth/mobile/google',
  facebook: '/api/auth/mobile/facebook',
  'magic-link': '/api/auth/mobile/magic-link/verify',
};

type SessionState = {
  hydrated: boolean;
  token: string | null;
  user: SessionUser | null;
  entitlements: Entitlements | null;
  needsName: boolean;
  /** Load any persisted token on app start, then GET /me to hydrate the user. */
  hydrate: () => Promise<void>;
  /** Exchange a provider token for a session token + hydrate the user. */
  signIn: (provider: SignInProvider) => Promise<void>;
  refresh: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const fetchMe = async (token: string): Promise<MeResponse> => {
  return apiFetch<MeResponse>('/api/auth/mobile/me', { token });
};

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  token: null,
  user: null,
  entitlements: null,
  needsName: false,
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        try {
          const me = await fetchMe(token);
          set({
            token,
            user: me.user,
            entitlements: me.entitlements,
            needsName: me.needsName,
            hydrated: true,
          });
          return;
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            // Keep a potentially valid token through a temporary network/API
            // outage. A later launch or successful sign-in can recover it.
            set({ token, hydrated: true });
            return;
          }
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await clearRenewalNotifications();
        }
      }
      set({
        token: null,
        user: null,
        entitlements: null,
        needsName: false,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  signIn: async (provider) => {
    const body =
      provider.kind === 'magic-link'
        ? { token: provider.token }
        : provider.kind === 'apple'
          ? {
              identityToken: provider.identityToken,
              ...(provider.name ? { name: provider.name } : {}),
            }
          : provider.kind === 'facebook'
            ? { accessToken: provider.accessToken }
            : { idToken: provider.idToken };

    const { sessionToken } = await apiFetch<{ sessionToken: string }>(
      PROVIDER_PATH[provider.kind],
      { method: 'POST', body: JSON.stringify(body) },
    );

    await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
    const me = await fetchMe(sessionToken);
    if (!me) throw new Error('Unable to load your account');
    set({
      token: sessionToken,
      user: me.user,
      entitlements: me.entitlements,
      needsName: me.needsName,
    });
  },
  refresh: async () => {
    const token = useSession.getState().token;
    if (!token) return;
    try {
      const me = await fetchMe(token);
      set({
        user: me.user,
        entitlements: me.entitlements,
        needsName: me.needsName,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await clearRenewalNotifications();
        set({
          token: null,
          user: null,
          entitlements: null,
          needsName: false,
        });
      }
    }
  },
  updateName: async (name) => {
    const token = useSession.getState().token;
    if (!token) throw new Error('Not signed in');
    const { user } = await apiFetch<{ user: SessionUser }>(
      '/api/mobile/profile',
      {
        token,
        method: 'PATCH',
        body: JSON.stringify({ name }),
      },
    );
    set({ user, needsName: false });
  },
  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      clearRenewalNotifications(),
    ]);
    set({
      token: null,
      user: null,
      entitlements: null,
      needsName: false,
    });
  },
}));
