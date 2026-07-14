import {
  faArrowLeft,
  faArrowsRotate,
  faLightbulb,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ProGate } from '@/components/ProGate';
import { SpendingBars } from '@/components/SpendingBars';
import { toast } from '@/components/ToastViewport';
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
import { shortDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { InsightsResponse } from '@/lib/types';

const emptyCopy: Record<
  NonNullable<InsightsResponse['emptyReason']>,
  string
> = {
  no_accounts:
    'Connect a bank first, then Genwel can look for patterns in your activity.',
  no_recent_activity:
    'There is not enough recent activity to build an insight yet.',
  generation_failed:
    'Insights could not be refreshed this time. Try again in a moment.',
};

export default function InsightsScreen() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<InsightsResponse>('/api/mobile/insights');
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!token || generating) return;
    setGenerating(true);
    try {
      await apiFetch('/api/mobile/insights', { method: 'POST', token });
      toast.success('Your insights are ready.');
      await refresh();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Refresh failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <PageHeader
        title="Insights"
        subtitle="Patterns and changes found across your recent activity."
        action={
          <IconButton
            icon={faArrowLeft}
            label="Back"
            onPress={() => router.back()}
          />
        }
      />
      {loading && !data ? <StateView loading /> : null}
      {error && !data ? (
        <StateView title="Insights didn’t load" body={error} retry={retry} />
      ) : null}

      {data ? (
        <View className="gap-5">
          {data.trend.length ? <SpendingBars data={data.trend} /> : null}

          {!data.entitlements.features.aiInsights ? (
            <ProGate
              title="See the story behind the chart"
              body="Pro looks across your activity for shifts, unusual costs and practical opportunities to review."
            />
          ) : (
            <>
              <View className="flex-row items-center justify-between px-1">
                <Text className="font-sans-bold text-[18px] text-foreground">
                  Your latest
                </Text>
                <View className="w-36">
                  <PrimaryButton
                    label="Refresh"
                    secondary
                    busy={generating}
                    onPress={() => void generate()}
                  />
                </View>
              </View>

              {data.insights.length ? (
                <View className="gap-3">
                  {data.insights.map((insight) => (
                    <Card key={insight.id}>
                      <View className="flex-row items-start gap-3">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                          <FontAwesomeIcon
                            icon={faLightbulb}
                            size={18}
                            color="#1a5a5a"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-sans-bold text-[16px] leading-5 text-foreground">
                            {insight.title}
                          </Text>
                          <Text className="mt-2 font-sans text-[13px] leading-5 text-muted-foreground">
                            {insight.body}
                          </Text>
                          <Text className="mt-4 font-sans-medium text-[10px] text-muted-foreground">
                            {shortDate(insight.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              ) : (
                <View className="items-center rounded-[30px] border border-dashed border-border bg-card px-7 py-12">
                  <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-muted">
                    <FontAwesomeIcon
                      icon={faArrowsRotate}
                      size={25}
                      color="#1a5a5a"
                    />
                  </View>
                  <Text className="mt-6 text-center font-sans-bold text-[20px] text-foreground">
                    Nothing to show yet
                  </Text>
                  <Text className="mt-2 text-center font-sans text-[13px] leading-5 text-muted-foreground">
                    {data.emptyReason
                      ? emptyCopy[data.emptyReason]
                      : 'Refresh to look for useful patterns in your accounts.'}
                  </Text>
                  <View className="mt-6 w-full">
                    <PrimaryButton
                      label="Find insights"
                      busy={generating}
                      onPress={() => void generate()}
                    />
                  </View>
                </View>
              )}
            </>
          )}
          <Text className="px-5 text-center font-sans text-[9px] leading-4 text-muted-foreground">
            Insights are general information and may be incomplete. Genwel is
            not a regulated financial adviser.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
