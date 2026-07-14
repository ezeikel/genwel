import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBasketShopping,
  faFileInvoice,
  faShoppingBag,
  faUtensils,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { money } from '@/lib/format';

type Segment = {
  label: string;
  value: number;
  color: string;
  icon: IconDefinition;
  insight: string;
};

const SEGMENTS: Segment[] = [
  {
    label: 'Groceries',
    value: 486,
    color: '#1a5a5a',
    icon: faBasketShopping,
    insight: '£14 left in a £500 groceries budget',
  },
  {
    label: 'Eating out',
    value: 364,
    color: '#d4a03c',
    icon: faUtensils,
    insight: '18% lower than the month before',
  },
  {
    label: 'Bills',
    value: 318,
    color: '#4f8f9b',
    icon: faFileInvoice,
    insight: '3 recurring payments due next week',
  },
  {
    label: 'Everything else',
    value: 349,
    color: '#9f7bb8',
    icon: faShoppingBag,
    insight: '£42 above your 3-month average',
  },
];

const SIZE = 132;
const CENTRE = SIZE / 2;
const RADIUS = 49;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;
const GAP = 5;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DonutArc = ({
  color,
  dash,
  offset,
  dimmed,
  selected,
  onPress,
}: {
  color: string;
  dash: number;
  offset: number;
  dimmed: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const opacity = useSharedValue(1);
  const strokeWidth = useSharedValue(17);

  useEffect(() => {
    opacity.value = withTiming(dimmed ? 0.22 : 1, { duration: 180 });
    strokeWidth.value = withTiming(selected ? 21 : 17, { duration: 180 });
  }, [dimmed, opacity, selected, strokeWidth]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    strokeWidth: strokeWidth.value,
  }));

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={CENTRE}
      cy={CENTRE}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeDasharray={[dash, CIRCUMFERENCE - dash]}
      strokeDashoffset={-offset}
      transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
      onPress={onPress}
    />
  );
};

export const SpendingBreakdownPreview = () => {
  const [active, setActive] = useState<number | null>(null);
  const total = SEGMENTS.reduce((sum, segment) => sum + segment.value, 0);
  const arcs = useMemo(() => {
    let offset = 0;
    return SEGMENTS.map((segment) => {
      const length = (segment.value / total) * CIRCUMFERENCE;
      const arc = {
        dash: Math.max(1, length - GAP),
        offset,
      };
      offset += length;
      return arc;
    });
  }, [total]);
  const focused = active === null ? null : SEGMENTS[active];

  const select = (index: number) => {
    void Haptics.selectionAsync();
    setActive((current) => (current === index ? null : index));
  };

  return (
    <View
      className="rounded-[30px] border border-border bg-card p-5"
      style={{
        shadowColor: '#123f3f',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.12,
        shadowRadius: 26,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-sans-semibold text-[12px] text-muted-foreground">
            June spending
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[24px] tracking-[-0.8px] text-foreground">
            {money(total, 'GBP', false)}
          </Text>
        </View>
        <View className="rounded-full bg-muted px-3 py-1.5">
          <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-primary">
            Example view
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <View className="relative" style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Circle
              cx={CENTRE}
              cy={CENTRE}
              r={RADIUS}
              fill="none"
              stroke="#edf2f1"
              strokeWidth={17}
            />
            {SEGMENTS.map((segment, index) => (
              <DonutArc
                key={segment.label}
                color={segment.color}
                dash={arcs[index]?.dash ?? 1}
                offset={arcs[index]?.offset ?? 0}
                dimmed={active !== null && active !== index}
                selected={active === index}
                onPress={() => select(index)}
              />
            ))}
          </Svg>
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center px-5"
          >
            <Animated.View
              key={focused?.label ?? 'all'}
              entering={FadeIn.duration(180)}
              className="items-center"
            >
              <Text
                numberOfLines={1}
                className="text-center font-sans-semibold text-[9px] text-muted-foreground"
              >
                {focused?.label ?? 'All spending'}
              </Text>
              <Text className="mt-0.5 font-sans-bold text-[16px] tracking-[-0.5px] text-foreground">
                {money(focused?.value ?? total, 'GBP', false)}
              </Text>
            </Animated.View>
          </View>
        </View>

        <View className="flex-1 gap-1">
          {SEGMENTS.map((segment, index) => {
            const selected = active === index;
            const dimmed = active !== null && !selected;
            return (
              <Pressable
                key={segment.label}
                onPress={() => select(index)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`${segment.label}, ${money(segment.value, 'GBP', false)}, ${Math.round((segment.value / total) * 100)} percent`}
                accessibilityState={{ selected }}
                className={`min-h-9 flex-row items-center rounded-xl px-2 ${
                  selected ? 'bg-muted' : ''
                }`}
                style={{ opacity: dimmed ? 0.45 : 1 }}
              >
                <View
                  className="h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${segment.color}1a` }}
                >
                  <FontAwesomeIcon
                    icon={segment.icon}
                    color={segment.color}
                    size={13}
                  />
                </View>
                <View className="ml-2 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-sans-semibold text-[10px] text-foreground"
                  >
                    {segment.label}
                  </Text>
                  <Text className="font-sans text-[9px] text-muted-foreground">
                    {Math.round((segment.value / total) * 100)}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-4 min-h-10 flex-row items-center rounded-2xl bg-muted px-3.5 py-2.5">
        <View className="mr-2 h-2 w-2 rounded-full bg-accent" />
        <Animated.Text
          key={focused?.insight ?? 'hint'}
          entering={FadeIn.duration(180)}
          className="flex-1 font-sans-medium text-[11px] leading-4 text-foreground"
        >
          {focused?.insight ?? 'Tap a category to explore this example'}
        </Animated.Text>
      </View>
    </View>
  );
};
