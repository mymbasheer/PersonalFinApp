// mobile/src/screens/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/authStore';
import { calcAPIT } from '../../utils/tax';
import { COLORS, FONTS, SPACING, RADIUS, DISTRICTS, OCCUPATIONS, EXPENSE_CATEGORIES } from '../../utils/constants';

const STEPS = ['Welcome', 'Personal', 'Income', 'Budgets', 'Security'];

export default function RegisterScreen({ navigation }: any) {
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const { register }        = useAuthStore();

  const [form, setForm] = useState({
    firstName:'', lastName:'', nic:'', dob:'', gender:'', district:'Colombo',
    occupation:'Salaried – Private Sector', employer:'', phone:'', email:'',
    monthlyGross:'', incomeType:'Monthly Salary', otherIncome:'',
    expenses: {} as Record<string, string>,
    password:'', confirmPassword:'',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setExp = (k: string, v: string) => setForm(f => ({ ...f, expenses: { ...f.expenses, [k]: v } }));

  const fmtLKR = (n: number) => `LKR ${Math.round(n).toLocaleString('en-LK')}`;
  const gross = Number(form.monthlyGross) || 0;
  const apit  = calcAPIT(gross * 12) / 12;
  const epf   = gross * 0.08;
  const net   = gross - apit - epf;
  const totalBudget = Object.values(form.expenses).reduce((a, v) => a + (Number(v) || 0), 0);

  const handleSubmit = async () => {
    if (form.password.length < 8) { Alert.alert('Weak password', 'Minimum 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({
        firstName:    form.firstName,
        lastName:     form.lastName,
        nic:          form.nic,
        dob:          form.dob,
        district:     form.district,
        occupation:   form.occupation,
        employer:     form.employer,
        phone:        form.phone,
        email:        form.email,
        monthlyGross: Number(form.monthlyGross) || 0,
        incomeType:   form.incomeType,
        otherIncome:  Number(form.otherIncome)  || 0,
        expenses:     form.expenses,
        password:     form.password,
      });
    } catch (e: any) {
      Alert.alert('Registration failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar
  const ProgressBar = () => (
    <View style={styles.progRow}>
      {STEPS.map((s, i) => (
        <View key={s} style={{ flex: 1, alignItems: 'center' }}>
          <View style={[styles.progBar, { backgroundColor: i <= step ? COLORS.gold : COLORS.border }]} />
          <Text style={[styles.progLabel, { color: i === step ? COLORS.gold : COLORS.muted }]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  // ── STEP 0: Welcome
  const StepWelcome = () => (
    <View>
      <Text style={styles.stepTitle}>Welcome 🇱🇰</Text>
      <Text style={styles.stepSub}>Sri Lanka's most complete personal finance app</Text>
      {[
        ['🗄', 'SQLite + JWT + Biometric', 'SHA-256 auth, 7-day tokens, fingerprint login'],
        ['💱', 'Live FX Rates', 'Frankfurter API (ECB data) — free, no API key'],
        ['🥇', 'Live Gold Prices', 'XAU/USD real-time converted to LKR'],
        ['📷', 'Real OCR Scanning', 'Google ML Kit — reads receipts on-device'],
        ['📄', 'PDF & Excel Export', 'Professional formatted reports'],
        ['🔔', 'Push Notifications', 'Bill & EMI reminders with local alerts'],
        ['◎',  'IRD 2025 Tax Engine', 'APIT, EPF, WHT, CGT — fully compliant'],
      ].map(([icon, title, sub]) => (
        <View key={title as string} style={styles.featureRow}>
          <Text style={styles.featureIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>{title as string}</Text>
            <Text style={styles.featureSub}>{sub as string}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  // ── STEP 1: Personal Info
  const StepPersonal = () => (
    <View>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>FIRST NAME *</Text>
          <TextInput style={styles.input} value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="Amal" placeholderTextColor={COLORS.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>LAST NAME *</Text>
          <TextInput style={styles.input} value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="Perera" placeholderTextColor={COLORS.muted} />
        </View>
      </View>
      <Text style={styles.label}>NIC NUMBER</Text>
      <TextInput style={styles.input} value={form.nic} onChangeText={v => set('nic', v)} placeholder="200012345678" placeholderTextColor={COLORS.muted} />
      <Text style={styles.label}>MOBILE NUMBER *</Text>
      <TextInput style={styles.input} value={form.phone} onChangeText={v => set('phone', v)} placeholder="07X XXX XXXX" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" />
      <Text style={styles.label}>EMAIL</Text>
      <TextInput style={styles.input} value={form.email} onChangeText={v => set('email', v)} placeholder="you@example.com" placeholderTextColor={COLORS.muted} keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.label}>DISTRICT *</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.district} onValueChange={v => set('district', v)} style={styles.picker} dropdownIconColor={COLORS.soft}>
          {DISTRICTS.map(d => <Picker.Item key={d} label={d} value={d} color={COLORS.text} />)}
        </Picker>
      </View>
      <Text style={styles.label}>OCCUPATION *</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.occupation} onValueChange={v => set('occupation', v)} style={styles.picker} dropdownIconColor={COLORS.soft}>
          {OCCUPATIONS.map(o => <Picker.Item key={o} label={o} value={o} color={COLORS.text} />)}
        </Picker>
      </View>
      <Text style={styles.label}>EMPLOYER (optional)</Text>
      <TextInput style={styles.input} value={form.employer} onChangeText={v => set('employer', v)} placeholder="Company name" placeholderTextColor={COLORS.muted} />
    </View>
  );

  // ── STEP 2: Income
  const StepIncome = () => (
    <View>
      <Text style={styles.stepTitle}>Income Details</Text>
      <Text style={styles.stepSub}>Live IRD 2025 APIT preview as you type</Text>
      <Text style={styles.label}>INCOME TYPE</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.incomeType} onValueChange={v => set('incomeType', v)} style={styles.picker} dropdownIconColor={COLORS.soft}>
          {['Monthly Salary','Freelance / Contract','Business Income','Rental Income','Investment Returns','Pension','Other'].map(o => <Picker.Item key={o} label={o} value={o} color={COLORS.text} />)}
        </Picker>
      </View>
      <Text style={styles.label}>MONTHLY GROSS INCOME (LKR) *</Text>
      <TextInput style={[styles.input, { fontFamily: FONTS.mono, fontSize: 18 }]} value={form.monthlyGross} onChangeText={v => set('monthlyGross', v)} placeholder="185000" placeholderTextColor={COLORS.muted} keyboardType="numeric" />
      {gross > 0 && (
        <View style={styles.previewBox}>
          <View style={styles.row3}>
            <View style={styles.previewStat}>
              <Text style={styles.previewLabel}>APIT/month</Text>
              <Text style={[styles.previewVal, { color: COLORS.red }]}>{fmtLKR(apit)}</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewLabel}>EPF (8%)</Text>
              <Text style={[styles.previewVal, { color: COLORS.purple }]}>{fmtLKR(epf)}</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewLabel}>Net/month</Text>
              <Text style={[styles.previewVal, { color: COLORS.teal }]}>{fmtLKR(net)}</Text>
            </View>
          </View>
        </View>
      )}
      <Text style={styles.label}>OTHER MONTHLY INCOME (LKR)</Text>
      <TextInput style={styles.input} value={form.otherIncome} onChangeText={v => set('otherIncome', v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric" />
      <Text style={styles.hint}>Rental, freelance, dividends, etc.</Text>
    </View>
  );

  // ── STEP 3: Budgets
  const StepBudgets = () => (
    <View>
      <Text style={styles.stepTitle}>Monthly Budgets</Text>
      <Text style={styles.stepSub}>Set spending limits per category (LKR). Skip any that don't apply.</Text>
      {EXPENSE_CATEGORIES.map(cat => (
        <View key={cat.id} style={styles.budgetRow}>
          <Text style={styles.budgetIcon}>{cat.icon}</Text>
          <Text style={styles.budgetLabel}>{cat.label}</Text>
          <TextInput
            style={styles.budgetInput}
            value={form.expenses[cat.id] || ''}
            onChangeText={v => setExp(cat.id, v)}
            placeholder="0"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
          />
        </View>
      ))}
      <View style={styles.budgetTotal}>
        <Text style={{ color: COLORS.teal, fontFamily: FONTS.semiBold, fontSize: 13 }}>Total Monthly Budget</Text>
        <Text style={{ color: COLORS.teal, fontFamily: FONTS.mono, fontSize: 15 }}>LKR {totalBudget.toLocaleString('en-LK')}</Text>
      </View>
    </View>
  );

  // ── STEP 4: Security
  const StepSecurity = () => (
    <View>
      <Text style={styles.stepTitle}>Security Setup</Text>
      <Text style={styles.stepSub}>Your password is hashed with SHA-256 + bcrypt before storing</Text>
      <Text style={styles.label}>PASSWORD (min 8 chars) *</Text>
      <TextInput style={styles.input} value={form.password} onChangeText={v => set('password', v)} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry />
      <Text style={styles.label}>CONFIRM PASSWORD *</Text>
      <TextInput style={styles.input} value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry />
      <View style={styles.securityBox}>
        <Text style={{ color: COLORS.teal, fontFamily: FONTS.bold, fontSize: 12, marginBottom: 10 }}>🔐 Security Features Enabled</Text>
        {['bcrypt password hashing (rounds: 12)','JWT tokens with 7-day expiry','Android Keystore for biometric keys','Google ML Kit OCR (on-device, no upload)','Encrypted SQLite via react-native-sqlite-storage'].map(f => (
          <Text key={f} style={{ color: COLORS.soft, fontSize: 12, fontFamily: FONTS.regular, marginBottom: 4 }}>✓  {f}</Text>
        ))}
      </View>
    </View>
  );

  const canProceed = () => {
    if (step === 1) return form.firstName && form.lastName && form.phone && form.district;
    if (step === 2) return Number(form.monthlyGross) > 0;
    if (step === 4) return form.password.length >= 8 && form.password === form.confirmPassword;
    return true;
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ProgressBar />
        <View style={styles.card}>
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepPersonal />}
          {step === 2 && <StepIncome />}
          {step === 3 && <StepBudgets />}
          {step === 4 && <StepSecurity />}
        </View>

        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={[styles.navBtn, styles.navBack]} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.navBackText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navBtn, styles.navNext, !canProceed() && styles.btnDisabled]}
            disabled={!canProceed() || loading}
            onPress={() => step < 4 ? setStep(s => s + 1) : handleSubmit()}
          >
            {loading
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.navNextText}>{step === 4 ? '🚀 Launch PersonalFinApp' : 'Continue →'}</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.soft, fontSize: 13 }}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flexGrow: 1, padding: SPACING.xl },
  progRow:      { flexDirection: 'row', marginBottom: 24 },
  progBar:      { height: 3, borderRadius: 3, marginBottom: 5 },
  progLabel:    { fontSize: 9, fontFamily: FONTS.semiBold },
  card:         { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  stepTitle:    { fontFamily: FONTS.display, fontSize: 24, color: COLORS.text, marginBottom: 6 },
  stepSub:      { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.soft, marginBottom: 18, lineHeight: 20 },
  label:        { fontSize: 11, color: COLORS.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  hint:         { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 4 },
  input:        { backgroundColor: COLORS.el, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, color: COLORS.text, fontSize: 14, fontFamily: FONTS.regular },
  row2:         { flexDirection: 'row' },
  row3:         { flexDirection: 'row', justifyContent: 'space-between' },
  pickerWrap:   { backgroundColor: COLORS.el, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginBottom: 4, overflow: 'hidden' },
  picker:       { color: COLORS.text, height: 50 },
  previewBox:   { backgroundColor: 'rgba(212,168,67,0.08)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.25)', borderRadius: RADIUS.md, padding: 14, marginTop: 10, marginBottom: 6 },
  previewStat:  { alignItems: 'center', flex: 1 },
  previewLabel: { fontSize: 10, color: COLORS.muted, fontFamily: FONTS.semiBold },
  previewVal:   { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', marginTop: 4 },
  budgetRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 10, marginBottom: 7, borderWidth: 1, borderColor: COLORS.border },
  budgetIcon:   { fontSize: 20, width: 30, textAlign: 'center' },
  budgetLabel:  { flex: 1, color: COLORS.text, fontSize: 13, fontFamily: FONTS.regular, marginLeft: 8 },
  budgetInput:  { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: 8, color: COLORS.text, fontFamily: FONTS.mono, fontSize: 13, width: 100, textAlign: 'right' },
  budgetTotal:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(29,184,168,0.1)', borderWidth: 1, borderColor: 'rgba(29,184,168,0.3)', borderRadius: RADIUS.md, padding: 12, marginTop: 8 },
  securityBox:  { backgroundColor: 'rgba(29,184,168,0.08)', borderWidth: 1, borderColor: 'rgba(29,184,168,0.25)', borderRadius: RADIUS.md, padding: 16, marginTop: 16 },
  featureRow:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  featureIcon:  { fontSize: 20, width: 30, marginRight: 10 },
  featureTitle: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  featureSub:   { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.muted, marginTop: 2 },
  navRow:       { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  navBack:      { backgroundColor: COLORS.el, borderWidth: 1, borderColor: COLORS.border },
  navBackText:  { color: COLORS.soft, fontFamily: FONTS.medium, fontSize: 14 },
  navNext:      { backgroundColor: COLORS.gold, flex: 2 },
  navNextText:  { color: COLORS.bg, fontFamily: FONTS.bold, fontSize: 14 },
  btnDisabled:  { opacity: 0.5 },
});
