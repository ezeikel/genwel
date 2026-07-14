import {
  faEllipsis,
  faMagnifyingGlass,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreSheet } from '@/components/MoreSheet';
import { TransactionRow } from '@/components/TransactionRow';
import { IconButton, PageHeader, StateView } from '@/components/ui';
import { useMobileData } from '@/hooks/use-mobile-data';
import { categoryLabel, compactMoney, money } from '@/lib/format';
import type {
  ApiTransaction,
  SpendingCategory,
  TransactionsResponse,
} from '@/lib/types';

const CategorySummary = ({
  data,
}: {
  data: TransactionsResponse['spendingByCategory'];
}) => {
  const max = Math.max(...data.map((item) => item.amount), 1);
  return (
    <View className="rounded-3xl border border-border bg-card p-5">
      <Text className="font-sans-bold text-[16px] text-foreground">
        Where it went
      </Text>
      <View className="mt-4 gap-3.5">
        {data.slice(0, 5).map((item) => (
          <View key={item.category}>
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="font-sans-medium text-[11px] text-muted-foreground">
                {categoryLabel(item.category)}
              </Text>
              <Text className="font-sans-bold text-[11px] text-foreground">
                {money(item.amount)}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(4, (item.amount / max) * 100)}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function TransactionsTab() {
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<TransactionsResponse>('/api/mobile/transactions?days=365');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SpendingCategory | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const categories = useMemo(
    () =>
      data?.spendingByCategory.slice(0, 6).map((item) => item.category) ?? [],
    [data],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.transactions ?? []).filter((transaction) => {
      if (category && transaction.category !== category) return false;
      if (!needle) return true;
      return [
        transaction.merchantName,
        transaction.description,
        transaction.accountName,
        categoryLabel(transaction.category),
      ].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [category, data, query]);
  const spent =
    data?.spendingByCategory.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  const header = data ? (
    <View className="pb-4">
      <PageHeader
        title="Transactions"
        subtitle={`${data.days} days of activity across every connected account.`}
        action={
          <IconButton
            icon={faEllipsis}
            label="More"
            onPress={() => setMoreOpen(true)}
          />
        }
      />

      <View className="mb-5 rounded-[30px] bg-primary p-6">
        <Text className="font-sans-semibold text-[11px] text-primary-foreground/70">
          Total spending
        </Text>
        <Text className="mt-2 font-sans-bold text-[34px] tracking-[-1.3px] text-primary-foreground">
          {money(spent)}
        </Text>
        <Text className="mt-3 font-sans text-[11px] text-primary-foreground/65">
          {data.transactions.length} transactions · top category{' '}
          {categoryLabel(data.spendingByCategory[0]?.category ?? 'OTHER')}
        </Text>
      </View>

      {data.spendingByCategory.length ? (
        <View className="mb-5">
          <CategorySummary data={data.spendingByCategory} />
        </View>
      ) : null}

      {!data.entitlements.features.fullHistory ? (
        <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-accent/10 px-4 py-3">
          <Text className="flex-1 font-sans text-[11px] text-muted-foreground">
            Free includes recent history. Pro unlocks your full timeline.
          </Text>
          <Text className="ml-3 font-sans-bold text-[11px] text-warning">
            {compactMoney(spent)}
          </Text>
        </View>
      ) : null}

      <View className="mb-3 flex-row items-center rounded-2xl border border-border bg-card px-4">
        <FontAwesomeIcon icon={faMagnifyingGlass} size={14} color="#667a78" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search activity"
          placeholderTextColor="#80908e"
          returnKeyType="search"
          className="min-h-13 flex-1 pl-3 font-sans text-[14px] text-foreground"
        />
      </View>

      {categories.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
          className="-mr-5 mb-4"
        >
          <Pressable
            onPress={() => setCategory(null)}
            className={`rounded-full px-4 py-2.5 ${category ? 'bg-muted' : 'bg-primary'}`}
          >
            <Text
              className={`font-sans-semibold text-[11px] ${category ? 'text-foreground' : 'text-primary-foreground'}`}
            >
              All
            </Text>
          </Pressable>
          {categories.map((item) => {
            const active = category === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                className={`rounded-full px-4 py-2.5 ${active ? 'bg-primary' : 'bg-muted'}`}
              >
                <Text
                  className={`font-sans-semibold text-[11px] ${active ? 'text-primary-foreground' : 'text-foreground'}`}
                >
                  {categoryLabel(item)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View className="flex-row items-center justify-between px-1">
        <Text className="font-sans-bold text-[17px] text-foreground">
          Activity
        </Text>
        <Text className="font-sans text-[11px] text-muted-foreground">
          {filtered.length} shown
        </Text>
      </View>
    </View>
  ) : null;

  return (
    <>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 1, backgroundColor: '#faf9f7' }}
      >
        {loading && !data ? <StateView loading /> : null}
        {error && !data ? (
          <StateView
            title="Transactions didn’t load"
            body={error}
            retry={retry}
          />
        ) : null}
        {data ? (
          <FlashList<ApiTransaction>
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionRow transaction={item} />}
            ListHeaderComponent={header}
            ListEmptyComponent={
              <StateView
                title={
                  query || category ? 'Nothing matches' : 'No transactions yet'
                }
                body={
                  query || category
                    ? 'Try another search or category.'
                    : 'Connect and sync a bank to see activity here.'
                }
              />
            }
            refreshing={refreshing}
            onRefresh={refresh}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 126,
            }}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </SafeAreaView>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
