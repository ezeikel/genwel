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
  if (!native || !apiKey || !userId) return false;
  const Purchases = native.default;

  if (configured) {
    if (configuredUserId !== userId) {
      await Purchases.logIn(userId);
      configuredUserId = userId;
    }
    return true;
  }

  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development';
  if (environment !== 'development' && apiKey.startsWith('test_')) {
    console.error('[purchases] non-development build is using a test key');
  }
  if (__DEV__) Purchases.setLogLevel(native.LOG_LEVEL.DEBUG);

  try {
    await Purchases.configure({ apiKey, appUserID: userId });
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
  } catch (error) {
    console.warn('[purchases] logout failed', error);
  } finally {
    configuredUserId = undefined;
  }
};

export const getOffering = async (): Promise<PurchasesOffering | null> => {
  const Purchases = nativeModule()?.default;
  if (!Purchases) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.all[OFFERING_ID] ?? offerings.current ?? null;
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
