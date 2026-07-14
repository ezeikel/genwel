import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartLine,
  faLayerGroup,
  faWallet,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenwelLogo } from '@/components/Logo';

const SLIDES = [
  {
    key: 'whole-picture',
    icon: faWallet,
    kicker: 'Your whole picture',
    title: 'Every account, one calm view.',
    body: 'See what you have, what you owe and what changed this month without hopping between banking apps.',
    stat: '£12,480',
    detail: 'net worth across 4 accounts',
  },
  {
    key: 'subscriptions',
    icon: faLayerGroup,
    kicker: 'Quiet costs, surfaced',
    title: 'Spot the bills that add up.',
    body: 'Genwel finds recurring payments, upcoming renewals and overlapping services from your real transactions.',
    stat: '£84.60',
    detail: 'recurring each month',
  },
  {
    key: 'payday',
    icon: faChartLine,
    kicker: 'Built around payday',
    title: 'Make a plan you can live with.',
    body: 'Set simple category budgets, follow spending trends and ask clear questions about your own money.',
    stat: '68%',
    detail: 'of this month’s plan remaining',
  },
] as const;

const Slide = ({
  item,
  index,
  width,
  offset,
}: {
  item: (typeof SLIDES)[number];
  index: number;
  width: number;
  offset: SharedValue<number>;
}) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      offset.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          offset.value,
          [(index - 1) * width, index * width, (index + 1) * width],
          [0.92, 1, 0.92],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[{ width }, style]} className="flex-1 px-7">
      <View className="flex-1 justify-center">
        <Animated.View
          entering={FadeIn.duration(500)}
          className="rounded-[32px] border border-border bg-card p-6"
          style={{
            shadowColor: '#123f3f',
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.12,
            shadowRadius: 26,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FontAwesomeIcon icon={item.icon} size={27} color="#1a5a5a" />
            </View>
            <View className="rounded-full bg-accent/15 px-3 py-1.5">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[1px] text-accent-foreground">
                Live view
              </Text>
            </View>
          </View>
          <Text className="mt-8 font-sans-bold text-[36px] tracking-[-1.5px] text-foreground">
            {item.stat}
          </Text>
          <Text className="mt-1 font-sans text-[13px] text-muted-foreground">
            {item.detail}
          </Text>
          <View className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${62 + index * 10}%` }}
            />
          </View>
        </Animated.View>

        <Text className="mt-9 font-sans-bold text-[11px] uppercase tracking-[2px] text-accent">
          {item.kicker}
        </Text>
        <Text className="mt-3 font-sans-bold text-[32px] leading-[38px] tracking-[-1.2px] text-foreground">
          {item.title}
        </Text>
        <Text className="mt-3 font-sans text-[16px] leading-6 text-muted-foreground">
          {item.body}
        </Text>
      </View>
    </Animated.View>
  );
};

const Dot = ({
  index,
  width,
  offset,
}: {
  index: number;
  width: number;
  offset: SharedValue<number>;
}) => {
  const page = useDerivedValue(() => offset.value / Math.max(width, 1));
  const style = useAnimatedStyle(() => {
    const strength = Math.max(0, 1 - Math.abs(page.value - index));
    return {
      width: interpolate(strength, [0, 1], [7, 24]),
      opacity: interpolate(strength, [0, 1], [0.25, 1]),
    };
  });
  return (
    <Animated.View style={style} className="h-2 rounded-full bg-primary" />
  );
};

export const IntroCarousel = ({ onComplete }: { onComplete: () => void }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ref = useRef<Animated.ScrollView>(null);
  const offset = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((event) => {
    offset.value = event.contentOffset.x;
  });
  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== index) void Haptics.selectionAsync();
      setIndex(next);
    },
    [index, width],
  );
  useEffect(() => {
    ref.current?.scrollTo({ x: index * width, animated: false });
  }, [index, width]);

  const next = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (last) return onComplete();
    ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 8 }}
      >
        <GenwelLogo />
        <Pressable
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          hitSlop={12}
          className="px-2 py-2"
        >
          <Text className="font-sans-semibold text-[14px] text-muted-foreground">
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {SLIDES.map((item, slideIndex) => (
          <Slide
            key={item.key}
            item={item}
            index={slideIndex}
            width={width}
            offset={offset}
          />
        ))}
      </Animated.ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-6">
        <View className="mb-5 flex-row justify-center gap-1.5">
          {SLIDES.map((slide, dotIndex) => (
            <Dot
              key={slide.key}
              index={dotIndex}
              width={width}
              offset={offset}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={last ? 'Get started' : 'Next'}
          className="items-center rounded-2xl bg-primary px-6 py-4 active:bg-teal-deep"
        >
          <Text className="font-sans-bold text-[16px] text-primary-foreground">
            {last ? 'Get started' : 'Next'}
          </Text>
        </Pressable>
        <Text className="mt-4 text-center font-sans text-[11px] text-muted-foreground">
          General information, not regulated financial advice.
        </Text>
      </View>
    </View>
  );
};
