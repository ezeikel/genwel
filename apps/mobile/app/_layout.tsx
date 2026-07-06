import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Toaster } from 'sonner-native';
import Providers from '@/app/providers';
import { useSession } from '@/lib/session';

const RootLayout = () => {
  // Load any persisted session token on launch so the entry screen routes
  // straight to the app instead of flashing the sign-in prompt.
  const hydrate = useSession((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Providers>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="magic-link" />
      </Stack>
      <Toaster position="top-center" />
    </Providers>
  );
};

export default RootLayout;
