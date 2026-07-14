import {
  faArrowsRotate,
  faBuildingColumns,
  faChevronRight,
  faEllipsis,
  faLightbulb,
  faRepeat,
  faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MoreSheet } from '@/components/MoreSheet';
import { toast } from '@/components/ToastViewport';
import { TransactionRow } from '@/components/TransactionRow';
import {
  Card,
  IconButton,
  PageHeader,
  PrimaryButton,
  Screen,
  StateView,
} from '@/components/ui';
import { useMobileData } from '@/hooks/use-mobile-data';
import { apiFetch } from '@/lib/api';
import { compactMoney, money, relativeDate } from '@/lib/format';
import { scheduleRenewalNotifications } from '@/lib/notifications';
import { useSession } from '@/lib/session';
import type {
  AccountGroup,
  FixableProblem,
  OverviewResponse,
} from '@/lib/types';

const GroupRow = ({ group }: { group: AccountGroup }) => (
  <View className="flex-row items-center border-b border-border/70 py-3.5 last:border-b-0">
    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-muted">
      <FontAwesomeIcon icon={faBuildingColumns} size={15} color="#1a5a5a" />
    </View>
    <View className="ml-3 flex-1">
      <Text className="font-sans-semibold text-[14px] text-foreground">
        {group.label}
      </Text>
      <Text className="mt-0.5 font-sans text-[11px] text-muted-foreground">
        {group.accounts.length}{' '}
        {group.accounts.length === 1 ? 'account' : 'accounts'}
      </Text>
    </View>
    <Text className="font-sans-bold text-[14px] tabular-nums text-foreground">
      {money(group.displayTotal)}
    </Text>
  </View>
);

const ProblemCard = ({ problem }: { problem: FixableProblem }) => (
  <View className="rounded-3xl border border-accent/25 bg-accent/10 p-5">
    <View className="flex-row items-start gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          size={17}
          color="#b87816"
        />
      </View>
      <View className="flex-1">
        <Text className="font-sans-bold text-[15px] text-foreground">
          {problem.title}
        </Text>
        <Text className="mt-1 font-sans text-[12px] leading-5 text-muted-foreground">
          {problem.detail}
        </Text>
      </View>
    </View>
    {problem.estimatedSaving > 0 ? (
      <Text className="mt-4 font-sans-bold text-[13px] text-warning">
        About {money(problem.estimatedSaving)}/month to review
      </Text>
    ) : null}
  </View>
);

