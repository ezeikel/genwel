import {
  faChartMixed,
  faComments,
  faInfinity,
  faLightbulb,
  faXmark,
} from '@fortawesome/pro-duotone-svg-icons';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenwelMark } from '@/components/Logo';
import { toast } from '@/components/ToastViewport';
import { PrimaryButton } from '@/components/ui';
import { usePurchases } from '@/contexts/purchases';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

type Plan = 'annual' | 'monthly';

const freeTrialLabel = (pkg: PurchasesPackage | null, eligible: boolean) => {
  if (!eligible) return null;
  const intro = pkg?.product.introPrice;
  const androidPhase = pkg?.product.defaultOption?.freePhase;
  const units = intro
    ? intro.cycles * intro.periodNumberOfUnits
    : androidPhase
      ? androidPhase.billingPeriod.value * (androidPhase.billingCycleCount ?? 1)
      : 0;
  const unit = intro?.periodUnit ?? androidPhase?.billingPeriod.unit;
  if (!units || (!androidPhase && intro?.price !== 0)) return null;
  switch (unit) {
    case 'DAY':
      return `${units}-day`;
    case 'WEEK':
      return units === 1 ? '7-day' : `${units}-week`;
    case 'MONTH':
      return `${units}-month`;
    case 'YEAR':
      return `${units}-year`;
    default:
      return null;
  }
};

