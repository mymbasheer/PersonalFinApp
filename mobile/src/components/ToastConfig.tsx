// mobile/src/components/ToastConfig.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, FONTS } from '../utils/constants';

export const toastConfig = {
  success: ({ text1 }: any) => (
    <View style={{ backgroundColor: COLORS.green, borderRadius: 12, padding: 14, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>✓  {text1}</Text>
    </View>
  ),
  error: ({ text1 }: any) => (
    <View style={{ backgroundColor: COLORS.red, borderRadius: 12, padding: 14, marginHorizontal: 20 }}>
      <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>✗  {text1}</Text>
    </View>
  ),
  info: ({ text1 }: any) => (
    <View style={{ backgroundColor: COLORS.blue, borderRadius: 12, padding: 14, marginHorizontal: 20 }}>
      <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 14 }}>ℹ  {text1}</Text>
    </View>
  ),
};
