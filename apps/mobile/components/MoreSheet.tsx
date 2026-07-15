import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRotateLeft,
  faBell,
  faChartLine,
  faChartPie,
  faChevronRight,
  faCircleInfo,
  faCrown,
  faFileContract,
  faLifeRing,
  faRightFromBracket,
  faShieldHalved,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalBottomSheet } from '@/lib/bottom-sheet';
import { initials } from '@/lib/format';
import { useSession } from '@/lib/session';

const SUPPORT_URL = 'https://www.genwel.com/support';
const PRIVACY_URL = 'https://www.genwel.com/privacy';
const TERMS_URL = 'https://www.genwel.com/terms';

type MoreRow = {
  label: string;
  icon: IconDefinition;
  sublabel?: string;
  action?: () => void;
};

const versionLabel = () => {
  const version =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '0.1.0';
  const build = Application.nativeBuildVersion;
  return build ? `Version ${version} (${build})` : `Version ${version}`;
};

const SheetRow = ({ row, divider }: { row: MoreRow; divider: boolean }) => {
  const content = (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${divider ? 'border-t border-border/70' : ''}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <FontAwesomeIcon icon={row.icon} size={17} color="#1a5a5a" />
      </View>
      <View className="flex-1">
        <Text className="font-sans-semibold text-[14px] text-foreground">
          {row.label}
        </Text>
        {row.sublabel ? (
          <Text className="mt-0.5 font-sans text-[11px] leading-4 text-muted-foreground">
            {row.sublabel}
          </Text>
        ) : null}
      </View>
      {row.action ? (
        <FontAwesomeIcon icon={faChevronRight} size={12} color="#667a78" />
      ) : null}
    </View>
  );

  if (!row.action) return content;

  return (
    <Pressable
      onPress={row.action}
      accessibilityRole="button"
      accessibilityLabel={row.label}
      className="active:opacity-65"
    >
      {content}
    </Pressable>
  );
};

const SheetGroup = ({ title, rows }: { title: string; rows: MoreRow[] }) => (
  <View className="mt-5">
    <Text className="mb-2 px-1 font-sans-semibold text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
      {title}
    </Text>
    <View className="overflow-hidden rounded-3xl border border-border bg-card px-4">
      {rows.map((row, index) => (
        <SheetRow key={row.label} row={row} divider={index > 0} />
      ))}
    </View>
  </View>
);

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
  const openLink = (url: string) => {
    onClose();
    void Linking.openURL(url);
  };
  const featureRows: MoreRow[] = [
    { label: 'Insights', icon: faChartLine, action: () => go('/insights') },
    { label: 'Budgets', icon: faChartPie, action: () => go('/budgets') },
    {
      label: entitlements?.hasAccess ? 'Genwel Pro' : 'Explore Pro',
      icon: faCrown,
      action: () => go('/paywall'),
    },
  ];
  const settingsRows: MoreRow[] = [
    {
      label: 'Notification settings',
      icon: faBell,
      action: () => void Linking.openSettings(),
    },
    {
      label: 'View onboarding',
      sublabel: 'Replay the interactive introduction',
      icon: faArrowRotateLeft,
      action: () => {
        onClose();
        router.push({
          pathname: '/(onboarding)',
          params: { preview: 'true' },
        });
      },
    },
  ];
  const aboutRows: MoreRow[] = [
    {
      label: 'Support',
      icon: faLifeRing,
      action: () => openLink(SUPPORT_URL),
    },
    {
      label: 'Privacy Policy',
      icon: faShieldHalved,
      action: () => openLink(PRIVACY_URL),
    },
    {
      label: 'Terms of Service',
      icon: faFileContract,
      action: () => openLink(TERMS_URL),
    },
    {
      label: 'Genwel',
      sublabel: versionLabel(),
      icon: faCircleInfo,
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
        }}
      >
        <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 18,
          }}
        >
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

          <SheetGroup title="Explore" rows={featureRows} />
          <SheetGroup title="Settings" rows={settingsRows} />
          <SheetGroup title="Help & about" rows={aboutRows} />

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
        </ScrollView>
      </View>
    </ModalBottomSheet>
  );
};
