// mobile/src/navigation/AppNavigator.tsx
// ─────────────────────────────────────────────────
// Root stack navigator: Auth flow ↔ Main app.
// Uses typed RootStackParamList for type-safe navigation.
// ─────────────────────────────────────────────────

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main tabs + detail screens
import { MainTabs } from './MainTabs';
import NetWorthScreen from '../screens/main/NetWorthScreen';
import TaxScreen from '../screens/main/TaxScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import DebtsScreen from '../screens/main/DebtsScreen';
import InsuranceScreen from '../screens/main/InsuranceScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import RemindersScreen from '../screens/main/RemindersScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const colors = useThemeStore(state => state.colors);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="NetWorth" component={NetWorthScreen} />
          <Stack.Screen name="Tax" component={TaxScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Debts" component={DebtsScreen} />
          <Stack.Screen name="Insurance" component={InsuranceScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