export default function OverviewTab() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const user = useSession((state) => state.user);
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<OverviewResponse>('/api/mobile/overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (data?.subscriptions) {
      void scheduleRenewalNotifications(data.subscriptions);
    }
  }, [data?.subscriptions]);

  const sync = async () => {
    if (!token || syncing) return;
    setSyncing(true);
    try {
      await apiFetch('/api/mobile/sync', { method: 'POST', token });
      toast.success('Your latest bank activity is on its way.');
      setTimeout(() => void refresh(), 1_200);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0];
  return (
    <>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <PageHeader
          title={firstName ? `Hello, ${firstName}` : 'Your money'}
          subtitle="A clear view across your connected accounts."
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
            title="Your overview didn’t load"
            body={error}
            retry={retry}
          />
        ) : null}

        {data ? (
          <View className="gap-5">
            <View className="overflow-hidden rounded-[30px] bg-primary p-6">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-semibold text-[12px] text-primary-foreground/70">
                  Net worth
                </Text>
                <Pressable
                  onPress={() => void sync()}
                  accessibilityLabel="Sync accounts"
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
                >
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    size={14}
                    color="#faf9f7"
                  />
                </Pressable>
              </View>
              <Text className="mt-3 font-sans-bold text-[38px] tracking-[-1.7px] text-primary-foreground">
                {money(data.summary.netWorth)}
              </Text>
              <View className="mt-5 flex-row items-end justify-between">
                <Text className="font-sans text-[11px] text-primary-foreground/65">
                  {syncing
                    ? 'Syncing…'
                    : relativeDate(data.summary.lastSyncedAt)}
                </Text>
                {data.monthDelta !== null ? (
                  <Text
                    className={`font-sans-bold text-[12px] ${
                      data.monthDelta >= 0 ? 'text-[#a8e2c9]' : 'text-[#ffd0d5]'
                    }`}
                  >
                    {data.monthDelta >= 0 ? '+' : ''}
                    {money(data.monthDelta)} this month
                  </Text>
                ) : null}
              </View>
            </View>

            {!data.summary.hasAccounts ? (
              <Card>
                <FontAwesomeIcon
                  icon={faBuildingColumns}
                  size={24}
                  color="#1a5a5a"
                />
                <Text className="mt-4 font-sans-bold text-[18px] text-foreground">
                  Connect your first bank
                </Text>
                <Text className="mt-2 font-sans text-[13px] leading-5 text-muted-foreground">
                  Bring balances and transactions together through a secure,
                  read-only connection.
                </Text>
                <View className="mt-5">
                  <PrimaryButton
                    label="Go to accounts"
                    onPress={() => router.push('/(tabs)/accounts')}
                  />
                </View>
              </Card>
            ) : (
              <Card>
                <Text className="font-sans-bold text-[17px] text-foreground">
                  Balances
                </Text>
                <View className="mt-2">
                  {data.summary.groups.map((group) => (
                    <GroupRow key={group.kind} group={group} />
                  ))}
                </View>
              </Card>
            )}

            {data.insight ? (
              <Pressable
                onPress={() => router.push('/insights')}
                className="rounded-3xl border border-primary/15 bg-muted p-5"
              >
                <View className="flex-row items-start gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <FontAwesomeIcon
                      icon={faLightbulb}
                      size={17}
                      color="#1a5a5a"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-bold text-[15px] text-foreground">
                      {data.insight.title}
                    </Text>
                    <Text
                      numberOfLines={3}
                      className="mt-1 font-sans text-[12px] leading-5 text-muted-foreground"
                    >
                      {data.insight.body}
                    </Text>
                  </View>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    size={13}
                    color="#667a78"
                  />
                </View>
              </Pressable>
            ) : null}

            {data.fixableProblems.problems[0] ? (
              <View className="gap-3">
                <View className="flex-row items-center justify-between px-1">
                  <Text className="font-sans-bold text-[18px] text-foreground">
                    Worth a look
                  </Text>
                  <Text className="font-sans-semibold text-[12px] text-warning">
                    {compactMoney(data.fixableProblems.totalSaving)}/mo
                  </Text>
                </View>
                <ProblemCard problem={data.fixableProblems.problems[0]} />
                {data.fixableProblems.lockedCount > 0 ? (
                  <Pressable
                    onPress={() => router.push('/paywall')}
                    className="items-center py-1"
                  >
                    <Text className="font-sans-semibold text-[12px] text-primary">
                      {data.fixableProblems.lockedCount} more with Pro
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Pressable
              onPress={() => router.push('/(tabs)/subscriptions')}
              className="flex-row items-center rounded-3xl border border-border bg-card p-5"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <FontAwesomeIcon icon={faRepeat} size={17} color="#1a5a5a" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-sans-bold text-[15px] text-foreground">
                  Recurring bills
                </Text>
                <Text className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                  {data.subscriptions.subscriptions.length} detected ·{' '}
                  {money(data.subscriptions.monthlyTotal)}/mo
                </Text>
              </View>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={13}
                color="#667a78"
              />
            </Pressable>

            {data.recentTransactions.length ? (
              <View>
                <View className="mb-2 flex-row items-center justify-between px-1">
                  <Text className="font-sans-bold text-[18px] text-foreground">
                    Recent activity
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/transactions')}
                  >
                    <Text className="font-sans-semibold text-[12px] text-primary">
                      See all
                    </Text>
                  </Pressable>
                </View>
                <Card className="py-1">
                  {data.recentTransactions.slice(0, 5).map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </Card>
              </View>
            ) : null}
          </View>
        ) : null}
      </Screen>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
