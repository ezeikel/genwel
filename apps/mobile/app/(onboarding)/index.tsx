import { useRouter } from 'expo-router';
import { IntroCarousel } from '@/components/onboarding/IntroCarousel';
import { useOnboarding } from '@/lib/onboarding';

export default function OnboardingIntro() {
  const router = useRouter();
  const setStage = useOnboarding((state) => state.setStage);

  const showPaywall = async () => {
    await setStage('paywall');
    router.replace({ pathname: '/paywall', params: { source: 'onboarding' } });
  };

  return <IntroCarousel onComplete={() => void showPaywall()} />;
}
