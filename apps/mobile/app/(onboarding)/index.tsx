import { useLocalSearchParams, useRouter } from 'expo-router';
import { IntroCarousel } from '@/components/onboarding/IntroCarousel';
import { useOnboarding } from '@/lib/onboarding';

export default function OnboardingIntro() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const setStage = useOnboarding((state) => state.setStage);
  const isPreview = preview === 'true';

  const showPaywall = async () => {
    if (isPreview) {
      router.back();
      return;
    }
    await setStage('paywall');
    router.replace({ pathname: '/paywall', params: { source: 'onboarding' } });
  };

  return (
    <IntroCarousel preview={isPreview} onComplete={() => void showPaywall()} />
  );
}
