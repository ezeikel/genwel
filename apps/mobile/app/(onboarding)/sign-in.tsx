import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GenwelLogo } from '@/components/Logo';
import { SignInButtons } from '@/components/sign-in-buttons';
import { useOnboarding } from '@/lib/onboarding';

export default function SignInScreen() {
  const router = useRouter();
  const onboardingComplete = useOnboarding((state) => state.complete);
  const setStage = useOnboarding((state) => state.setStage);

  const continueAfterSignIn = async () => {
    if (onboardingComplete) {
      router.replace('/(tabs)');
      return;
    }
    await setStage('connect');
    router.replace('/(onboarding)/connect');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf9f7' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        >
          <GenwelLogo />
          <View className="flex-1 justify-center py-10">
            <Text className="font-sans-bold text-[34px] leading-[40px] tracking-[-1.4px] text-foreground">
              Your money, in one place.
            </Text>
            <Text className="mt-3 font-sans text-[16px] leading-6 text-muted-foreground">
              Sign in securely, then connect the accounts you want Genwel to
              understand.
            </Text>
            <View className="mt-9">
              <SignInButtons captureName onSignedIn={continueAfterSignIn} />
            </View>
          </View>
          <Text className="text-center font-sans text-[11px] leading-4 text-muted-foreground">
            Genwel uses read-only bank connections. We never move your money.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
