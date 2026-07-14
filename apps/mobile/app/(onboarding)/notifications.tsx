import { faBell } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GenwelLogo } from '@/components/Logo';
import { PrimaryButton } from '@/components/ui';
import { requestNotificationPermission } from '@/lib/notifications';

export default function NotificationsOnboarding() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = () => router.replace('/paywall');

  const enable = async () => {
    setBusy(true);
    try {
      await requestNotificationPermission();
    } finally {
      setBusy(false);
      next();
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#faf9f7',
        paddingHorizontal: 24,
        paddingVertical: 16,
      }}
    >
      <GenwelLogo />
      <View className="flex-1 justify-center">
        <View className="h-24 w-24 items-center justify-center rounded-[30px] bg-accent/15">
          <FontAwesomeIcon icon={faBell} size={40} color="#d4a03c" />
        </View>
        <Text className="mt-8 font-sans-bold text-[34px] leading-[40px] tracking-[-1.4px] text-foreground">
          A useful nudge, never noise.
        </Text>
        <Text className="mt-3 font-sans text-[16px] leading-6 text-muted-foreground">
          Get a reminder before a detected subscription renews. You can change
          this any time.
        </Text>
        <View className="mt-7 rounded-3xl border border-border bg-card p-5">
          <Text className="font-sans-semibold text-[15px] text-foreground">
            “Netflix renews tomorrow”
          </Text>
          <Text className="mt-1 font-sans text-[13px] text-muted-foreground">
            Expected payment: £10.99
          </Text>
        </View>
      </View>
      <View className="gap-3 pb-2">
        <PrimaryButton label="Turn on reminders" onPress={enable} busy={busy} />
        <PrimaryButton label="Maybe later" secondary onPress={next} />
      </View>
    </SafeAreaView>
  );
}
