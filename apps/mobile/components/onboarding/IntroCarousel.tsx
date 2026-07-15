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
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GenwelLogo } from '@/components/Logo';
import { AskGenwelPreview } from '@/components/onboarding/AskGenwelPreview';
import { SpendingBreakdownPreview } from '@/components/onboarding/SpendingBreakdownPreview';
import { SpendingTrendPreview } from '@/components/onboarding/SpendingTrendPreview';

const SLIDES = [
  {
    key: 'breakdown',
    kicker: 'Spending, decoded',
    title: 'See where it went.',
    body: 'Tap a category and turn one big total into something you can actually understand.',
    cta: 'Show me the patterns',
  },
  {
    key: 'patterns',
    kicker: 'Patterns, not noise',
    title: 'Catch the change early.',
    body: 'Switch views or hold and drag across the chart to inspect any month.',
    cta: 'Try Ask Genwel',
  },
  {
    key: 'ask',
    kicker: 'Answers from your money',
    title: 'Ask. Get a straight answer.',
    body: 'Try a question and see how Genwel turns account activity into a clear explanation.',
    cta: 'Get started',
  },
] as const;

type SlideItem = (typeof SLIDES)[number];

const Preview = ({ slide, active }: { slide: SlideItem; active: boolean }) => {
  switch (slide.key) {
    case 'breakdown':
      return <SpendingBreakdownPreview />;
    case 'patterns':
      return <SpendingTrendPreview active={active} />;
    default:
      return <AskGenwelPreview />;
  }
};

const Slide = ({
  item,
  index,
  width,
  height,
  offset,
  active,
}: {
  item: SlideItem;
  index: number;
  width: number;
  height: number;
  offset: SharedValue<number>;
  active: boolean;
}) => {
  const compact = height < 760;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      offset.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          offset.value,
          [(index - 1) * width, index * width, (index + 1) * width],
          [0.94, 1, 0.94],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[{ width }, style]} className="flex-1 px-5">
      <View className={`flex-1 justify-center ${compact ? 'py-1' : 'py-3'}`}>
        <Preview slide={item} active={active} />

        <Text
          className={`${compact ? 'mt-4' : 'mt-6'} font-sans-bold text-[10px] uppercase tracking-[2px] text-accent`}
        >
          {item.kicker}
        </Text>
        <Text
          className={`${compact ? 'mt-1.5 text-[27px] leading-[32px]' : 'mt-2 text-[30px] leading-[36px]'} font-sans-bold tracking-[-1.1px] text-foreground`}
        >
          {item.title}
        </Text>
        <Text
          className={`${compact ? 'mt-1.5 text-[13px] leading-5' : 'mt-2 text-[14px] leading-[21px]'} font-sans text-muted-foreground`}
        >
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

export const IntroCarousel = ({
  onComplete,
  preview = false,
}: {
  onComplete: () => void;
  preview?: boolean;
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ref = useRef<Animated.ScrollView>(null);
  const offset = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const actionLabel =
    preview && last ? 'Back to Genwel' : (SLIDES[index]?.cta ?? 'Next');

  const onScroll = useAnimatedScrollHandler((event) => {
    offset.value = event.contentOffset.x;
  });
  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.max(
        0,
        Math.min(
          SLIDES.length - 1,
          Math.round(event.nativeEvent.contentOffset.x / width),
        ),
      );
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
          accessibilityLabel={
            preview ? 'Close introduction' : 'Skip introduction'
          }
          hitSlop={12}
          className="px-2 py-2"
        >
          <Text className="font-sans-semibold text-[14px] text-muted-foreground">
            {preview ? 'Close' : 'Skip'}
          </Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        bounces={false}
        directionalLockEnabled
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
            height={height}
            offset={offset}
            active={slideIndex === index}
          />
        ))}
      </Animated.ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-6">
        <View className="mb-4 flex-row justify-center gap-1.5">
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
          accessibilityLabel={actionLabel}
          className="items-center rounded-2xl bg-primary px-6 py-4 active:bg-teal-deep"
        >
          <Text className="font-sans-bold text-[16px] text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
        <Text className="mt-3 text-center font-sans text-[11px] text-muted-foreground">
          General information, not regulated financial advice.
        </Text>
      </View>
    </View>
  );
};
