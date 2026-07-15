import '../global.css';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Providers from '@/app/providers';
import { ToastViewport } from '@/components/ToastViewport';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const hydrateSession = useSession((state) => state.hydrate);
  const hydrateOnboarding = useOnboarding((state) => state.hydrate);
  const sessionReady = useSession((state) => state.hydrated);
  const onboardingReady = useOnboarding((state) => state.hydrated);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    void hydrateSession();
    void hydrateOnboarding();
  }, [hydrateOnboarding, hydrateSession]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && sessionReady && onboardingReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded, onboardingReady, sessionReady]);

  useEffect(() => {
    const openResponse = (
      response: Notifications.NotificationResponse | null,
    ) => {
      const route = response?.notification.request.content.data?.route;
      if (route === '/(tabs)/subscriptions') router.push(route);
    };
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      openResponse(response);
      if (response) void Notifications.clearLastNotificationResponseAsync();
    });
    return () => subscription.remove();
  }, [router]);

  if ((!fontsLoaded && !fontError) || !sessionReady || !onboardingReady) {
    return null;
  }

  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#faf9f7' },
          animation: 'simple_push',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="magic-link" />
        <Stack.Screen
          name="bank-picker"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="bank-connect" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="insights" />
        <Stack.Screen name="budgets" />
      </Stack>
      <ToastViewport />
    </Providers>
  );
}