const HeroCard = ({
  icon,
  label,
  x,
  rotation,
  delay,
  centre = false,
}: {
  icon: typeof faComments;
  label: string;
  x: number;
  rotation: string;
  delay: number;
  centre?: boolean;
}) => {
  const scale = useSharedValue(0.65);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(centre ? 1 : 0.86, { damping: 15, stiffness: 170 }),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [centre, delay, opacity, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { rotate: rotation },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={style}
      className={`absolute h-32 w-32 items-center justify-center rounded-3xl border p-4 ${
        centre ? 'z-10 border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      <FontAwesomeIcon
        icon={icon}
        size={28}
        color={centre ? '#faf9f7' : '#1a5a5a'}
      />
      <Text
        className={`mt-3 text-center font-sans-bold text-[12px] leading-4 ${
          centre ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const PlanRow = ({
  title,
  price,
  detail,
  badge,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  detail: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    className={`rounded-2xl border-2 p-4 ${
      selected ? 'border-primary bg-muted' : 'border-border bg-card'
    }`}
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-[16px] text-foreground">
            {title}
          </Text>
          {badge ? (
            <View className="rounded-full bg-accent px-2 py-1">
              <Text className="font-sans-bold text-[10px] uppercase text-accent-foreground">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 font-sans text-[12px] text-muted-foreground">
          {detail}
        </Text>
      </View>
      <Text className="font-sans-bold text-[17px] text-foreground">
        {price}
      </Text>
    </View>
  </Pressable>
);

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const user = useSession((state) => state.user);
  const onboardingComplete = useOnboarding((state) => state.complete);
  const onboardingStage = useOnboarding((state) => state.stage);
  const setOnboardingStage = useOnboarding((state) => state.setStage);
  const {
    annual,
    annualTrialEligible,
    monthly,
    purchase,
    restore,
    ready,
    error,
    retry,
    isPro,
  } = usePurchases();
  const [selected, setSelected] = useState<Plan>('annual');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !annual && monthly) setSelected('monthly');
  }, [annual, monthly, ready]);

  const bodyOpacity = useSharedValue(0);
  const bodyY = useSharedValue(18);
  useEffect(() => {
    bodyOpacity.value = withDelay(180, withTiming(1, { duration: 420 }));
    bodyY.value = withDelay(
      180,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [bodyOpacity, bodyY]);
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyY.value }],
  }));

  const leavePaywall = async () => {
    const inPreAuthOnboarding =
      !onboardingComplete &&
      (source === 'onboarding' || onboardingStage === 'paywall');

    if (inPreAuthOnboarding) {
      if (user) {
        await setOnboardingStage('connect');
        router.replace('/(onboarding)/connect');
      } else {
        await setOnboardingStage('sign-in');
        router.replace('/(onboarding)/sign-in');
      }
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(user ? '/(tabs)' : '/(onboarding)/sign-in');
    }
  };
  const chosen: PurchasesPackage | null =
    selected === 'annual' ? annual : monthly;

  const buy = async () => {
    if (!chosen) {
      toast.info('Store plans aren’t available right now.');
      return;
    }
    setBusy(true);
    try {
      const result = await purchase(chosen);
      if (result.ok) {
        toast.success('Welcome to Genwel Pro.');
        await leavePaywall();
      } else if (!result.cancelled) {
        toast.error('Purchase failed. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const result = await restore();
      if (result.restored) {
        toast.success('Purchases restored.');
        await leavePaywall();
      } else if (result.failed) {
        toast.error("Couldn't reach the store. Please try again.");
      } else {
        toast.info('No purchases to restore.');
      }
    } finally {
      setBusy(false);
    }
  };

  const annualTrial = freeTrialLabel(annual, annualTrialEligible);
  const annualPrice = annual
    ? `${annual.product.priceString}/year`
    : 'Unavailable';
  const monthlyPrice = monthly
    ? `${monthly.product.priceString}/month`
    : 'Unavailable';
  const annualDetail = annual
    ? [
        annualTrial ? `${annualTrial} free trial` : null,
        annual.product.pricePerMonthString
          ? `about ${annual.product.pricePerMonthString}/month`
          : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Annual billing'
    : 'Store plan not loaded';
  const saving =
    annual && monthly && monthly.product.price > 0
      ? Math.round(
          (1 - annual.product.price / (monthly.product.price * 12)) * 100,
        )
      : 0;

  return (
    <View
      className="flex-1 bg-background"
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Pressable
        onPress={() => void leavePaywall()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={14}
        className="absolute right-5 z-20 h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        style={{ top: insets.top + 8 }}
      >
        <FontAwesomeIcon icon={faXmark} size={16} color="#667a78" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="h-44 items-center justify-center">
          <HeroCard
            icon={faChartMixed}
            label="Full trends"
            x={-74}
            rotation="-9deg"
            delay={130}
          />
          <HeroCard
            icon={faInfinity}
            label="Unlimited banks"
            x={74}
            rotation="9deg"
            delay={130}
          />
          <HeroCard
            icon={faComments}
            label="Ask Genwel"
            x={0}
            rotation="0deg"
            delay={0}
            centre
          />
        </View>

        <Animated.View style={bodyStyle}>
          <View className="mt-2 items-center">
            <GenwelMark size={44} />
            <Text className="mt-2 font-sans-bold text-[11px] uppercase tracking-[2.5px] text-accent">
              Genwel Pro
            </Text>
            <Text className="mt-3 text-center font-sans-bold text-[29px] leading-[35px] tracking-[-1px] text-foreground">
              Find more room in your money.
            </Text>
            <Text className="mt-3 text-center font-sans text-[14px] leading-5 text-muted-foreground">
              Keep the free essentials. Upgrade for deeper patterns, every
              fixable problem and unlimited connections.
            </Text>
          </View>

          <View className="mt-6 gap-3 rounded-3xl border border-border bg-card p-5">
            {[
              [faInfinity, 'Unlimited bank connections'],
              [faLightbulb, 'All smart insights and fixable problems'],
              [faChartMixed, 'Budgets, full history and data export'],
              [faComments, 'Ask Genwel about your own money'],
            ].map(([icon, label]) => (
              <View key={String(label)} className="flex-row items-center gap-3">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <FontAwesomeIcon
                    icon={icon as typeof faComments}
                    size={14}
                    color="#1a5a5a"
                  />
                </View>
                <Text className="flex-1 font-sans-medium text-[14px] text-foreground">
                  {String(label)}
                </Text>
                <FontAwesomeIcon icon={faCheck} size={13} color="#16825d" />
              </View>
            ))}
          </View>

          <View className="mt-5 gap-3">
            <PlanRow
              title="Annual"
              price={annualPrice}
              detail={annualDetail}
              badge={saving > 0 ? `Save ${saving}%` : undefined}
              selected={selected === 'annual'}
              onPress={() => setSelected('annual')}
            />
            <PlanRow
              title="Monthly"
              price={monthlyPrice}
              detail="Flexible monthly billing"
              selected={selected === 'monthly'}
              onPress={() => setSelected('monthly')}
            />
          </View>

          <View className="mt-5">
            <PrimaryButton
              label={
                isPro
                  ? 'Continue with Pro'
                  : selected === 'annual'
                    ? annualTrial
                      ? `Start ${annualTrial} free trial`
                      : 'Subscribe annually'
                    : 'Subscribe monthly'
              }
              onPress={isPro ? () => void leavePaywall() : buy}
              busy={busy || !ready}
              disabled={error}
            />
          </View>
          {error ? (
            <Pressable onPress={retry} className="mt-3 items-center py-2">
              <Text className="font-sans-semibold text-[13px] text-primary">
                Couldn’t load plans · Try again
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => void onRestore()}
            disabled={busy}
            className="mt-3 items-center py-2"
          >
            <Text className="font-sans-semibold text-[13px] text-muted-foreground">
              Restore purchases
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void leavePaywall()}
            className="items-center py-2"
          >
            <Text className="font-sans-semibold text-[13px] text-muted-foreground">
              Keep using Free
            </Text>
          </Pressable>

          <Text className="mt-4 text-center font-sans text-[10px] leading-4 text-muted-foreground">
            Subscription renews automatically unless cancelled in your store
            settings.{' '}
            <Text
              onPress={() => Linking.openURL('https://www.genwel.com/terms')}
              className="underline"
            >
              Terms
            </Text>{' '}
            ·{' '}
            <Text
              onPress={() => Linking.openURL('https://www.genwel.com/privacy')}
              className="underline"
            >
              Privacy
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
