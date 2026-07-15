import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StateView } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';

export default function BankConnectReturn() {
  const router = useRouter();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const complete = useOnboarding((state) => state.complete);
  const setStage = useOnboarding((state) => state.setStage);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        void (async () => {
          if (status === 'success') {
            if (!complete) await setStage('notifications');
            router.replace(
              complete ? '/(tabs)/accounts' : '/(onboarding)/notifications',
            );
          } else {
            router.replace(
              complete ? '/(tabs)/accounts' : '/(onboarding)/connect',
            );
          }
        })(),
      400,
    );
    return () => clearTimeout(timer);
  }, [complete, router, setStage, status]);

  return (
    <StateView
      loading
      title={status === 'success' ? 'Bank connected' : 'Returning to Genwel'}
    />
  );
}
