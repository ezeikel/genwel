import { faArrowDown, faArrowUp } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { API_BASE } from '@/lib/api';
import { categoryLabel, money, shortDate } from '@/lib/format';
import type { ApiTransaction } from '@/lib/types';

export const TransactionRow = ({
  transaction,
}: {
  transaction: ApiTransaction;
}) => {
  const debit = transaction.amount < 0;
  const name = transaction.merchantName || transaction.description;
  return (
    <View className="flex-row items-center gap-3 border-b border-border/70 py-3.5 last:border-b-0">
      <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-muted">
        {transaction.merchantDomain ? (
          <Image
            source={{
              uri: `${API_BASE}/api/merchant-logo?domain=${encodeURIComponent(
                transaction.merchantDomain,
              )}`,
            }}
            style={{ width: 28, height: 28, borderRadius: 7 }}
            contentFit="contain"
            transition={120}
          />
        ) : (
          <FontAwesomeIcon
            icon={debit ? faArrowUp : faArrowDown}
            size={15}
            color={debit ? '#667a78' : '#16825d'}
          />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="font-sans-semibold text-[14px] text-foreground"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-sans text-[11px] text-muted-foreground"
        >
          {categoryLabel(transaction.category)} · {transaction.accountName} ·{' '}
          {shortDate(transaction.timestamp)}
        </Text>
      </View>
      <Text
        className={`font-sans-bold text-[14px] tabular-nums ${
          debit ? 'text-foreground' : 'text-success'
        }`}
      >
        {debit ? '−' : '+'}
        {money(Math.abs(transaction.amount), transaction.currency)}
      </Text>
    </View>
  );
};
