// mobile/src/components/ToastConfig.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { FONTS } from '../utils/constants';
import { useThemeStore } from '../store/themeStore';

export const toastConfig = {
  success: ({ text1 }: any) => {
    const { colors } = useThemeStore();
    return (
      <View style={{ backgroundColor: colors.green, borderRadius: 12, padding: 14, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>✓  {text1}</Text>
      </View>
    );
  },
  error: ({ text1 }: any) => {
    const { colors } = useThemeStore();
    return (
      <View style={{ backgroundColor: colors.red, borderRadius: 12, padding: 14, marginHorizontal: 20 }}>
        <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>✗  {text1}</Text>
      </View>
    );
  },
  info: ({ text1 }: any) => {
    const { colors } = useThemeStore();
    return (
      <View style={{ backgroundColor: colors.blue, borderRadius: 12, padding: 14, marginHorizontal: 20 }}>
        <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>ℹ  {text1}</Text>
      </View>
    );
  }
};
