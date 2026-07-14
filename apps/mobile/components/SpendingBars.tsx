import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { compactMoney, money } from '@/lib/format';

const Bar = ({
  value,
  max,
  label,
  active,
  index,
}: {
  value: number;
  max: number;
  label: string;
  active: boolean;
  index: number;
}) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(index * 55, withTiming(1, { duration: 480 }));
  }, [index, progress]);
  const style = useAnimatedStyle(() => ({
    height: Math.max(5, (value / Math.max(max, 1)) * 138 * progress.value),
  }));

  return (
    <View className="flex-1 items-center justify-end gap-2">
      <Animated.View
        style={style}
        className={`w-[72%] rounded-t-xl ${active ? 'bg-accent' : 'bg-primary'}`}
      />
      <Text className="font-sans-medium text-[10px] text-muted-foreground">
        {label}
      </Text>
    </View>
  );
};

export const SpendingBars = ({
  data,
}: {
  data: { month: string; total: number }[];
}) => {
  const max = Math.max(...data.map((item) => item.total), 1);
  const average = data.reduce((sum, item) => sum + item.total, 0) / data.length;
  const latest = data[data.length - 1];
  return (
    <View className="rounded-3xl border border-border bg-card p-5">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="font-sans-semibold text-[12px] text-muted-foreground">
            {latest?.month ?? 'This month'} spending
          </Text>
          <Text className="mt-1 font-sans-bold text-[27px] tracking-[-1px] text-foreground">
            {money(latest?.total ?? 0)}
          </Text>
        </View>
        <Text className="font-sans text-[11px] text-muted-foreground">
          avg {compactMoney(average)}/mo
        </Text>
      </View>
      <View className="mt-6 h-40 flex-row items-end">
        {data.map((item, index) => (
          <Bar
            key={`${item.month}-${index}`}
            value={item.total}
            max={max}
            label={item.month}
            active={index === data.length - 1}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};
