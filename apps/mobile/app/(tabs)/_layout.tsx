import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GlassTabBar, type GlassTabBarProps } from '@/components/GlassTabBar';
import { useSession } from '@/lib/session';

export default function TabsLayout() {
  const router = useRouter();
  const user = useSession((state) => state.user);
  useEffect(() => {
    if (!user) router.replace('/(onboarding)/sign-in');
  }, [router, user]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <GlassTabBar {...(props as unknown as GlassTabBarProps)} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask Genwel' }} />
    </Tabs>
  );
}
