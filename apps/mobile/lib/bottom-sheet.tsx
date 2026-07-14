import type { ComponentType, ReactNode } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

type ProviderProps = { children: ReactNode };
type ModalBottomSheetProps = {
  index: number;
  onIndexChange?: (index: number) => void;
  detents?: (number | 'content')[];
  surface?: ReactNode;
  style?: StyleProp<ViewStyle>;
  nativeOverlay?: boolean;
  scrimColor?: string;
  children?: ReactNode;
};

let BottomSheetProviderImpl: ComponentType<ProviderProps>;
let ModalBottomSheetImpl: ComponentType<ModalBottomSheetProps>;

if (Platform.OS === 'web') {
  BottomSheetProviderImpl = ({ children }) => <>{children}</>;
  ModalBottomSheetImpl = () => null;
} else {
  const native =
    require('@swmansion/react-native-bottom-sheet') as typeof import('@swmansion/react-native-bottom-sheet');
  BottomSheetProviderImpl =
    native.BottomSheetProvider as unknown as ComponentType<ProviderProps>;
  ModalBottomSheetImpl =
    native.ModalBottomSheet as unknown as ComponentType<ModalBottomSheetProps>;
}

export const BottomSheetProvider = BottomSheetProviderImpl;
export const ModalBottomSheet = ModalBottomSheetImpl;
