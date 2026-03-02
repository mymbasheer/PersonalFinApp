// mobile/src/screens/main/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Biometric } from '../../services/biometric';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

export default function SettingsScreen() {
  const { user, logout, restoreSession } = useAuthStore();
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

  const SettingRow = ({ icon, title, sub, onPress, danger, toggle, toggleVal, onToggle }: any) => (
    <TouchableOpacity style={[s.row, danger && { borderColor: 'rgba(224,82,82,0.3)' }]} onPress={onPress} disabled={toggle}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, danger && { color: COLORS.red }]}>{title}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {toggle ? <Switch value={toggleVal} onValueChange={onToggle} trackColor={{ false: COLORS.border, true: COLORS.gold + '60' }} thumbColor={toggleVal ? COLORS.gold : COLORS.muted} /> : <Text style={s.rowChev}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.root}>
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
        <SettingRow icon="👤" title="Edit Profile" sub="Name, email, employer" onPress={() => setEditProfile(v => !v)} />
        <SettingRow icon="🔑" title="Change Password" sub="SHA-256 hashed · bcrypt rounds 12" onPress={() => setChangePwd(v => !v)} />
        <SettingRow icon="🔐" title="Enroll Biometric" sub="Fingerprint or face ID for quick login" onPress={enrollBiometric} />
      </View>

      {editProfile && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Edit Profile</Text>
          {[
            ['FIRST NAME', form.firstName, (v: any) => setForm(f => ({ ...f, firstName: v }))],
            ['LAST NAME', form.lastName, (v: any) => setForm(f => ({ ...f, lastName: v }))],
            ['EMAIL', form.email, (v: any) => setForm(f => ({ ...f, email: v }))],
            ['EMPLOYER', form.employer, (v: any) => setForm(f => ({ ...f, employer: v }))]
          ].map(([l, v, fn]) => (
            <View key={l as string}><Text style={s.lbl}>{l as string}</Text><TextInput style={s.inp} value={v as string} onChangeText={fn as any} placeholderTextColor={COLORS.muted} /></View>
          ))}
          <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={s.saveTxt}>Save Profile</Text>}
          </TouchableOpacity>
        </View>
      )}

      {changePwd && (
        <View style={s.formCard}>
          <Text style={s.formTitle}>Change Password</Text>
          {[
            ['CURRENT PASSWORD', pwdForm.current, (v: any) => setPwdForm(f => ({ ...f, current: v }))],
            ['NEW PASSWORD (min 8)', pwdForm.next, (v: any) => setPwdForm(f => ({ ...f, next: v }))],
            ['CONFIRM NEW', pwdForm.confirm, (v: any) => setPwdForm(f => ({ ...f, confirm: v }))]
          ].map(([l, v, fn]) => (
            <View key={l as string}><Text style={s.lbl}>{l as string}</Text><TextInput style={s.inp} value={v as string} onChangeText={fn as any} secureTextEntry placeholderTextColor={COLORS.muted} placeholder="••••••••" /></View>
          ))}
          <TouchableOpacity style={s.saveBtn} onPress={savePassword} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={s.saveTxt}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.sectionLbl}>NOTIFICATIONS</Text>
      <View style={s.section}>
        <SettingRow icon="🔔" title="Push Notifications" sub="Reminders, bill alerts, EMI due" toggle toggleVal={notifEnabled} onToggle={setNotifEnabled} />
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
        <SettingRow icon="🚪" title="Sign Out" sub="You will need to login again" danger onPress={() => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }])} />
      </View>

      <Text style={s.footer}>PersonalFinApp · Made for Sri Lanka 🇱🇰{'\n'}IRD · CBSL · CSE · LankaPay Compliant</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  profileCard: { backgroundColor: COLORS.card, margin: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.gold + '30', borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.gold },
  profileName: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.text },
  profileDetail: { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.regular, marginTop: 2 },
  sectionLbl: { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.bold, letterSpacing: 1.5, paddingHorizontal: SPACING.xl, marginBottom: 8, marginTop: 4 },
  section: { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowTitle: { fontSize: 14, color: COLORS.text, fontFamily: FONTS.medium },
  rowSub: { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2 },
  rowChev: { fontSize: 20, color: COLORS.muted },
  formCard: { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  formTitle: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.text, marginBottom: 4 },
  lbl: { fontSize: 11, color: COLORS.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  inp: { backgroundColor: COLORS.el, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.text, fontSize: 14, fontFamily: FONTS.regular },
  saveBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, padding: 13, alignItems: 'center', marginTop: 16 },
  saveTxt: { color: COLORS.bg, fontFamily: FONTS.bold, fontSize: 14 },
  footer: { textAlign: 'center', color: COLORS.muted, fontSize: 11, fontFamily: FONTS.regular, padding: SPACING.xl, lineHeight: 18 },
});
