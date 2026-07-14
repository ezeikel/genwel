import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type GraphPoint, LineGraph } from 'react-native-graph';
import { money } from '@/lib/format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;

const SERIES = {
  all: {
    label: 'All spend',
    values: [1850, 1768, 1810, 1658, 1594, 1517],
    color: '#f4cf7d',
    fill: 'rgba(244,207,125,0.24)',
  },
  flexible: {
    label: 'Flexible',
    values: [680, 642, 704, 598, 544, 486],
    color: '#d4a03c',
    fill: 'rgba(212,160,60,0.26)',
  },
  bills: {
    label: 'Bills',
    values: [802, 815, 810, 826, 824, 830],
    color: '#4f8f9b',
    fill: 'rgba(79,143,155,0.24)',
  },
} as const;

type SeriesKey = keyof typeof SERIES;

export const SpendingTrendPreview = ({ active }: { active: boolean }) => {
  const [seriesKey, setSeriesKey] = useState<SeriesKey>('all');
  const [selected, setSelected] = useState<GraphPoint | null>(null);
  const series = SERIES[seriesKey];
  const points = useMemo<GraphPoint[]>(
    () =>
      series.values.map((value, index) => ({
        date: new Date(2026, index, 1),
        value,
      })),
    [series.values],
  );
  const values = series.values;
  const latest = values[values.length - 1] ?? 0;
  const first = values[0] ?? latest;
  const selectedIndex = selected?.date.getMonth();
  const shownValue = selected?.value ?? latest;
  const shownMonth =
    selectedIndex === undefined ? 'Jun · latest' : MONTHS[selectedIndex];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(45, (max - min) * 0.3);

  const chooseSeries = (key: SeriesKey) => {
    void Haptics.selectionAsync();
    setSelected(null);
    setSeriesKey(key);
  };
  const onPointSelected = useCallback((point: GraphPoint) => {
    setSelected(point);
  }, []);

  return (
    <View
      className="rounded-[30px] bg-primary p-5"
      style={{
        shadowColor: '#123f3f',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-sans-semibold text-[11px] text-primary-foreground/65">
            {shownMonth} · {series.label}
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[28px] tracking-[-1px] text-primary-foreground">
            {money(shownValue, 'GBP', false)}
          </Text>
        </View>
        <View className="items-end rounded-2xl bg-white/10 px-3 py-2">
          <Text className="font-sans-bold text-[12px] text-[#79d7af]">
            {latest <= first ? '↓' : '↑'}{' '}
            {money(Math.abs(latest - first), 'GBP', false)}
          </Text>
          <Text className="mt-0.5 font-sans text-[9px] text-primary-foreground/60">
            since January
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        {(Object.keys(SERIES) as SeriesKey[]).map((key) => {
          const selectedSeries = seriesKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => chooseSeries(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedSeries }}
              className={`rounded-full border px-3 py-1.5 ${
                selectedSeries
                  ? 'border-primary-foreground bg-primary-foreground'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              <Text
                className={`font-sans-semibold text-[10px] ${
                  selectedSeries ? 'text-primary' : 'text-primary-foreground/70'
                }`}
              >
                {SERIES[key].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Spending trend chart. Hold and drag to inspect each month."
        className="mt-3 h-[120px]"
      >
        <LineGraph
          key={`${seriesKey}-${active ? 'active' : 'idle'}`}
          style={{ width: '100%', height: 120 }}
          points={points}
          animated
          color={series.color}
          gradientFillColors={[series.fill, 'rgba(18,63,63,0)']}
          lineThickness={3}
          range={{ y: { min: min - padding, max: max + padding } }}
          verticalPadding={8}
          enableFadeInMask
          enableIndicator
          indicatorPulsating={active}
          enablePanGesture
          panGestureDelay={180}
          onPointSelected={onPointSelected}
          onGestureStart={() => void Haptics.selectionAsync()}
          onGestureEnd={() => setSelected(null)}
          selectionDotShadowColor="#071f1f"
        />
      </View>
      <View className="mt-0.5 flex-row justify-between">
        <Text className="font-sans-medium text-[9px] text-primary-foreground/45">
          Jan
        </Text>
        <Text className="font-sans-medium text-[9px] text-primary-foreground/45">
          Hold + drag to inspect
        </Text>
        <Text className="font-sans-medium text-[9px] text-primary-foreground/45">
          Jun
        </Text>
      </View>

      <View className="mt-3 flex-row items-center rounded-2xl bg-primary-foreground px-3.5 py-3">
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
          <Text className="font-sans-bold text-[15px] text-accent-foreground">
            £
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-sans-bold text-[10px] uppercase tracking-[0.8px] text-accent-foreground">
            Fixable problem · £96/yr
          </Text>
          <Text className="mt-0.5 font-sans-medium text-[10px] leading-4 text-foreground">
            Two streaming services overlap this month.
          </Text>
        </View>
      </View>
    </View>
  );
};
