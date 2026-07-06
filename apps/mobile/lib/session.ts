import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { apiFetch } from './api';

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
  name: string;
  email: string | null;
};

type MeResponse = {
  user: { id: string; name: string | null; email: string | null };
};

const TOKEN_KEY = 'genwel.session.token.v1';

/** Which mobile-auth route a sign-in provider maps to + its token field. */
type SignInProvider =
  | { kind: 'apple'; identityToken: string }
  | { kind: 'google'; idToken: string }
  | { kind: 'magic-link'; token: string };

const PROVIDER_PATH: Record<SignInProvider['kind'], string> = {
  apple: '/api/auth/mobile/apple',
  google: '/api/auth/mobile/google',
  'magic-link': '/api/auth/mobile/magic-link/verify',
};

type SessionState = {
  hydrated: boolean;
  token: string | null;
  user: SessionUser | null;
  /** Load any persisted token on app start, then GET /me to hydrate the user. */
  hydrate: () => Promise<void>;
  /** Exchange a provider token for a session token + hydrate the user. */
  signIn: (provider: SignInProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

/** GET /me with a token → SessionUser, or null on any failure. */
const fetchMe = async (token: string): Promise<SessionUser | null> => {
  try {
    const { user } = await apiFetch<MeResponse>('/api/auth/mobile/me', {
      token,
    });
    return {
      id: user.id,
      name: user.name ?? user.email ?? 'Genwel user',
      email: user.email,
    };
  } catch {
    return null;
  }
};

export const useSession = create<SessionState>((set) => ({
  hydrated: false,
  token: null,
  user: null,
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const user = await fetchMe(token);
        if (user) {
          set({ token, user, hydrated: true });
          return;
        }
        // Stale/invalid token — drop it so the entry screen shows sign-in.
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      set({ token: null, user: null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  signIn: async (provider) => {
    const body =
      provider.kind === 'magic-link'
        ? { token: provider.token }
        : provider.kind === 'apple'
          ? { identityToken: provider.identityToken }
          : { idToken: provider.idToken };

    const { sessionToken } = await apiFetch<{ sessionToken: string }>(
      PROVIDER_PATH[provider.kind],
      { method: 'POST', body: JSON.stringify(body) },
    );

    await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
    const user = await fetchMe(sessionToken);
    set({ token: sessionToken, user });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
