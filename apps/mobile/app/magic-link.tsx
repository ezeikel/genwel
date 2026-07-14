import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

// Redeems a magic-link. The email links to `genwel://magic-link?token=…`, which
// (via the `genwel` URL scheme) opens here. We exchange the one-time token for a
// session token through the session store — which POSTs to
// /api/auth/mobile/magic-link/verify and hydrates /me — then route home.

const MagicLink = () => {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const signIn = useSession((s) => s.signIn);
  const onboardingComplete = useOnboarding((s) => s.complete);
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!token) {
        setFailed(true);
        return;
      }
      try {
        await signIn({ kind: 'magic-link', token });
        router.replace(
          onboardingComplete ? '/(tabs)' : '/(onboarding)/connect',
        );
      } catch {
        setFailed(true);
      }
    })();
  }, [onboardingComplete, token, router, signIn]);

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-8">
      {failed ? (
        <>
          <Text className="text-center text-[18px] font-semibold text-neutral-900">
            Link expired
          </Text>
          <Text className="text-center text-[14px] text-neutral-500">
            This sign-in link is invalid or has already been used. Request a new
            one from the sign-in screen.
          </Text>
          <View className="mt-3 w-full">
            <PrimaryButton
              label="Request another link"
              onPress={() => router.replace('/(onboarding)/sign-in')}
            />
          </View>
        </>
      ) : (
        <>
          <ActivityIndicator color="#0a0a0a" />
          <Text className="text-[14px] text-neutral-500">Signing you in…</Text>
        </>
      )}
    </View>
  );
};

export default MagicLink;
