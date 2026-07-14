import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'genwel.onboarding.complete.v1';

type OnboardingState = {
  hydrated: boolean;
  complete: boolean;
  hydrate: () => Promise<void>;
  finish: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  hydrated: false,
  complete: false,
  hydrate: async () => {
    const value = await AsyncStorage.getItem(KEY).catch(() => null);
    set({ hydrated: true, complete: value === 'true' });
  },
  finish: async () => {
    await AsyncStorage.setItem(KEY, 'true');
    set({ complete: true });
  },
  reset: async () => {
    await AsyncStorage.removeItem(KEY);
    set({ complete: false });
  },
}));
