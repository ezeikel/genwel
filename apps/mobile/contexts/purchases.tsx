import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { apiFetch } from '@/lib/api';
import {
  buyPackage,
  checkTrialEligibility,
  clearPurchasePendingLink,
  configurePurchases,
  getCustomerInfo,
  getOffering,
  hasPro,
  hasPurchasePendingLink,
  markPurchasePendingLink,
  PACKAGE_IDS,
  packageFrom,
  restore as restoreNative,
} from '@/lib/purchases';
import { useSession } from '@/lib/session';

type PurchaseResult = { ok: boolean; cancelled: boolean };
type PurchasesContextValue = {
  ready: boolean;
  error: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  annualTrialEligible: boolean;
  retry: () => void;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<{ restored: boolean; failed: boolean }>;
};

const Context = createContext<PurchasesContextValue>({
  ready: false,
  error: false,
  isPro: false,
  offering: null,
  monthly: null,
  annual: null,
  annualTrialEligible: false,
  retry: () => undefined,
  purchase: async () => ({ ok: false, cancelled: false }),
  restore: async () => ({ restored: false, failed: true }),
});

const withTimeout = <T,>(promise: Promise<T>, ms = 12_000) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);

const pollServer = async () => {
  for (const delay of [0, 1_500, 2_500, 4_000, 5_000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await useSession.getState().refresh();
    if (useSession.getState().entitlements?.hasAccess) return true;
  }
  return false;
};

const reconcileServer = async () => {
  const token = useSession.getState().token;
  if (!token) return false;
  try {
    await withTimeout(
      apiFetch('/api/mobile/billing/reconcile', {
        method: 'POST',
        token,
      }),
      12_000,
    );
    await useSession.getState().refresh();
    return useSession.getState().entitlements?.hasAccess ?? false;
  } catch (cause) {
    console.warn('[purchases] server reconciliation deferred', cause);
    return false;
  }
};

export const PurchasesProvider = ({ children }: { children: ReactNode }) => {
  const userId = useSession((state) => state.user?.id);
  const sessionToken = useSession((state) => state.token);
  const serverPro = useSession(
    (state) => state.entitlements?.hasAccess ?? false,
  );
  const [localProUserId, setLocalProUserId] = useState<string | null>(null);
  const [anonymousPro, setAnonymousPro] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [annualTrialEligible, setAnnualTrialEligible] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // The retry counter deliberately re-runs this boot sequence.
    void attempt;
    let cancelled = false;
    const boot = async () => {
      setReady(false);
      setError(false);
      setAnnualTrialEligible(false);

      // A persisted token with no hydrated user means /me is temporarily
      // unavailable. Do not switch RevenueCat identities during that outage.
      if (sessionToken && !userId) {
        if (!cancelled) setReady(true);
        return;
      }

      if (userId) {
        // Anonymous access must never bleed into an authenticated session when
        // RevenueCat identity linking fails. Keep the persisted pending-link
        // marker so retry can still merge/restore the purchase later.
        setAnonymousPro(false);
      } else {
        setLocalProUserId(null);
      }
      const configured = await configurePurchases(userId);
      if (!configured) {
        if (!cancelled) {
          setOffering(null);
          setReady(true);
        }
        return;
      }

      try {
        let info = await withTimeout(getCustomerInfo(), 6_000).catch(
          () => null,
        );
        const pendingLink = await hasPurchasePendingLink();

        // An anonymous purchase normally aliases during logIn. If RevenueCat
        // did not merge it, one restore is safe because this flag is written
        // only after a successful purchase on this device.
        if (userId && pendingLink && (!info || !hasPro(info))) {
          info = await withTimeout(restoreNative(), 8_000).catch(() => info);
        }
        if (cancelled) return;

        const active = info ? hasPro(info) : false;
        if (active && userId) {
          setLocalProUserId(userId);
          setAnonymousPro(false);
          if (pendingLink) await clearPurchasePendingLink();
          await reconcileServer();
        } else if (active) {
          setAnonymousPro(true);
          await markPurchasePendingLink();
        } else if (userId) {
          setLocalProUserId(null);
          setAnonymousPro(false);
          // RevenueCat is authoritative during an authenticated boot. Reconcile
          // inactive state too so a missed refund/expiration webhook cannot
          // leave a stale server entitlement unlocked.
          await reconcileServer();
        } else {
          setAnonymousPro(false);
        }
      } catch (cause) {
        console.error('[purchases] customer identity sync failed', cause);
      }

      try {
        const current = await withTimeout(getOffering());
        const annualPackage = packageFrom(current, PACKAGE_IDS.annual);
        const trialEligible = annualPackage
          ? await withTimeout(
              checkTrialEligibility(annualPackage),
              6_000,
            ).catch(() => false)
          : false;

        if (!cancelled) {
          setOffering(current);
          setAnnualTrialEligible(trialEligible);
        }
      } catch (cause) {
        console.error('[purchases] offering failed', cause);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [attempt, sessionToken, userId]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        const info = await buyPackage(pkg);
        const active = hasPro(info);
        if (active && userId) {
          setLocalProUserId(userId);
          await reconcileServer();
        } else if (active) {
          setAnonymousPro(true);
          await markPurchasePendingLink();
        }
        const confirmed = active && userId ? await pollServer() : false;
        return { ok: active || confirmed, cancelled: false };
      } catch (cause) {
        const cancelled = Boolean(
          cause &&
            typeof cause === 'object' &&
            'userCancelled' in cause &&
            (cause as { userCancelled?: boolean }).userCancelled,
        );
        if (!cancelled) console.error('[purchases] purchase failed', cause);
        return { ok: false, cancelled };
      }
    },
    [userId],
  );

  const restore = useCallback(async () => {
    try {
      const info = await restoreNative();
      const active = hasPro(info);
      if (active && userId) {
        setLocalProUserId(userId);
        await reconcileServer();
        await pollServer();
      } else if (active) {
        setAnonymousPro(true);
        await markPurchasePendingLink();
      }
      return { restored: active, failed: false };
    } catch (cause) {
      console.error('[purchases] restore failed', cause);
      return { restored: false, failed: true };
    }
  }, [userId]);

  const localPro =
    (!userId && anonymousPro) || Boolean(userId && localProUserId === userId);

  const value = useMemo(
    () => ({
      ready,
      error,
      isPro: serverPro || localPro,
      offering,
      monthly: packageFrom(offering, PACKAGE_IDS.monthly),
      annual: packageFrom(offering, PACKAGE_IDS.annual),
      annualTrialEligible,
      retry,
      purchase,
      restore,
    }),
    [
      ready,
      error,
      serverPro,
      localPro,
      offering,
      annualTrialEligible,
      retry,
      purchase,
      restore,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const usePurchases = () => useContext(Context);
