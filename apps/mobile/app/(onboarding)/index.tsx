import { useRouter } from 'expo-router';
import { IntroCarousel } from '@/components/onboarding/IntroCarousel';

export default function OnboardingIntro() {
  const router = useRouter();
  return (
    <IntroCarousel onComplete={() => router.replace('/(onboarding)/sign-in')} />
  );
}
