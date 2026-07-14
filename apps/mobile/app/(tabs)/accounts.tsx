import {
  faArrowsRotate,
  faBuildingColumns,
  faEllipsis,
  faLink,
  faPlus,
  faTrashCan,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { MoreSheet } from '@/components/MoreSheet';
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
import { ApiError, apiFetch } from '@/lib/api';
import { connectBank } from '@/lib/connect-bank';
import { money, relativeDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { AccountsResponse, BankConnection } from '@/lib/types';

const ConnectionCard = ({
  connection,
  removing,
  onRemove,
}: {
  connection: BankConnection;
  removing: boolean;
  onRemove: () => void;
}) => (
  <Card>
    <View className="flex-row items-start">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
        <FontAwesomeIcon icon={faBuildingColumns} size={19} color="#faf9f7" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-sans-bold text-[16px] text-foreground">
          {connection.providerName}
        </Text>
        <Text className="mt-1 font-sans text-[11px] text-muted-foreground">
          {relativeDate(connection.lastSyncedAt)}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        disabled={removing}
        accessibilityLabel={`Disconnect ${connection.providerName}`}
        className="h-10 w-10 items-center justify-center rounded-full bg-muted"
      >
        <FontAwesomeIcon icon={faTrashCan} size={14} color="#c63f4f" />
      </Pressable>
    </View>

    <View className="mt-4 overflow-hidden rounded-2xl bg-muted/65 px-4">
      {connection.bankAccounts.map((account) => (
        <View
          key={account.id}
          className="flex-row items-center border-b border-border/80 py-3.5 last:border-b-0"
        >
          <View className="flex-1 pr-3">
            <Text
              numberOfLines={1}
              className="font-sans-semibold text-[13px] text-foreground"
            >
              {account.displayName}
            </Text>
            <Text className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.8px] text-muted-foreground">
              {account.accountType.replaceAll('_', ' ')}
            </Text>
          </View>
          <Text className="font-sans-bold text-[14px] tabular-nums text-foreground">
            {money(account.balance, account.currency)}
          </Text>
        </View>
      ))}
    </View>
  </Card>
);

export default function AccountsTab() {
  const router = useRouter();
  const token = useSession((state) => state.token);
  const { data, loading, error, refreshing, refresh, retry } =
    useMobileData<AccountsResponse>('/api/mobile/accounts');
  const [moreOpen, setMoreOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const connect = async () => {
    if (!token || connecting) return;
    setConnecting(true);
    try {
      const result = await connectBank(token);
      if (result === 'success') {
        toast.success('Bank connected.');
        await refresh();
      } else if (result === 'failed') {
        toast.error("We couldn't connect that bank.");
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
      setConnecting(false);
    }
  };

  const sync = async () => {
    if (!token || syncing) return;
    setSyncing(true);
    try {
      await apiFetch('/api/mobile/sync', { method: 'POST', token });
      toast.success('Refreshing your bank activity.');
      setTimeout(() => void refresh(), 1_200);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const remove = (connection: BankConnection) => {
    Alert.alert(
      `Disconnect ${connection.providerName}?`,
      'Its accounts and imported activity will be removed from Genwel. You can connect it again later.',
      [
        { text: 'Keep connected', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setRemoving(connection.id);
            try {
              await apiFetch(`/api/mobile/accounts/${connection.id}`, {
                method: 'DELETE',
                token,
              });
              toast.success('Bank disconnected.');
              await refresh();
            } catch (cause) {
              toast.error(
                cause instanceof Error ? cause.message : 'Disconnect failed',
              );
            } finally {
              setRemoving(null);
            }
          },
        },
      ],
    );
  };

  const max = data?.entitlements.features.maxBankConnections;
  const connectionLimit = max === null ? 'Unlimited' : String(max ?? 2);

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <PageHeader
          title="Accounts"
          subtitle="Secure, read-only connections to your UK banks."
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
          <StateView title="Accounts didn’t load" body={error} retry={retry} />
        ) : null}

        {data ? (
          <View className="gap-5">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <PrimaryButton
                  label="Connect bank"
                  onPress={() => void connect()}
                  busy={connecting}
                />
              </View>
              {data.connections.length ? (
                <Pressable
                  onPress={() => void sync()}
                  disabled={syncing}
                  accessibilityLabel="Sync accounts"
                  className="h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card"
                >
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    size={17}
                    color="#1a5a5a"
                  />
                </Pressable>
              ) : null}
            </View>

            <View className="flex-row items-center gap-3 rounded-2xl bg-muted px-4 py-3">
              <FontAwesomeIcon icon={faLink} size={14} color="#1a5a5a" />
              <Text className="flex-1 font-sans text-[12px] leading-4 text-muted-foreground">
                {data.connections.length} of {connectionLimit} connections used
              </Text>
              {!data.entitlements.hasAccess ? (
                <Pressable onPress={() => router.push('/paywall')}>
                  <Text className="font-sans-bold text-[11px] text-primary">
                    Get unlimited
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {data.connections.length ? (
              data.connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  removing={removing === connection.id}
                  onRemove={() => remove(connection)}
                />
              ))
            ) : (
              <View className="items-center rounded-[30px] border border-dashed border-border bg-card px-7 py-12">
                <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-muted">
                  <FontAwesomeIcon icon={faPlus} size={25} color="#1a5a5a" />
                </View>
                <Text className="mt-6 text-center font-sans-bold text-[20px] text-foreground">
                  Your accounts belong together
                </Text>
                <Text className="mt-2 text-center font-sans text-[13px] leading-5 text-muted-foreground">
                  Connect a current, savings or credit account to begin building
                  your picture.
                </Text>
              </View>
            )}

            <Text className="px-4 text-center font-sans text-[10px] leading-4 text-muted-foreground">
              Connections are provided by TrueLayer. Genwel cannot move money or
              make payments.
            </Text>
          </View>
        ) : null}
      </Screen>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
