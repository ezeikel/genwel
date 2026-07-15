import {
  faArrowLeft,
  faBuildingColumns,
  faChevronRight,
  faLock,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from '@/components/ToastViewport';
import { StateView } from '@/components/ui';
import { useMobileData } from '@/hooks/use-mobile-data';
import { ApiError } from '@/lib/api';
import {
  type BankProvider,
  type BankProvidersResponse,
  connectBank,
} from '@/lib/connect-bank';
import { useOnboarding } from '@/lib/onboarding';
import { useSession } from '@/lib/session';

const POPULAR_BANKS = [
  'natwest',
  'halifax',
  'lloyds',
  'barclays',
  'santander',
  'nationwide',
  'hsbc',
  'monzo',
  'starling',
];

const normalized = (value: string) => value.trim().toLocaleLowerCase('en-GB');

const popularRank = (provider: BankProvider) => {
  const name = normalized(provider.name);
  return POPULAR_BANKS.findIndex((bank) => name.includes(bank));
};

type BankSection = { title: string; data: BankProvider[] };

const BankLogo = ({ provider }: { provider: BankProvider }) => {
  const [failed, setFailed] = useState(false);
  return (
    <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
      {provider.logoUrl && !failed ? (
        <Image
          source={{ uri: provider.logoUrl }}
          style={{ width: 34, height: 34 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
          onError={() => setFailed(true)}
        />
      ) : (
        <FontAwesomeIcon icon={faBuildingColumns} size={18} color="#1a5a5a" />
      )}
    </View>
  );
};

const BankRow = ({
  provider,
  selected,
  disabled,
  onPress,
}: {
  provider: BankProvider;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={`Connect ${provider.name}`}
    className={`mx-5 flex-row items-center border-b border-border/70 py-3.5 active:opacity-70 ${
      disabled && !selected ? 'opacity-45' : ''
    }`}
  >
    <BankLogo provider={provider} />
    <Text
      numberOfLines={2}
      className="ml-3 flex-1 font-sans-semibold text-[15px] leading-5 text-foreground"
    >
      {provider.name}
    </Text>
    <View className="h-9 w-9 items-center justify-center">
      {selected ? (
        <ActivityIndicator color="#1a5a5a" />
      ) : (
        <FontAwesomeIcon icon={faChevronRight} size={13} color="#80908e" />
      )}
    </View>
  </Pressable>
);

export default function BankPicker() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const onboardingComplete = useOnboarding((state) => state.complete);
  const setOnboardingStage = useOnboarding((state) => state.setStage);
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<BankProvidersResponse>('/api/mobile/accounts/providers');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) router.replace('/(onboarding)/sign-in');
  }, [router, token]);

  const sections = useMemo<BankSection[]>(() => {
    const providers = data?.providers ?? [];
    const search = normalized(query);
    if (search) {
      return [
        {
          title: 'Search results',
          data: providers.filter(
            (provider) =>
              normalized(provider.name).includes(search) ||
              normalized(provider.id).includes(search),
          ),
        },
      ];
    }

    const popular = providers
      .filter((provider) => popularRank(provider) >= 0)
      .sort((left, right) => popularRank(left) - popularRank(right));
    const all = providers.filter((provider) => popularRank(provider) < 0);
    return [
      { title: 'Popular banks', data: popular },
      { title: 'All banks', data: all },
    ].filter((section) => section.data.length > 0);
  }, [data?.providers, query]);

  const choose = async (provider: BankProvider) => {
    if (!token || selectedId) return;
    setSelectedId(provider.id);
    try {
      const result = await connectBank(token, provider.id);
      if (result === 'success') {
        if (onboardingComplete) {
          toast.success(`${provider.name} connected.`);
          router.dismissTo('/(tabs)/accounts');
        } else {
          await setOnboardingStage('notifications');
          router.replace('/(onboarding)/notifications');
        }
      } else if (result === 'failed') {
        toast.error("We couldn't connect that bank. Please try again.");
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 402) {
        router.push('/paywall');
      } else {
        toast.error(
          cause instanceof Error ? cause.message : 'Connection failed',
        );
      }
    } finally {
      setSelectedId(null);
    }
  };

  const header = (
    <View className="px-5 pb-3">
      <View className="mt-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:bg-muted"
        >
          <FontAwesomeIcon icon={faArrowLeft} size={17} color="#1a5a5a" />
        </Pressable>
        <Text className="font-sans-bold text-[13px] uppercase tracking-[1.6px] text-primary">
          Secure connection
        </Text>
        <View className="h-11 w-11" />
      </View>

      <Text className="mt-7 font-sans-bold text-[32px] leading-[38px] tracking-[-1.2px] text-foreground">
        Choose your bank
      </Text>
      <Text className="mt-2 font-sans text-[14px] leading-5 text-muted-foreground">
        Pick the bank you want Genwel to understand. You’ll approve exactly what
        is shared before anything connects.
      </Text>

      <View className="mt-5 flex-row items-center rounded-2xl border border-border bg-card px-4">
        <FontAwesomeIcon icon={faMagnifyingGlass} size={14} color="#667a78" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search banks"
          placeholderTextColor="#80908e"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          className="min-h-14 flex-1 px-3 font-sans text-[15px] text-foreground"
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear bank search"
            className="h-9 w-9 items-center justify-center"
          >
            <FontAwesomeIcon icon={faXmark} size={15} color="#667a78" />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-4 flex-row items-start gap-3 rounded-2xl bg-muted px-4 py-3.5">
        <FontAwesomeIcon icon={faLock} size={14} color="#1a5a5a" />
        <Text className="flex-1 font-sans text-[11px] leading-4 text-muted-foreground">
          You’ll continue securely with TrueLayer to approve read-only access.
          Genwel never sees your bank login.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: '#faf9f7' }}
    >
      {loading && !data ? <StateView loading /> : null}
      {error && !data ? (
        <View className="flex-1">
          {header}
          <StateView title="Banks didn’t load" body={error} retry={retry} />
        </View>
      ) : null}
      {data ? (
        <SectionList<BankProvider, BankSection>
          sections={sections}
          keyExtractor={(provider) => provider.id}
          renderItem={({ item }) => (
            <BankRow
              provider={item}
              selected={selectedId === item.id}
              disabled={selectedId !== null}
              onPress={() => void choose(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View className="bg-background px-5 pb-1 pt-4">
              <Text className="font-sans-bold text-[11px] uppercase tracking-[1.4px] text-muted-foreground">
                {section.title}
              </Text>
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <StateView
              title="No banks found"
              body="Try another bank name or clear your search."
            />
          }
          refreshing={refreshing}
          onRefresh={refresh}
          stickySectionHeadersEnabled={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      ) : null}
    </SafeAreaView>
  );
}
