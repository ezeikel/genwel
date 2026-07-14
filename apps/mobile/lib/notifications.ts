import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { SubscriptionReport } from '@/lib/types';

const IDS_KEY = 'genwel.renewal-notification-ids.v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('renewals', {
      name: 'Renewal reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#1a5a5a',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

export const hasNotificationPermission = async () =>
  (await Notifications.getPermissionsAsync()).status === 'granted';

const storedNotificationIds = async () => {
  try {
    const value = JSON.parse((await AsyncStorage.getItem(IDS_KEY)) ?? '[]');
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

/** Remove reminders that belonged to the previous account or data snapshot. */
export const clearRenewalNotifications = async () => {
  const identifiers = await storedNotificationIds();
  await Promise.all(
    identifiers.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(IDS_KEY).catch(() => undefined);
};

/** Keep one local reminder per detected renewal, scheduled for the day before. */
export const scheduleRenewalNotifications = async (
  report: SubscriptionReport,
) => {
  if (!(await hasNotificationPermission())) return;

  await clearRenewalNotifications();

  const identifiers: string[] = [];
  for (const subscription of report.upcoming) {
    if (!subscription.nextRenewal) continue;
    const renewal = new Date(subscription.nextRenewal);
    const reminder = new Date(renewal.getTime() - 24 * 60 * 60 * 1000);
    reminder.setHours(9, 0, 0, 0);
    if (reminder.getTime() <= Date.now()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${subscription.name} renews tomorrow`,
        body: `A ${new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
        }).format(subscription.amount)} payment is expected.`,
        data: { route: '/(tabs)/subscriptions' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder,
        channelId: Platform.OS === 'android' ? 'renewals' : undefined,
      },
    });
    identifiers.push(id);
  }

  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(identifiers));
};
