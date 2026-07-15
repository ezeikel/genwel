import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { StateView } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

export default function Entry() {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const stage = useOnboarding((state) => state.stage);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage === 'paywall') {
        router.replace({
          pathname: '/paywall',
          params: { source: 'onboarding' },
        });
        return;
      }

      if (!user) {
        router.replace(
          stage === 'intro' ? '/(onboarding)' : '/(onboarding)/sign-in',
        );
      } else if (stage === 'complete') {
        router.replace('/(tabs)');
      } else if (stage === 'notifications') {
        router.replace('/(onboarding)/notifications');
      } else {
        router.replace('/(onboarding)/connect');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [router, stage, user]);

  return (
    <View className="flex-1 bg-background">
      <StateView loading />
    </View>
  );
}
