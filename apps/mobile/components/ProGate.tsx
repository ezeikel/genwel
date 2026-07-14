import { faSparkles } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/ui';

export const ProGate = ({ title, body }: { title: string; body: string }) => {
  const router = useRouter();
  return (
    <View className="rounded-3xl border border-accent/30 bg-accent/10 p-6">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
        <FontAwesomeIcon icon={faSparkles} size={23} color="#b87816" />
      </View>
      <Text className="mt-5 font-sans-bold text-[20px] tracking-[-0.4px] text-foreground">
        {title}
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-5 text-muted-foreground">
        {body}
      </Text>
      <View className="mt-5">
        <PrimaryButton
          label="Explore Pro"
          onPress={() => router.push('/paywall')}
        />
      </View>
    </View>
  );
};
