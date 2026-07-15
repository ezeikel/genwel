import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const COMPLETE_KEY = 'genwel.onboarding.complete.v1';
const STAGE_KEY = 'genwel.onboarding.stage.v1';

export type OnboardingStage =
  | 'intro'
  | 'paywall'
  | 'sign-in'
  | 'connect'
  | 'notifications'
  | 'complete';

const isStage = (value: string | null): value is OnboardingStage =>
  value === 'intro' ||
  value === 'paywall' ||
  value === 'sign-in' ||
  value === 'connect' ||
  value === 'notifications' ||
  value === 'complete';

type OnboardingState = {
  hydrated: boolean;
  complete: boolean;
  stage: OnboardingStage;
  hydrate: () => Promise<void>;
  setStage: (stage: Exclude<OnboardingStage, 'complete'>) => Promise<void>;
  finish: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  hydrated: false,
  complete: false,
  stage: 'intro',
  hydrate: async () => {
    const values = await AsyncStorage.multiGet([COMPLETE_KEY, STAGE_KEY]).catch(
      () => [] as [string, string | null][],
    );
    const complete =
      values.find(([key]) => key === COMPLETE_KEY)?.[1] === 'true';
    const storedStage = values.find(([key]) => key === STAGE_KEY)?.[1] ?? null;
    const stage = complete
      ? 'complete'
      : isStage(storedStage) && storedStage !== 'complete'
        ? storedStage
        : 'intro';
    set({ hydrated: true, complete, stage });
  },
  setStage: async (stage) => {
    await AsyncStorage.multiSet([
      [COMPLETE_KEY, 'false'],
      [STAGE_KEY, stage],
    ]);
    set({ complete: false, stage });
  },
  finish: async () => {
    await AsyncStorage.multiSet([
      [COMPLETE_KEY, 'true'],
      [STAGE_KEY, 'complete'],
    ]);
    set({ complete: true, stage: 'complete' });
  },
  reset: async () => {
    await AsyncStorage.multiRemove([COMPLETE_KEY, STAGE_KEY]);
    set({ complete: false, stage: 'intro' });
  },
}));
