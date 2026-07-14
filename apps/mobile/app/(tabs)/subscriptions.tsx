import {
  faBell,
  faEllipsis,
  faRepeat,
  faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { MoreSheet } from '@/components/MoreSheet';
import {
  Card,
  IconButton,
  PageHeader,
  Screen,
  StateView,
} from '@/components/ui';
import { useMobileData } from '@/hooks/use-mobile-data';
import { categoryLabel, money, shortDate } from '@/lib/format';
import { scheduleRenewalNotifications } from '@/lib/notifications';
import type {
  Subscription as RecurringSubscription,
  SubscriptionsResponse,
} from '@/lib/types';

const SubscriptionRow = ({ item }: { item: RecurringSubscription }) => (
  <View className="flex-row items-center border-b border-border/70 py-3.5 last:border-b-0">
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted">
      <Text className="font-sans-bold text-[14px] text-primary">
        {item.name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
    <View className="ml-3 flex-1 pr-3">
      <Text
        numberOfLines={1}
        className="font-sans-semibold text-[14px] text-foreground"
      >
        {item.name}
      </Text>
      <Text className="mt-0.5 font-sans text-[10px] text-muted-foreground">
        {item.category ? categoryLabel(item.category) : 'Recurring payment'} ·{' '}
        {item.cadence}
        {item.nextRenewal ? ` · ${shortDate(item.nextRenewal)}` : ''}
      </Text>
    </View>
    <View className="items-end">
      <Text className="font-sans-bold text-[14px] tabular-nums text-foreground">
        {money(item.amount)}
      </Text>
      {item.priceRise ? (
        <Text className="mt-1 font-sans-bold text-[9px] text-destructive">
          +{money(item.priceRise.delta)}
        </Text>
      ) : null}
    </View>
  </View>
);

export default function SubscriptionsTab() {
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<SubscriptionsResponse>('/api/mobile/subscriptions');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (data?.report) void scheduleRenewalNotifications(data.report);
  }, [data?.report]);

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <PageHeader
          title="Subscriptions"
          subtitle="Recurring payments detected from your transaction history."
          action={
            <IconButton
              icon={faEllipsis}
              label="More"
              onPress={() => setMoreOpen(true)}
            />
          }
        />
        {loading && !data ? <StateView loading /> : null}
        {error && !data ? (
          <StateView
            title="Subscriptions didn’t load"
            body={error}
            retry={retry}
          />
        ) : null}

        {data ? (
          <View className="gap-5">
            <View className="rounded-[30px] bg-primary p-6">
              <Text className="font-sans-semibold text-[11px] text-primary-foreground/70">
                Expected each month
              </Text>
              <Text className="mt-2 font-sans-bold text-[36px] tracking-[-1.5px] text-primary-foreground">
                {money(data.report.monthlyTotal)}
              </Text>
              <View className="mt-5 flex-row items-center justify-between">
                <Text className="font-sans text-[11px] text-primary-foreground/65">
                  {data.report.subscriptions.length} recurring payments
                </Text>
                <Text className="font-sans-bold text-[11px] text-primary-foreground">
                  {money(data.report.yearlyTotal)}/year
                </Text>
              </View>
            </View>

            {data.report.upcoming.length ? (
              <View className="rounded-3xl border border-accent/25 bg-accent/10 p-5">
                <View className="flex-row items-center gap-2">
                  <FontAwesomeIcon icon={faBell} size={15} color="#b87816" />
                  <Text className="font-sans-bold text-[14px] text-foreground">
                    Coming up
                  </Text>
                </View>
                <View className="mt-3 gap-2.5">
                  {data.report.upcoming.slice(0, 3).map((item) => (
                    <View key={item.key} className="flex-row items-center">
                      <Text
                        numberOfLines={1}
                        className="flex-1 font-sans-medium text-[12px] text-foreground"
                      >
                        {item.name}
                      </Text>
                      <Text className="font-sans-semibold text-[11px] text-muted-foreground">
                        {item.nextRenewal ? shortDate(item.nextRenewal) : ''} ·{' '}
                        {money(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="mt-4 font-sans text-[10px] leading-4 text-muted-foreground">
                  With notifications enabled, Genwel reminds you the day before
                  a detected renewal.
                </Text>
              </View>
            ) : null}

            {data.report.duplicates.length ||
            data.report.subscriptions.some((item) => item.priceRise) ? (
              <View className="gap-3">
                <Text className="px-1 font-sans-bold text-[18px] text-foreground">
                  Worth checking
                </Text>
                {data.report.duplicates.map((duplicate) => (
                  <View
                    key={duplicate.label}
                    className="rounded-3xl border border-destructive/15 bg-[#fff4f5] p-5"
                  >
                    <View className="flex-row items-start gap-3">
                      <FontAwesomeIcon
                        icon={faTriangleExclamation}
                        size={17}
                        color="#c63f4f"
                      />
                      <View className="flex-1">
                        <Text className="font-sans-bold text-[14px] text-foreground">
                          Possible {duplicate.label} overlap
                        </Text>
                        <Text className="mt-1 font-sans text-[11px] leading-4 text-muted-foreground">
                          {duplicate.subscriptions
                            .map((item) => item.name)
                            .join(' and ')}{' '}
                          may cover similar needs.
                        </Text>
                        <Text className="mt-3 font-sans-bold text-[11px] text-destructive">
                          Review up to {money(duplicate.potentialMonthlySaving)}
                          /month
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {data.report.subscriptions
                  .filter((item) => item.priceRise)
                  .slice(0, 3)
                  .map((item) => (
                    <View
                      key={`rise-${item.key}`}
                      className="rounded-3xl border border-destructive/15 bg-[#fff4f5] p-5"
                    >
                      <Text className="font-sans-bold text-[14px] text-foreground">
                        {item.name} appears to cost more
                      </Text>
                      <Text className="mt-1 font-sans text-[11px] leading-4 text-muted-foreground">
                        Recent payments moved from{' '}
                        {money(item.priceRise?.from ?? 0)} to{' '}
                        {money(item.priceRise?.to ?? 0)}.
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null}

            {data.report.subscriptions.length ? (
              <View>
                <Text className="mb-2 px-1 font-sans-bold text-[18px] text-foreground">
                  All recurring
                </Text>
                <Card className="py-1">
                  {data.report.subscriptions.map((item) => (
                    <SubscriptionRow key={item.key} item={item} />
                  ))}
                </Card>
              </View>
            ) : (
              <View className="items-center rounded-[30px] border border-dashed border-border bg-card px-7 py-12">
                <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-muted">
                  <FontAwesomeIcon icon={faRepeat} size={27} color="#1a5a5a" />
                </View>
                <Text className="mt-6 text-center font-sans-bold text-[20px] text-foreground">
                  No recurring payments yet
                </Text>
                <Text className="mt-2 text-center font-sans text-[13px] leading-5 text-muted-foreground">
                  After a bank sync, Genwel looks for repeat payments and likely
                  renewal dates.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </Screen>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
