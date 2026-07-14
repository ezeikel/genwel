import { faArrowLeft, faChartPie } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { ProGate } from '@/components/ProGate';
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
import { categoryLabel, money } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { BudgetResponse, SpendingCategory } from '@/lib/types';

const BUDGETABLE_CATEGORIES: SpendingCategory[] = [
  'GROCERIES',
  'EATING_OUT',
  'SHOPPING',
  'BILLS',
  'TRANSPORT',
  'ENTERTAINMENT',
  'HEALTH',
  'PERSONAL_CARE',
  'EDUCATION',
  'SUBSCRIPTIONS',
  'SAVINGS',
  'CASH',
  'REMITTANCES',
  'OTHER',
];

const schema = z.object({
  periodType: z.enum(['CALENDAR_MONTH', 'PAYDAY']),
  paydayDate: z.string(),
  amounts: z.record(z.string(), z.string()),
});

const ProgressCard = ({
  item,
}: {
  item: BudgetResponse['progress']['progress'][number];
}) => {
  const width = `${Math.min(item.percentUsed, 100)}%` as `${number}%`;
  const colour =
    item.status === 'over_budget'
      ? 'bg-destructive'
      : item.status === 'warning'
        ? 'bg-accent'
        : 'bg-primary';
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-bold text-[14px] text-foreground">
          {categoryLabel(item.category)}
        </Text>
        <Text className="font-sans-bold text-[12px] text-foreground">
          {money(item.spent)} / {money(item.budgetAmount)}
        </Text>
      </View>
      <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <View className={`h-full rounded-full ${colour}`} style={{ width }} />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-sans text-[10px] text-muted-foreground">
          {Math.round(item.percentUsed)}% used
        </Text>
        <Text
          className={`font-sans-semibold text-[10px] ${item.status === 'over_budget' ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {item.status === 'over_budget'
            ? `${money(item.spent - item.budgetAmount)} over`
            : `${money(item.remaining)} left`}
        </Text>
      </View>
    </Card>
  );
};

export default function BudgetsScreen() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<BudgetResponse>('/api/mobile/budgets');
  const [saving, setSaving] = useState(false);
  const form = useForm({
    defaultValues: {
      periodType: 'CALENDAR_MONTH' as 'CALENDAR_MONTH' | 'PAYDAY',
      paydayDate: '25',
      amounts: {} as Record<string, string>,
    },
    onSubmit: async ({ value }) => {
      if (!token) return;
      const parsed = schema.safeParse(value);
      if (!parsed.success) {
        toast.error('Check the budget amounts and try again.');
        return;
      }
      const paydayDate = Number(parsed.data.paydayDate);
      if (
        parsed.data.periodType === 'PAYDAY' &&
        (!Number.isInteger(paydayDate) || paydayDate < 1 || paydayDate > 31)
      ) {
        toast.error('Payday must be between 1 and 31.');
        return;
      }
      const invalidAmount = BUDGETABLE_CATEGORIES.some((category) => {
        const raw = parsed.data.amounts[category]?.trim();
        if (!raw) return false;
        const amount = Number(raw);
        return !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000;
      });
      if (invalidAmount) {
        toast.error('Each budget must be between £0.01 and £1,000,000.');
        return;
      }
      const budgets = BUDGETABLE_CATEGORIES.flatMap((category) => {
        const raw = parsed.data.amounts[category]?.trim();
        if (!raw) return [];
        const amount = Number(raw);
        return [{ category, amount }];
      });
      if (!budgets.length) {
        toast.error('Set at least one category budget.');
        return;
      }
      setSaving(true);
      try {
        await apiFetch('/api/mobile/budgets', {
          method: 'PUT',
          token,
          body: JSON.stringify({
            periodType: parsed.data.periodType,
            paydayDate: parsed.data.periodType === 'PAYDAY' ? paydayDate : null,
            budgets,
          }),
        });
        toast.success('Budget saved.');
        await refresh();
      } catch (cause) {
        toast.error(
          cause instanceof Error ? cause.message : 'Budget could not be saved',
        );
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!data) return;
    const amounts: Record<string, string> = {};
    for (const budget of data.config?.budgets ?? [])
      amounts[budget.category] = budget.amount;
    form.reset({
      periodType: data.config?.periodType ?? 'CALENDAR_MONTH',
      paydayDate: String(data.config?.paydayDate ?? 25),
      amounts,
    });
  }, [data, form]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <PageHeader
        title="Budgets"
        subtitle="Choose category limits that fit your month or payday cycle."
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
        <StateView title="Budgets didn’t load" body={error} retry={retry} />
      ) : null}

      {data ? (
        !data.entitlements.features.budgets ? (
          <ProGate
            title="Build a budget around real life"
            body="Pro tracks category limits by calendar month or from the day you get paid."
          />
        ) : (
          <View className="gap-6">
            {data.progress.progress.length ? (
              <>
                <View className="rounded-[30px] bg-primary p-6">
                  <Text className="font-sans-semibold text-[11px] text-primary-foreground/70">
                    Spent this period
                  </Text>
                  <Text className="mt-2 font-sans-bold text-[34px] tracking-[-1.3px] text-primary-foreground">
                    {money(data.progress.totalSpent)}
                  </Text>
                  <Text className="mt-4 font-sans text-[11px] text-primary-foreground/65">
                    of {money(data.progress.totalBudgeted)} across{' '}
                    {data.progress.progress.length} categories
                  </Text>
                </View>
                <View className="gap-3">
                  <Text className="px-1 font-sans-bold text-[18px] text-foreground">
                    Progress
                  </Text>
                  {data.progress.progress.map((item) => (
                    <ProgressCard key={item.category} item={item} />
                  ))}
                </View>
              </>
            ) : null}

            <Card>
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                  <FontAwesomeIcon
                    icon={faChartPie}
                    size={18}
                    color="#1a5a5a"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-bold text-[17px] text-foreground">
                    {data.config ? 'Edit your limits' : 'Create your budget'}
                  </Text>
                  <Text className="mt-1 font-sans text-[11px] text-muted-foreground">
                    Leave a category blank if you do not want to track it.
                  </Text>
                </View>
              </View>

              <form.Field name="periodType">
                {(field) => (
                  <View className="mt-6 flex-row gap-2 rounded-2xl bg-muted p-1.5">
                    {(['CALENDAR_MONTH', 'PAYDAY'] as const).map((period) => {
                      const active = field.state.value === period;
                      return (
                        <Pressable
                          key={period}
                          onPress={() => field.handleChange(period)}
                          className={`flex-1 items-center rounded-xl py-3 ${active ? 'bg-card' : ''}`}
                        >
                          <Text
                            className={`font-sans-semibold text-[11px] ${active ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            {period === 'CALENDAR_MONTH'
                              ? 'Calendar month'
                              : 'From payday'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.periodType}>
                {(periodType) =>
                  periodType === 'PAYDAY' ? (
                    <form.Field name="paydayDate">
                      {(field) => (
                        <View className="mt-4">
                          <Text className="mb-2 font-sans-semibold text-[11px] text-muted-foreground">
                            Payday day of month
                          </Text>
                          <TextInput
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="25"
                            placeholderTextColor="#80908e"
                            className="rounded-2xl border border-border bg-card px-4 py-4 font-sans text-[14px] text-foreground"
                          />
                        </View>
                      )}
                    </form.Field>
                  ) : null
                }
              </form.Subscribe>

              <form.Field name="amounts">
                {(field) => (
                  <View className="mt-6 overflow-hidden rounded-2xl border border-border px-4">
                    {BUDGETABLE_CATEGORIES.map((category) => (
                      <View
                        key={category}
                        className="flex-row items-center border-b border-border/70 py-3 last:border-b-0"
                      >
                        <Text className="flex-1 font-sans-medium text-[12px] text-foreground">
                          {categoryLabel(category)}
                        </Text>
                        <View className="flex-row items-center rounded-xl bg-muted px-3">
                          <Text className="font-sans-semibold text-[12px] text-muted-foreground">
                            £
                          </Text>
                          <TextInput
                            value={field.state.value[category] ?? ''}
                            onChangeText={(value) =>
                              field.handleChange({
                                ...field.state.value,
                                [category]: value,
                              })
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor="#80908e"
                            className="min-h-11 w-20 text-right font-sans-semibold text-[13px] text-foreground"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </form.Field>

              <View className="mt-5">
                <PrimaryButton
                  label={data.config ? 'Save changes' : 'Create budget'}
                  busy={saving}
                  onPress={() => void form.handleSubmit()}
                />
              </View>
            </Card>
          </View>
        )
      ) : null}
    </Screen>
  );
}
