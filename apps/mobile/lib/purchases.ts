import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

type PurchasesModule = typeof import('react-native-purchases');
let cached: PurchasesModule | null | undefined;
let configured = false;
let configuredUserId: string | undefined;
const PENDING_LINK_KEY = 'genwel.purchases.pending-link.v1';

export const PRO_ENTITLEMENT = 'genwel_pro';
export const OFFERING_ID = 'default';
export const PACKAGE_IDS = {
  monthly: '$rc_monthly',
  annual: '$rc_annual',
} as const;

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

const nativeModule = () => {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') {
    cached = null;
    return cached;
  }
  cached = require('react-native-purchases') as PurchasesModule;
  return cached;
};

export const configurePurchases = async (userId?: string) => {
  const native = nativeModule();
  if (!native || !apiKey) return false;
  const Purchases = native.default;

  if (configured) {
    if (configuredUserId !== userId) {
      try {
        if (userId) {
          await Purchases.logIn(userId);
        } else if (configuredUserId) {
          await Purchases.logOut();
        }
        configuredUserId = userId;
      } catch (error) {
        console.error('[purchases] identity switch failed', error);
        return false;
      }
    }
    return true;
  }

  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development';
  if (environment !== 'development' && apiKey.startsWith('test_')) {
    console.error(
      `[purchases] FATAL: ${environment} build is using a RevenueCat Test Store key`,
    );
    return false;
  }
  if (__DEV__) Purchases.setLogLevel(native.LOG_LEVEL.DEBUG);

  try {
    await Purchases.configure({
      apiKey,
      ...(userId ? { appUserID: userId } : {}),
    });
    configured = true;
    configuredUserId = userId;
    return true;
  } catch (error) {
    console.error('[purchases] configure failed', error);
    return false;
  }
};

/** Return RevenueCat to an anonymous customer when the Genwel user signs out. */
export const clearPurchasesUser = async () => {
  if (!configured || !configuredUserId) return;
  const Purchases = nativeModule()?.default;
  if (!Purchases) return;
  try {
    await Purchases.logOut();
    configuredUserId = undefined;
    await AsyncStorage.removeItem(PENDING_LINK_KEY).catch(() => undefined);
  } catch (error) {
    console.warn('[purchases] logout failed', error);
  }
};

export const getOffering = async (): Promise<PurchasesOffering | null> => {
  const Purchases = nativeModule()?.default;
  if (!Purchases) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.all[OFFERING_ID] ?? offerings.current ?? null;
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  const Purchases = nativeModule()?.default;
  if (!Purchases) throw new Error('Purchases are unavailable');
  return Purchases.getCustomerInfo();
};

export const hasPro = (info: CustomerInfo) =>
  info.entitlements.active[PRO_ENTITLEMENT] !== undefined;

export const buyPackage = async (pkg: PurchasesPackage) => {
  const Purchases = nativeModule()?.default;
  if (!Purchases) throw new Error('Purchases are unavailable');
  return (await Purchases.purchasePackage(pkg)).customerInfo;
};

export const restore = async () => {
  const Purchases = nativeModule()?.default;
  if (!Purchases) throw new Error('Purchases are unavailable');
  return Purchases.restorePurchases();
};

export const markPurchasePendingLink = async () => {
  await AsyncStorage.setItem(PENDING_LINK_KEY, 'true').catch((error) => {
    console.warn('[purchases] could not persist pending link', error);
  });
};

export const hasPurchasePendingLink = async () =>
  (await AsyncStorage.getItem(PENDING_LINK_KEY).catch(() => null)) === 'true';

export const clearPurchasePendingLink = async () => {
  await AsyncStorage.removeItem(PENDING_LINK_KEY).catch((error) => {
    console.warn('[purchases] could not clear pending link', error);
  });
};

/**
 * Only advertise a free trial when the store can confirm this account is
 * eligible. RevenueCat's iOS eligibility API deliberately treats UNKNOWN as
 * ineligible; Google exposes the eligible offer through the default option.
 */
export const checkTrialEligibility = async (pkg: PurchasesPackage) => {
  const product = pkg.product;
  if (Platform.OS === 'android') {
    return Boolean(product.defaultOption?.freePhase);
  }
  if (Platform.OS !== 'ios' || product.introPrice?.price !== 0) return false;

  const Purchases = nativeModule()?.default;
  if (!Purchases) return false;
  try {
    const eligibility =
      await Purchases.checkTrialOrIntroductoryPriceEligibility([
        product.identifier,
      ]);
    return (
      eligibility[product.identifier]?.status ===
      Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
    );
  } catch (error) {
    console.warn('[purchases] trial eligibility check failed', error);
    return false;
  }
};

export const packageFrom = (offering: PurchasesOffering | null, id: string) =>
  offering?.availablePackages.find((pkg) => pkg.identifier === id) ?? null;
