import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInButtons } from '@/components/sign-in-buttons';
import { useSession } from '@/lib/session';

/**
 * Entry screen. While the persisted session hydrates we show a spinner; once
 * hydrated we either show the signed-in home (placeholder until the budgeting
 * screens land) or the sign-in prompt. Genwel is account-based — the app
 * aggregates the signed-in user's accounts, so there's no anonymous mode.
 */
const Entry = () => {
  const { hydrated, user, signOut } = useSession();

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0a0a0a" />
      </View>
    );
  }

  if (user) {
    // Placeholder home — the budgeting / account-aggregation screens land next.
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-between px-6 py-10">
          <View className="mt-8">
            <Text className="text-[28px] font-bold text-neutral-900">
              Welcome back
            </Text>
            <Text className="mt-2 text-[15px] text-neutral-500">
              {user.name}. Your budgeting dashboard is coming soon.
            </Text>
          </View>
          <Text
            onPress={() => {
              void signOut();
            }}
            className="text-center text-[14px] font-semibold text-neutral-400"
          >
            Sign out
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between px-6 py-10">
        <View className="mt-8">
          <Text className="text-[32px] font-bold text-neutral-900">Genwel</Text>
          <Text className="mt-3 text-[16px] leading-6 text-neutral-500">
            Payday budgeting, bills and savings — all your money in one place.
          </Text>
        </View>
        <SignInButtons />
      </View>
    </SafeAreaView>
  );
};

export default Entry;
