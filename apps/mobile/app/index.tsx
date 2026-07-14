import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { StateView } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

export default function Entry() {
  const router = useRouter();
  const user = useSession((state) => state.user);
  const complete = useOnboarding((state) => state.complete);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace(complete ? '/(onboarding)/sign-in' : '/(onboarding)');
      } else if (!complete) {
        router.replace('/(onboarding)/connect');
      } else {
        router.replace('/(tabs)');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [complete, router, user]);

  return (
    <View className="flex-1 bg-background">
      <StateView loading />
    </View>
  );
}
