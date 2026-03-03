// mobile/src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Biometric } from '../../services/biometric';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, biometricLogin } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Enter your mobile number first, then use biometric.');
      return;
    }
    try {
      const { available } = await Biometric.isAvailable();
      if (!available) {
        Alert.alert('Not available', 'Biometric auth is not set up on this device.');
        return;
      }
      const ok = await Biometric.authenticate('Sign in to PersonalFinApp');
      if (ok) await biometricLogin(phone.trim());
    } catch (e: any) {
      Alert.alert('Biometric Failed', e.message || 'Authentication failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.flag}>🇱🇰</Text>
          <Text style={styles.logoText}>
            <Text style={{ color: colors.gold }}>Personal</Text>
            <Text style={{ color: colors.text }}>Fin</Text>
            <Text style={{ color: colors.teal }}>App</Text>
          </Text>
          <Text style={styles.logoSub}>Sri Lanka · Production v4.0</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SIGN IN</Text>

          <Text style={styles.label}>MOBILE NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="07X XXX XXXX"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <TouchableOpacity
            style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.btnGoldText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleBiometric}>
            <Text style={styles.btnOutlineText}>🔐  Fingerprint / Face ID</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New user? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create Account →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>
          Secured with SHA-256 · JWT · WebAuthn Biometric
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  flag: { fontSize: 52, marginBottom: 12 },
  logoText: { fontSize: 34, fontFamily: FONTS.display, marginBottom: 6 },
  logoSub: { fontSize: 13, color: colors.soft, fontFamily: FONTS.regular },
  card: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: colors.border },
  cardLabel: { fontSize: 11, color: colors.gold, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 18 },
  label: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 13, color: colors.text, fontSize: 14, fontFamily: FONTS.regular, marginBottom: 4 },
  btn: { borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 14 },
  btnGold: { backgroundColor: colors.gold },
  btnGoldText: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  btnOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  btnOutlineText: { color: colors.soft, fontFamily: FONTS.medium, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.soft, fontSize: 13, fontFamily: FONTS.regular },
  footerLink: { color: colors.gold, fontSize: 13, fontFamily: FONTS.semiBold },
  versionText: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 24, fontFamily: FONTS.regular } });
