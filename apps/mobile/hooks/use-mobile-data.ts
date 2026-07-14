import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Entitlements } from '@/lib/types';

const responseEntitlements = (value: unknown): Entitlements | null => {
  if (!value || typeof value !== 'object' || !('entitlements' in value)) {
    return null;
  }
  const entitlements = (value as { entitlements?: unknown }).entitlements;
  return entitlements &&
    typeof entitlements === 'object' &&
    'hasAccess' in entitlements &&
    typeof entitlements.hasAccess === 'boolean'
    ? (entitlements as Entitlements)
    : null;
};

export const useMobileData = <T>(path: string) => {
  const token = useSession((state) => state.token);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (refresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }
      const id = ++requestId.current;
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<T>(path, { token });
        if (id === requestId.current) {
          setData(result);
          const entitlements = responseEntitlements(result);
          if (entitlements) useSession.setState({ entitlements });
        }
      } catch (cause) {
        if (id === requestId.current) {
          if (cause instanceof ApiError && cause.status === 401) {
            await useSession.getState().signOut();
            return;
          }
          setError(
            cause instanceof Error ? cause.message : 'Something went wrong',
          );
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [path, token],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestId.current += 1;
      };
    }, [load]),
  );

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    retry: () => load(false),
  };
};
