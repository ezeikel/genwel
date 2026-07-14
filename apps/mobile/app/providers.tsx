import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PurchasesProvider } from '@/contexts/purchases';
import { BottomSheetProvider } from '@/lib/bottom-sheet';

type ProvidersProps = { children: React.ReactNode };

// Provider tree: gesture root outermost so everything below can use gestures +
// safe area. Auth is a plain Zustand store (lib/session), so it needs no
// provider — screens read it directly. Purchases stays inside the native
// gesture/safe-area roots because its paywall state is shared app-wide.
const Providers = ({ children }: ProvidersProps) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <BottomSheetProvider>
        <PurchasesProvider>{children}</PurchasesProvider>
      </BottomSheetProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default Providers;
