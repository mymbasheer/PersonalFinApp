// mobile/src/screens/main/SettingsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Biometric } from '../../services/biometric';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

export default function SettingsScreen() {
  // Use selectors to avoid re-renders on unrelated store changes
  const colors = useThemeStore(state => state.colors);
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const s = getStyles(colors);
  const [editProfile, setEditProfile] = useState(false);
  const [changePwd, setChangePwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [form, setForm] = useState({ firstName: user?.first_name || '', lastName: user?.last_name || '', email: user?.email || '', employer: user?.employer || '' });
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', { firstName: form.firstName, lastName: form.lastName, email: form.email, employer: form.employer });
      await restoreSession();
      setEditProfile(false);
      Alert.alert('Saved', 'Profile updated.');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwdForm.next.length < 8) { Alert.alert('Too short', 'Min 8 characters'); return; }
    if (pwdForm.next !== pwdForm.confirm) { Alert.alert('Mismatch', 'Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/users/password', { current: pwdForm.current, newPassword: pwdForm.next });
      setChangePwd(false); setPwdForm({ current: '', next: '', confirm: '' });
      Alert.alert('Done', 'Password updated successfully.');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  const enrollBiometric = async () => {
    try {
      const { available: supported } = await Biometric.isAvailable();
      if (!supported) { Alert.alert('Not available', 'Biometric not supported on this device.'); return; }
      const ok = await Biometric.authenticate('Enroll biometric for PersonalFinApp');
      if (ok) {
        await api.post('/auth/biometric-register', { credentialId: `device_${user?.id}_${Date.now()}` });
        Alert.alert('Enrolled', 'Biometric login enabled! You can now sign in with fingerprint/face.');
      }
    } catch (e: any) { Alert.alert('Failed', e.message); }
  };

  const renderSettingRow = ({ icon, title, sub, onPress, danger, toggle, toggleVal, onToggle }: any) => (
    <TouchableOpacity style={[s.row, danger && { borderColor: 'rgba(224,82,82,0.3)' }]} onPress={onPress} disabled={toggle}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, danger && { color: colors.red }]}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {toggle ? <Switch value={toggleVal} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.gold + '60' }} thumbColor={toggleVal ? colors.gold : colors.muted} /> : <Text style={s.rowChev}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.root} keyboardShouldPersistTaps="always">
      {/* Profile */}
      <View style={s.profileCard}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text></View>
        <View>
          <Text style={s.profileName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={s.profileDetail}>{user?.occupation}</Text>
          <Text style={s.profileDetail}>{user?.district} · {user?.phone}</Text>
        </View>
      </View>

      <Text style={s.sectionLbl}>ACCOUNT</Text>
      <View style={s.section}>
        {renderSettingRow({ icon: '👤', title: 'Edit Profile', sub: 'Name, email, employer', onPress: () => setEditProfile(v => !v) })}
        {renderSettingRow({ icon: '🔑', title: 'Change Password', sub: 'SHA-256 hashed · bcrypt rounds 12', onPress: () => setChangePwd(v => !v) })}
        {renderSettingRow({ icon: '🔐', title: 'Enroll Biometric', sub: 'Fingerprint or face ID for quick login', onPress: enrollBiometric })}
      </View>

      {editProfile && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Edit Profile</Text>

          <Text style={s.lbl}>FIRST NAME</Text>
          <TextInput
            style={s.inp}
            value={form.firstName}
            onChangeText={v => setForm(f => ({ ...f, firstName: v }))}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="words"
          />

          <Text style={s.lbl}>LAST NAME</Text>
          <TextInput
            style={s.inp}
            value={form.lastName}
            onChangeText={v => setForm(f => ({ ...f, lastName: v }))}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="words"
          />

          <Text style={s.lbl}>EMAIL</Text>
          <TextInput
            style={s.inp}
            value={form.email}
            onChangeText={v => setForm(f => ({ ...f, email: v }))}
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.lbl}>EMPLOYER</Text>
          <TextInput
            style={s.inp}
            value={form.employer}
            onChangeText={v => setForm(f => ({ ...f, employer: v }))}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
          />

          <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={s.saveTxt}>Save Profile</Text>}
          </TouchableOpacity>
        </View>
      )}

      {changePwd && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Change Password</Text>

          <Text style={s.lbl}>CURRENT PASSWORD</Text>
          <TextInput
            style={s.inp}
            value={pwdForm.current}
            onChangeText={v => setPwdForm(f => ({ ...f, current: v }))}
            secureTextEntry
            placeholderTextColor={colors.muted}
            placeholder="••••••••"
          />

          <Text style={s.lbl}>NEW PASSWORD (min 8)</Text>
          <TextInput
            style={s.inp}
            value={pwdForm.next}
            onChangeText={v => setPwdForm(f => ({ ...f, next: v }))}
            secureTextEntry
            placeholderTextColor={colors.muted}
            placeholder="••••••••"
          />

          <Text style={s.lbl}>CONFIRM NEW</Text>
          <TextInput
            style={s.inp}
            value={pwdForm.confirm}
            onChangeText={v => setPwdForm(f => ({ ...f, confirm: v }))}
            secureTextEntry
            placeholderTextColor={colors.muted}
            placeholder="••••••••"
          />

          <TouchableOpacity style={s.saveBtn} onPress={savePassword} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={s.saveTxt}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.sectionLbl}>NOTIFICATIONS</Text>
      <View style={s.section}>
        {renderSettingRow({ icon: '🔔', title: 'Push Notifications', sub: 'Reminders, bill alerts, EMI due', toggle: true, toggleVal: notifEnabled, onToggle: setNotifEnabled })}
      </View>

      <Text style={s.sectionLbl}>APPEARANCE</Text>
      <View style={s.section}>
        <View style={[s.row, { paddingVertical: 8 }]}>
          <Text style={s.rowIcon}>🎨</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Theme</Text>
            <Text style={s.rowSub}>Light, Dark, or System</Text>
          </View>
          <View style={{ width: 140, backgroundColor: colors.el, borderRadius: RADIUS.sm, overflow: 'hidden' }}>
            <Picker selectedValue={theme} onValueChange={(val) => setTheme(val)} style={{ color: colors.text, height: Platform.OS === 'ios' ? 80 : 50 }} dropdownIconColor={colors.soft}>
              {['system', 'light', 'dark'].map(t => (
                <Picker.Item key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={t} color={Platform.OS === 'android' ? '#000000' : colors.text} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <Text style={s.sectionLbl}>ABOUT</Text>
      <View style={s.section}>
        <View style={s.row}>
          <Text style={s.rowIcon}>ℹ</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>PersonalFinApp v4.0.0</Text>
            <Text style={s.rowSub}>React Native + Node.js + SQLite · IRD 2025</Text>
          </View>
        </View>
        {[['🗄', 'Storage', 'SQLite (local) + IndexedDB (cloud)'], ['🔐', 'Security', 'bcrypt SHA-256 · JWT · WebAuthn'], ['💱', 'Live Data', 'Frankfurter API (ECB) · Free tier'], ['📷', 'OCR', 'Google ML Kit · On-device · Free'], ['📄', 'Exports', 'jsPDF · SheetJS · Free']].map(([i, t, subInfo]) => (
          <View key={t as string} style={s.row}>
            <Text style={s.rowIcon}>{i as string}</Text>
            <View style={{ flex: 1 }}><Text style={s.rowTitle}>{t as string}</Text><Text style={s.rowSub}>{subInfo as string}</Text></View>
          </View>
        ))}
      </View>

      <Text style={s.sectionLbl}>DANGER ZONE</Text>
      <View style={s.section}>
        {renderSettingRow({ icon: '🚪', title: 'Sign Out', sub: 'You will need to login again', danger: true, onPress: () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]) })}
      </View>

      <Text style={s.footer}>PersonalFinApp · Made for Sri Lanka 🇱🇰{'\n'}IRD · CBSL · CSE · LankaPay Compliant</Text>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  profileCard: { backgroundColor: colors.card, margin: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold + '30', borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: FONTS.bold, fontSize: 20, color: colors.gold },
  profileName: { fontFamily: FONTS.display, fontSize: 20, color: colors.text },
  profileDetail: { fontSize: 12, color: colors.soft, fontFamily: FONTS.regular, marginTop: 2 },
  sectionLbl: { fontSize: 11, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1.5, paddingHorizontal: SPACING.xl, marginBottom: 8, marginTop: 4 },
  section: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowTitle: { fontSize: 14, color: colors.text, fontFamily: FONTS.medium },
  rowSub: { fontSize: 11, color: colors.muted, fontFamily: FONTS.regular, marginTop: 2 },
  rowChev: { fontSize: 20, color: colors.muted },
  formCard: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg },
  formTitle: { fontFamily: FONTS.display, fontSize: 18, color: colors.text, marginBottom: 4 },
  lbl: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  inp: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  saveBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, padding: 13, alignItems: 'center', marginTop: 16 },
  saveTxt: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 14 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 11, fontFamily: FONTS.regular, padding: SPACING.xl, lineHeight: 18 }
});
