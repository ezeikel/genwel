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
import {
  buyPackage,
  checkTrialEligibility,
  clearPurchasesUser,
  configurePurchases,
  getOffering,
  hasPro,
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

export const PurchasesProvider = ({ children }: { children: ReactNode }) => {
  const userId = useSession((state) => state.user?.id);
  const serverPro = useSession(
    (state) => state.entitlements?.hasAccess ?? false,
  );
  const [localProUserId, setLocalProUserId] = useState<string | null>(null);
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
      if (!userId) {
        setLocalProUserId(null);
        await clearPurchasesUser();
        setOffering(null);
        if (!cancelled) setReady(true);
        return;
      }
      const configured = await configurePurchases(userId);
      if (!configured) {
        if (!cancelled) setReady(true);
        return;
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
  }, [userId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        const info = await buyPackage(pkg);
        const active = hasPro(info);
        if (active && userId) setLocalProUserId(userId);
        const confirmed = active ? await pollServer() : false;
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
      if (active && userId) setLocalProUserId(userId);
      if (active) await pollServer();
      return { restored: active, failed: false };
    } catch (cause) {
      console.error('[purchases] restore failed', cause);
      return { restored: false, failed: true };
    }
  }, [userId]);

  const localPro = Boolean(userId && localProUserId === userId);

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
