// mobile/App.tsx
// ─────────────────────────────────────────────────
// Application entry point.
// Sets up providers, initialises services, listens for
// system theme changes, and renders the navigation tree.
// ─────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { StatusBar, LogBox, Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { AppNavigator } from './src/navigation/AppNavigator';
import { initLocalDB } from './src/services/localDB';
import { toastConfig } from './src/components/ToastConfig';
import { useThemeStore } from './src/store/themeStore';
import { useAuthStore } from './src/store/authStore';

// Suppress known noisy native warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'new NativeEventEmitter',
    'Possible Unhandled Promise',
    'EventEmitter.removeListener',
  ]);
}

export default function App() {
  // Use selectors to prevent App from re-rendering on unrelated store changes
  const colors = useThemeStore(state => state.colors);
  const isDark = useThemeStore(state => state.isDark);
  const initTheme = useThemeStore(state => state.initTheme);
  const updateSystemTheme = useThemeStore(state => state.updateSystemTheme);
  const restoreSession = useAuthStore(state => state.restoreSession);

  useEffect(() => {
    // Initialise services in parallel for fastest startup
    Promise.all([
      initLocalDB().catch(e => console.error('[LocalDB] init failed:', e)),
      restoreSession(),
      initTheme(),
    ]);

    // React to OS theme changes
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      updateSystemTheme(colorScheme);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={isDark ? 'light-content' : 'dark-content'}
          translucent={false}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
