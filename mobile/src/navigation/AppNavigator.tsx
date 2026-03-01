// mobile/src/navigation/AppNavigator.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../utils/constants';

// Auth Screens
import LoginScreen      from '../screens/auth/LoginScreen';
import RegisterScreen   from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen  from '../screens/main/DashboardScreen';
import ExpensesScreen   from '../screens/main/ExpensesScreen';
import IncomeScreen     from '../screens/main/IncomeScreen';
import NetWorthScreen   from '../screens/main/NetWorthScreen';
import TaxScreen        from '../screens/main/TaxScreen';
import GoalsScreen      from '../screens/main/GoalsScreen';
import DebtsScreen      from '../screens/main/DebtsScreen';
import InsuranceScreen  from '../screens/main/InsuranceScreen';
import ToolsScreen      from '../screens/main/ToolsScreen';
import ReportsScreen    from '../screens/main/ReportsScreen';
import RemindersScreen  from '../screens/main/RemindersScreen';
import AdvisorScreen    from '../screens/main/AdvisorScreen';
import SettingsScreen   from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICON: Record<string, string> = {
  Dashboard: '⬡', Expenses: '▼', Income: '▲', 'LK Tools': '🇱🇰', Advisor: '✦',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, height: 60 },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
        tabBarIcon: ({ color }) => (
          <View><Tab.Screen name={route.name} /></View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  />
      <Tab.Screen name="Expenses"   component={ExpensesScreen}   />
      <Tab.Screen name="Income"     component={IncomeScreen}     />
      <Tab.Screen name="LK Tools"   component={ToolsScreen}      />
      <Tab.Screen name="Advisor"    component={AdvisorScreen}    />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <>
          <Stack.Screen name="Login"    component={LoginScreen}    />
          <Stack.Screen name="Register" component={RegisterScreen}  />
        </>
      ) : (
        <>
          <Stack.Screen name="Main"      component={MainTabs}        />
          <Stack.Screen name="NetWorth"  component={NetWorthScreen}  />
          <Stack.Screen name="Tax"       component={TaxScreen}       />
          <Stack.Screen name="Goals"     component={GoalsScreen}     />
          <Stack.Screen name="Debts"     component={DebtsScreen}     />
          <Stack.Screen name="Insurance" component={InsuranceScreen} />
          <Stack.Screen name="Reports"   component={ReportsScreen}   />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Settings"  component={SettingsScreen}  />
        </>
      )}
    </Stack.Navigator>
  );
}
