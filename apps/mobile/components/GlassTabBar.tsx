import {
  faArrowRightArrowLeft,
  faBuildingColumns,
  faHouse,
  faMessages,
  faRepeat,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMoreSheetOpen } from '@/lib/more-sheet-state';

/**
 * Extra scroll padding (bar height + breathing room) so list content can clear
 * the absolute-positioned floating tab bar. Pair with safe-area bottom.
 */
export const FLOATING_TAB_BAR_SCROLL_PAD = 84;

type TabRoute = { key: string; name: string };
export type GlassTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
  };
};

const TABS = [
  { name: 'index', label: 'Overview', icon: faHouse },
  { name: 'accounts', label: 'Accounts', icon: faBuildingColumns },
  {
    name: 'transactions',
    label: 'Transactions',
    icon: faArrowRightArrowLeft,
  },
  { name: 'subscriptions', label: 'Subscriptions', icon: faRepeat },
  { name: 'ask', label: 'Ask', icon: faMessages },
] as const;

const LIQUID_GLASS = isLiquidGlassAvailable();

export const GlassTabBar = ({ state, navigation }: GlassTabBarProps) => {
  const insets = useSafeAreaInsets();
  const moreOpen = useMoreSheetOpen((s) => s.open);
  const focusedName = state.routes[state.index]?.name;

  // MoreSheet is mounted inside each tab screen, under this absolute bar. Hide
  // the bar while More is open so sheet footer actions stay tappable.
  if (moreOpen) return null;

  const items = TABS.map((tab) => {
    const focused = focusedName === tab.name;
    const route = state.routes.find((item) => item.name === tab.name);
    const colour = focused ? '#1a5a5a' : '#71827f';
    return (
      <Pressable
        key={tab.name}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={() => {
          if (focused || !route) return;
          void Haptics.selectionAsync();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) navigation.navigate(tab.name);
        }}
        style={styles.item}
      >
        <View style={[styles.icon, focused && styles.iconActive]}>
          <FontAwesomeIcon icon={tab.icon} size={19} color={colour} />
        </View>
        <Text
          style={[styles.label, { color: colour }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}
    >
      {LIQUID_GLASS ? (
        <GlassView style={styles.bar} glassEffectStyle="regular" isInteractive>
          {items}
        </GlassView>
      ) : (
        <BlurView intensity={42} tint="light" style={styles.bar}>
          <View pointerEvents="none" style={styles.wash} />
          {items}
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  bar: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 7,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 90, 90, 0.14)',
    shadowColor: '#123f3f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(250, 249, 247, 0.78)',
  },
  item: { flex: 1, alignItems: 'center', gap: 1, paddingVertical: 1 },
  icon: {
    width: 42,
    height: 31,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: 'rgba(26, 90, 90, 0.10)' },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9.5,
    letterSpacing: 0.1,
  },
});

export default GlassTabBar;
