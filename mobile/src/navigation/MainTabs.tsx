// mobile/src/navigation/MainTabs.tsx
// ─────────────────────────────────────────────────
// Bottom tab navigator with 5 main sections.
// Extracted from AppNavigator for cleaner separation.
// ─────────────────────────────────────────────────

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useThemeStore } from '../store/themeStore';

import DashboardScreen from '../screens/main/DashboardScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import IncomeScreen from '../screens/main/IncomeScreen';
import ToolsScreen from '../screens/main/ToolsScreen';
import AdvisorScreen from '../screens/main/AdvisorScreen';

import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
    Dashboard: '⬡',
    Expenses: '▼',
    Income: '▲',
    'LK Tools': '🇱🇰',
    Advisor: '✦',
};

export function MainTabs() {
    const colors = useThemeStore(state => state.colors);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    height: 60,
                },
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: { fontSize: 10, marginBottom: 4 },
                tabBarIcon: ({ color }) => (
                    <Text style={{ color, fontSize: 18, marginBottom: 2 }}>
                        {TAB_ICONS[route.name as keyof TabParamList] ?? '•'}
                    </Text>
                ),
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Expenses" component={ExpensesScreen} />
            <Tab.Screen name="Income" component={IncomeScreen} />
            <Tab.Screen name="LK Tools" component={ToolsScreen} />
            <Tab.Screen name="Advisor" component={AdvisorScreen} />
        </Tab.Navigator>
    );
}
