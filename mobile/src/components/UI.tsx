// mobile/src/components/UI.tsx  — Shared design system components
import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, ScrollView, Modal, ViewStyle, TextStyle
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS, SPACING, RADIUS } from '../utils/constants';
import { useThemeStore } from '../store/themeStore';

// ── Typography
export const Heading = ({ children, style }: any) => {
  const { colors } = useThemeStore(); return (<Text style={[{ fontFamily: FONTS.display, fontSize: 26, fontWeight: '700', color: colors.text }, style]}>{children}</Text>
  );
};
export const Label = ({ children, style }: any) => {
  const { colors } = useThemeStore(); return (<Text style={[{ fontSize: 11, color: colors.soft, letterSpacing: 1, fontWeight: '600', marginBottom: 6 }, style]}>{children}</Text>
  );
};
export const Body = ({ children, style }: any) => {
  const { colors } = useThemeStore(); return (<Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.regular }, style]}>{children}</Text>
  );
};
export const Mono = ({ children, style }: any) => {
  const { colors } = useThemeStore(); return (<Text style={[{ fontFamily: FONTS.mono, color: colors.text }, style]}>{children}</Text>
  );
};

// ── Card
export const Card = ({ children, style }: any) => {
  const { colors } = useThemeStore(); const styles = getStyles(colors); return (<View style={[styles.card, style]}>{children}</View>
  );
};

// ── GradientCard
export const GradientCard = ({ children, style }: any) => {
  const { colors } = useThemeStore(); const styles = getStyles(colors); return (<LinearGradient colors={['#0D2040', '#061528']} style={[styles.card, { borderColor: colors.border }, style]}>
    {children}
  </LinearGradient>
  );
};

// ── Button
interface BtnProps { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean; disabled?: boolean; style?: ViewStyle; fullWidth?: boolean; }
export const Btn = ({ label, onPress, variant = 'primary', loading, disabled, style, fullWidth }: BtnProps) => {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const bg = variant === 'primary' ? colors.gold : variant === 'danger' ? colors.red : variant === 'secondary' ? colors.el : 'transparent';
  const fc = variant === 'primary' ? colors.bg : variant === 'ghost' ? colors.soft : colors.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled || loading ? 0.5 : 1, width: fullWidth ? '100%' : undefined }, variant === 'ghost' && { borderWidth: 1, borderColor: colors.border }, style]}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color={fc} size="small" /> : <Text style={{ color: fc, fontFamily: FONTS.bold, fontSize: 14 }}>{label}</Text>}
    </TouchableOpacity>
  );
};

// ── Input
interface InpProps { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; multiline?: boolean; hint?: string; style?: ViewStyle; required?: boolean; }
export const Inp = ({ label, value, onChange, placeholder, keyboardType = 'default', secureTextEntry, multiline, hint, style, required }: InpProps) => {
  const { colors } = useThemeStore(); const styles = getStyles(colors); return (<View style={{ marginBottom: 16 }}>
    {label && <Label>{label}{required && <Text style={{ color: colors.red }}> *</Text>}</Label>}
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }, style]}
    />
    {hint && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{hint}</Text>}
  </View>
  );
};

// ── ProgressBar
export const PBar = ({ value, max, color, height = 6 }: { value: number; max: number; color?: string; height?: number }) => {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  const barColor = color || colors.gold;
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ height, width: `${pct}%`, backgroundColor: barColor, borderRadius: height }} />
    </View>
  );
};

// ── Badge
export const Badge = ({ text, color }: { text: string; color?: string }) => {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const badgeColor = color || colors.gold;
  return (
    <View style={{ backgroundColor: badgeColor + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: badgeColor + '44' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: badgeColor, letterSpacing: 0.8 }}>{text}</Text>
    </View>
  );
};

// ── Section header
export const SectionHead = ({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) => {
  const { colors } = useThemeStore(); const styles = getStyles(colors); return (<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    <Text style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: '700', color: colors.text }}>{title}</Text>
    {action && actionLabel && (
      <TouchableOpacity onPress={action} style={{ backgroundColor: colors.el, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 12, color: colors.gold, fontWeight: '600' }}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
  );
};

// ── StatCard
export const StatCard = ({ label, value, sub, color, onPress }: { label: string; value: string; sub?: string; color: string; onPress?: () => void }) => {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1} style={[styles.card, { flex: 1, padding: 14 }]}>
      <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', color, marginVertical: 5 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, color: colors.soft }}>{sub}</Text>}
    </TouchableOpacity>
  );
};

// ── EmptyState
export const EmptyState = ({ icon, message }: { icon: string; message: string }) => {
  const { colors } = useThemeStore(); const styles = getStyles(colors); return (<View style={{ alignItems: 'center', paddingVertical: 40 }}>
    <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text>
    <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>{message}</Text>
  </View>
  );
};

// ── BottomSheet Modal
export const Sheet = ({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: any }) => {
  const { colors } = useThemeStore(); return (<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(4,9,20,.8)' }} activeOpacity={1} onPress={onClose} />
    <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '90%' }}>
      <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: '700', color: colors.text }}>{title}</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ color: colors.soft, fontSize: 22 }}>×</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </View>
  </Modal>
  );
};

// ── Screen wrapper
export const Screen = ({ children, scroll = true, style }: { children: any; scroll?: boolean; style?: ViewStyle }) => {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const content = <View style={[{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 16 }, style]}>{children}</View>;
  return scroll ? <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content;
};

// ── Toast config (for react-native-toast-message)
export const ToastConfig = {
  success: ({ text1, text2 }: any) => {
    const { colors } = useThemeStore();
    return (
      <View style={{ backgroundColor: colors.green, borderRadius: 12, padding: 14, marginHorizontal: 20, flexDirection: 'row', gap: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓ {text1}</Text>
      </View>
    );
  },
  error: ({ text1 }: any) => {
    const { colors } = useThemeStore();
    return (
      <View style={{ backgroundColor: colors.red, borderRadius: 12, padding: 14, marginHorizontal: 20 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✗ {text1}</Text>
      </View>
    );
  }
};

const getStyles = (colors: any) => StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.lg, padding: 20 },
  btn: { borderRadius: RADIUS.md, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular }
});
