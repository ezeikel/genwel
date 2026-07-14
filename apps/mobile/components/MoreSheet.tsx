import {
  faBell,
  faChartLine,
  faChartPie,
  faCrown,
  faRightFromBracket,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalBottomSheet } from '@/lib/bottom-sheet';
import { initials } from '@/lib/format';
import { useSession } from '@/lib/session';

export const MoreSheet = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, entitlements, signOut } = useSession();
  const go = (route: '/insights' | '/budgets' | '/paywall') => {
    onClose();
    router.push(route);
  };
  const rows = [
    { label: 'Insights', icon: faChartLine, action: () => go('/insights') },
    { label: 'Budgets', icon: faChartPie, action: () => go('/budgets') },
    {
      label: entitlements?.hasAccess ? 'Genwel Pro' : 'Explore Pro',
      icon: faCrown,
      action: () => go('/paywall'),
    },
    {
      label: 'Notification settings',
      icon: faBell,
      action: () => void Linking.openSettings(),
    },
  ];

  return (
    <ModalBottomSheet
      index={open ? 1 : 0}
      onIndexChange={(index) => {
        if (index === 0) onClose();
      }}
      nativeOverlay
      scrimColor="rgba(18, 63, 63, 0.38)"
    >
      <View
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: '#faf9f7',
          paddingTop: 12,
          paddingBottom: insets.bottom + 18,
        }}
      >
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />
        <View className="px-5">
          <View className="mb-5 flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Text className="font-sans-bold text-[15px] text-primary-foreground">
                {initials(user?.name ?? null, user?.email ?? null)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans-bold text-[16px] text-foreground">
                {user?.name || user?.email?.split('@')[0] || 'Your account'}
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] text-muted-foreground">
                {entitlements?.hasAccess ? 'Pro plan' : 'Free plan'}
              </Text>
            </View>
          </View>

          <View className="overflow-hidden rounded-3xl border border-border bg-card px-4">
            {rows.map((row) => (
              <Pressable
                key={row.label}
                onPress={row.action}
                className="flex-row items-center gap-3 border-b border-border/70 py-4 last:border-b-0"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
                  <FontAwesomeIcon icon={row.icon} size={17} color="#1a5a5a" />
                </View>
                <Text className="flex-1 font-sans-semibold text-[14px] text-foreground">
                  {row.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => {
              onClose();
              void signOut().then(() =>
                router.replace('/(onboarding)/sign-in'),
              );
            }}
            className="mt-4 flex-row items-center justify-center gap-2 py-3"
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              size={15}
              color="#c63f4f"
            />
            <Text className="font-sans-semibold text-[14px] text-destructive">
              Sign out
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalBottomSheet>
  );
};
