// mobile/App.tsx
import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useAuthStore } from './src/store/authStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initLocalDB } from './src/services/localDB';
import { toastConfig } from './src/components/ToastConfig';
import { COLORS } from './src/utils/constants';

LogBox.ignoreLogs(['new NativeEventEmitter', 'Possible Unhandled Promise']);

export default function App() {
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    initLocalDB();       // Initialize SQLite on device
    restoreSession();    // Restore JWT session from AsyncStorage
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar backgroundColor={COLORS.bg} barStyle="light-content" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
