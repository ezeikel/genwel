import {
  faArrowTrendDown,
  faCalendarDay,
  faCommentDots,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

const QUESTIONS = [
  {
    prompt: 'Where did I overspend?',
    title: 'Eating out is the outlier.',
    detail:
      'It is £94 above your 3-month average, while groceries came in £28 lower.',
    icon: faArrowTrendDown,
    bars: [
      { label: 'Eating out', value: '£364', width: '88%', color: '#d4a03c' },
      { label: 'Usual', value: '£270', width: '65%', color: '#9bb2af' },
    ],
  },
  {
    prompt: 'What renews next?',
    title: 'Adobe renews in 4 days.',
    detail: '£19.97 on 18 July, then Netflix at £10.99 on 22 July.',
    icon: faCalendarDay,
    bars: [
      { label: 'Adobe', value: '18 Jul', width: '82%', color: '#4f8f9b' },
      { label: 'Netflix', value: '22 Jul', width: '58%', color: '#9f7bb8' },
    ],
  },
  {
    prompt: 'What is left after bills?',
    title: 'About £426 until payday.',
    detail:
      'That uses this example’s upcoming bills and current category budgets.',
    icon: faCommentDots,
    bars: [
      { label: 'Available', value: '£426', width: '72%', color: '#16825d' },
      { label: 'Buffer', value: '£120', width: '28%', color: '#9bb2af' },
    ],
  },
] as const;

export const AskGenwelPreview = () => {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const question = QUESTIONS[active];

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const ask = (index: number) => {
    void Haptics.selectionAsync();
    if (timer.current) clearTimeout(timer.current);
    setActive(index);
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      timer.current = null;
    }, 520);
  };

  return (
    <View
      className="overflow-hidden rounded-[30px] border border-border bg-card"
      style={{
        shadowColor: '#123f3f',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.12,
        shadowRadius: 26,
      }}
    >
      <View className="flex-row items-center border-b border-border bg-muted/65 px-4 py-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <FontAwesomeIcon icon={faCommentDots} size={17} color="#faf9f7" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-sans-bold text-[13px] text-foreground">
            Ask Genwel
          </Text>
          <View className="mt-0.5 flex-row items-center">
            <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
            <Text className="font-sans text-[9px] text-muted-foreground">
              Example data
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pb-4 pt-3">
        <View className="items-end">
          <Animated.View
            key={question.prompt}
            entering={FadeInRight.duration(220)}
            className="max-w-[86%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5"
          >
            <Text className="font-sans-medium text-[11px] text-primary-foreground">
              {question.prompt}
            </Text>
          </Animated.View>
        </View>

        <View className="mt-2 min-h-[126px] rounded-2xl rounded-tl-md bg-muted p-3.5">
          {loading ? (
            <Animated.View
              entering={FadeIn.duration(160)}
              className="flex-1 items-center justify-center"
              accessibilityLiveRegion="polite"
            >
              <View className="flex-row gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <Animated.View
                    key={dot}
                    entering={FadeIn.duration(180).delay(dot * 90)}
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                ))}
              </View>
              <Text className="mt-2 font-sans-medium text-[10px] text-muted-foreground">
                Checking the example…
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              key={question.title}
              entering={FadeIn.duration(240)}
              accessibilityLiveRegion="polite"
            >
              <View className="flex-row items-center">
                <FontAwesomeIcon
                  icon={question.icon}
                  size={16}
                  color="#1a5a5a"
                />
                <Text className="ml-2 flex-1 font-sans-bold text-[12px] text-foreground">
                  {question.title}
                </Text>
              </View>
              <Text className="mt-1.5 font-sans text-[10px] leading-[15px] text-muted-foreground">
                {question.detail}
              </Text>
              <View className="mt-2.5 gap-1.5">
                {question.bars.map((bar, index) => (
                  <Animated.View
                    key={bar.label}
                    entering={FadeInRight.duration(240).delay(index * 70)}
                    className="flex-row items-center"
                  >
                    <Text className="w-[66px] font-sans-medium text-[9px] text-muted-foreground">
                      {bar.label}
                    </Text>
                    <View className="mr-2 h-1.5 flex-1 overflow-hidden rounded-full bg-card">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: bar.width,
                          backgroundColor: bar.color,
                        }}
                      />
                    </View>
                    <Text className="w-[40px] text-right font-sans-bold text-[9px] text-foreground">
                      {bar.value}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>

        <Text className="mb-2 mt-3 font-sans-semibold text-[9px] uppercase tracking-[0.8px] text-muted-foreground">
          Try another question
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {QUESTIONS.map((item, index) => {
            const selected = active === index;
            return (
              <Pressable
                key={item.prompt}
                onPress={() => ask(index)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`rounded-full border px-2.5 py-1.5 ${
                  selected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  className={`font-sans-semibold text-[9px] ${
                    selected ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {item.prompt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};
