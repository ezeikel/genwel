import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

type ToastKind = 'success' | 'error' | 'info';

type ToastMessage = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastListener = (message: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextId = 0;

const show = (kind: ToastKind, message: string) => {
  const item = { id: ++nextId, kind, message };
  for (const listener of listeners) listener(item);
};

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
};

const presentation = {
  success: {
    backgroundColor: '#123d38',
    icon: faCircleCheck,
    iconColor: '#c9eee7',
  },
  error: {
    backgroundColor: '#5d2925',
    icon: faCircleExclamation,
    iconColor: '#f7d7d2',
  },
  info: {
    backgroundColor: '#263b48',
    icon: faCircleInfo,
    iconColor: '#d6e8f2',
  },
} satisfies Record<ToastKind, object>;

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener: ToastListener = (message) => {
      if (timeout.current) clearTimeout(timeout.current);
      setCurrent(message);
      timeout.current = setTimeout(() => {
        setCurrent((visible) => (visible?.id === message.id ? null : visible));
      }, 3_200);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const style = current ? presentation[current.kind] : presentation.info;

  const viewport = (
    <View
      pointerEvents="box-none"
      style={[styles.viewport, { paddingTop: insets.top + 8 }]}
    >
      {current ? (
        <Animated.View
          key={current.id}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          entering={FadeInDown.duration(220)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="none"
          style={[styles.toast, { backgroundColor: style.backgroundColor }]}
        >
          <FontAwesomeIcon
            icon={style.icon}
            color={style.iconColor}
            size={18}
          />
          <Text style={styles.message}>{current.message}</Text>
        </Animated.View>
      ) : null}
    </View>
  );

  return Platform.OS === 'ios' ? (
    <FullWindowOverlay>{viewport}</FullWindowOverlay>
  ) : (
    viewport
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10_000,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 460,
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#071c19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
});
