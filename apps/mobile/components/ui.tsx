import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Screen = ({
  children,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) => (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#faf9f7' }}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a5a5a"
          />
        ) : undefined
      }
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 126 }}
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);

export const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) => (
  <View className="mb-6 mt-3 flex-row items-start justify-between">
    <View className="flex-1 pr-4">
      <Text className="font-sans-bold text-[29px] tracking-[-1px] text-foreground">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 font-sans text-[14px] leading-5 text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </View>
    {action}
  </View>
);

export const IconButton = ({
  icon,
  label,
  onPress,
}: {
  icon: IconDefinition;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:bg-muted"
  >
    <FontAwesomeIcon icon={icon} size={18} color="#1a5a5a" />
  </Pressable>
);

export const PrimaryButton = ({
  label,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) => (
  <Pressable
    onPress={disabled || busy ? undefined : onPress}
    disabled={disabled || busy}
    accessibilityRole="button"
    accessibilityLabel={label}
    className={`min-h-14 items-center justify-center rounded-2xl px-6 ${
      secondary
        ? 'border border-border bg-card active:bg-muted'
        : 'bg-primary active:bg-teal-deep'
    } ${disabled || busy ? 'opacity-50' : ''}`}
  >
    {busy ? (
      <ActivityIndicator color={secondary ? '#1a5a5a' : '#faf9f7'} />
    ) : (
      <Text
        className={`font-sans-bold text-[15px] ${
          secondary ? 'text-primary' : 'text-primary-foreground'
        }`}
      >
        {label}
      </Text>
    )}
  </Pressable>
);

export const StateView = ({
  title,
  body,
  retry,
  loading = false,
}: {
  title?: string;
  body?: string;
  retry?: () => void;
  loading?: boolean;
}) => (
  <View className="min-h-72 items-center justify-center px-8">
    {loading ? <ActivityIndicator size="large" color="#1a5a5a" /> : null}
    {title ? (
      <Text className="mt-4 text-center font-sans-bold text-[18px] text-foreground">
        {title}
      </Text>
    ) : null}
    {body ? (
      <Text className="mt-2 text-center font-sans text-[14px] leading-5 text-muted-foreground">
        {body}
      </Text>
    ) : null}
    {retry ? (
      <Pressable onPress={retry} className="mt-5 rounded-xl bg-muted px-5 py-3">
        <Text className="font-sans-semibold text-primary">Try again</Text>
      </Pressable>
    ) : null}
  </View>
);

export const Card = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <View className={`rounded-3xl border border-border bg-card p-5 ${className}`}>
    {children}
  </View>
);
