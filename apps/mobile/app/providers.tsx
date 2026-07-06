import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type ProvidersProps = { children: React.ReactNode };

// Provider tree: gesture root outermost so everything below can use gestures +
// safe area. Auth is a plain Zustand store (lib/session), so it needs no
// provider — screens read it directly. Add PostHog / RevenueCat providers here
// as those land.
const Providers = ({ children }: ProvidersProps) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>{children}</SafeAreaProvider>
  </GestureHandlerRootView>
);

export default Providers;
