import { faBuildingColumns, faLock } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GenwelLogo } from '@/components/Logo';
import { PrimaryButton } from '@/components/ui';
import { hasConnectedBank } from '@/lib/connect-bank';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

export default function ConnectOnboarding() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const onboardingComplete = useOnboarding((state) => state.complete);
  const setStage = useOnboarding((state) => state.setStage);
  const [checkingConnections, setCheckingConnections] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      router.replace('/(onboarding)/sign-in');
      return;
    }

    void hasConnectedBank(token)
      .then(async (connected) => {
        if (cancelled) return;
        if (!connected) {
          setCheckingConnections(false);
          return;
        }

        if (onboardingComplete) {
          router.replace('/(tabs)/accounts');
          return;
        }

        await setStage('notifications');
        if (!cancelled) router.replace('/(onboarding)/notifications');
      })
      .catch(() => {
        // A temporary API failure should not block onboarding. The connect
        // action remains available and will surface its own request errors.
        if (!cancelled) setCheckingConnections(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onboardingComplete, router, setStage, token]);

  const showNotifications = async () => {
    await setStage('notifications');
    router.replace('/(onboarding)/notifications');
  };

  const connect = () => {
    if (!token) return router.replace('/(onboarding)/sign-in');
    router.push('/bank-picker');
  };

  if (checkingConnections) {
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
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#1a5a5a" />
          <Text className="font-sans text-[14px] text-muted-foreground">
            Checking your connections…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View className="h-24 w-24 items-center justify-center rounded-[30px] bg-muted">
          <FontAwesomeIcon icon={faBuildingColumns} size={42} color="#1a5a5a" />
        </View>
        <Text className="mt-8 font-sans-bold text-[34px] leading-[40px] tracking-[-1.4px] text-foreground">
          Start with your real picture.
        </Text>
        <Text className="mt-3 font-sans text-[16px] leading-6 text-muted-foreground">
          Connect a UK bank securely to see balances, spending and recurring
          payments together.
        </Text>
        <View className="mt-7 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <FontAwesomeIcon icon={faLock} size={17} color="#1a5a5a" />
          <Text className="flex-1 font-sans text-[13px] leading-5 text-muted-foreground">
            The connection is read-only and handled by TrueLayer. Genwel cannot
            make payments.
          </Text>
        </View>
      </View>
      <View className="gap-3 pb-2">
        <PrimaryButton label="Connect a bank" onPress={connect} />
        <PrimaryButton
          label="I’ll do this later"
          secondary
          onPress={() => void showNotifications()}
        />
      </View>
    </SafeAreaView>
  );
}
