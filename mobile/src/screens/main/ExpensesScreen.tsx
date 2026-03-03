// mobile/src/screens/main/ExpensesScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { scanReceipt } from '../../services/ocr';
import { FONTS, SPACING, RADIUS, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

const fmt = (n: number) => Math.round(n || 0).toLocaleString('en-LK');
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ExpensesScreen() {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  const [txns, setTxns] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [budgets, setBudgets] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const month = new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState({
    category: 'food', description: '', amount: '', date: todayStr(),
    paymentMethod: 'Cash', note: '', isRecurring: false });
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        api.get(`/transactions?type=expense&limit=60`),
        api.get(`/transactions/summary?month=${month}`),
      ]);
      setTxns(txRes.data.transactions || []);
      setSummary(sumRes.data);
    } catch { }
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalSpent = summary?.totalExpense || 0;

  const saveExpense = async (fd: typeof form) => {
    if (!fd.description || !fd.amount) { Alert.alert('Required', 'Fill description and amount'); return; }
    setSaving(true);
    try {
      await api.post('/transactions', {
        type: 'expense', category: fd.category, description: fd.description,
        amount: Number(fd.amount), paymentMethod: fd.paymentMethod,
        txnDate: fd.date, note: fd.note, isRecurring: fd.isRecurring });
      setShowAdd(false); setShowScan(false); setOcrResult(null);
      setForm({ category: 'food', description: '', amount: '', date: todayStr(), paymentMethod: 'Cash', note: '', isRecurring: false });
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  const handleScan = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.assets?.[0]?.uri) return;
    setScanning(true);
    try {
      const parsed = await scanReceipt(result.assets[0].uri);
      setOcrResult(parsed);
      setForm(f => ({
        ...f,
        category: parsed.category || 'other',
        amount: String(Math.round(parsed.amount || 0)),
        description: parsed.merchant || 'Receipt',
        date: parsed.date || todayStr() }));
    } catch (e: any) {
      Alert.alert('OCR Failed', e.message + '\nTry a clearer image.');
    } finally { setScanning(false); }
  };

  // ── Add / Scan Form (shared)
  const ExpenseForm = ({ onSave }: { onSave: () => void }) => (
    <ScrollView keyboardShouldPersistTaps="handled">
      {ocrResult && (
        <View style={styles.ocrBadge}>
          <Text style={styles.ocrBadgeText}>✓ Receipt scanned · Confidence: {ocrResult.confidence || 'medium'}</Text>
        </View>
      )}
      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.category} onValueChange={v => setF('category', v)} style={styles.picker} dropdownIconColor={colors.soft}>
          {EXPENSE_CATEGORIES.map(c => <Picker.Item key={c.id} label={`${c.icon}  ${c.label}`} value={c.id} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
        </Picker>
      </View>
      <Text style={styles.label}>DESCRIPTION *</Text>
      <TextInput style={styles.input} value={form.description} onChangeText={v => setF('description', v)} placeholder="What did you spend on?" placeholderTextColor={colors.muted} />
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>AMOUNT (LKR) *</Text>
          <TextInput style={[styles.input, { fontFamily: FONTS.mono }]} value={form.amount} onChangeText={v => setF('amount', v)} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>DATE</Text>
          <TextInput style={styles.input} value={form.date} onChangeText={v => setF('date', v)} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />
        </View>
      </View>
      <Text style={styles.label}>PAYMENT METHOD</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.paymentMethod} onValueChange={v => setF('paymentMethod', v)} style={styles.picker} dropdownIconColor={colors.soft}>
          {PAYMENT_METHODS.map(m => <Picker.Item key={m} label={m} value={m} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
        </Picker>
      </View>
      <Text style={styles.label}>NOTE</Text>
      <TextInput style={styles.input} value={form.note} onChangeText={v => setF('note', v)} placeholder="Optional…" placeholderTextColor={colors.muted} />
      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveBtnText}>✓  Save Expense</Text>}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Expenses</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => { setOcrResult(null); setShowScan(true); }}>
              <Text style={styles.scanBtnText}>📷 Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.addBtnText}>+  Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.overCard}>
          <Text style={styles.overLabel}>SPENT THIS MONTH</Text>
          <Text style={styles.overAmt}>LKR {fmt(totalSpent)}</Text>
          <View style={styles.pbarWrap}>
            <View style={[styles.pbarFill, { width: `${Math.min(100, (totalSpent / 180000) * 100)}%`, backgroundColor: colors.teal }]} />
          </View>
        </View>

        {/* Category breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BY CATEGORY</Text>
          {(summary?.byCat || []).map((item: any) => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category) || EXPENSE_CATEGORIES[11];
            return (
              <View key={item.category} style={styles.catRow}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.catLabelRow}>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                    <Text style={[styles.catAmt, { color: cat.color }]}>LKR {fmt(item.total)}</Text>
                  </View>
                  <View style={styles.pbarWrap}>
                    <View style={[styles.pbarFill, { width: `${Math.min(100, (item.total / Math.max(totalSpent, 1)) * 100)}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
          {!summary?.byCat?.length && <Text style={styles.empty}>No expenses this month.</Text>}
        </View>

        {/* Transaction list */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL TRANSACTIONS</Text>
          {txns.map(t => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === t.category) || EXPENSE_CATEGORIES[11];
            return (
              <View key={t.id} style={[styles.txnRow, { borderLeftColor: cat.color }]}>
                <Text style={styles.txnIcon}>{cat.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnDesc}>{t.description || '—'}</Text>
                  <Text style={styles.txnMeta}>{t.txn_date} · {t.payment_method}</Text>
                </View>
                <Text style={styles.txnAmt}>−LKR {fmt(t.amount)}</Text>
              </View>
            );
          })}
          {!txns.length && <Text style={styles.empty}>No transactions yet.</Text>}
        </View>
      </ScrollView>

      {/* ── Add Expense Modal ── */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ExpenseForm onSave={() => saveExpense(form)} />
        </View>
      </Modal>

      {/* ── Scan Receipt Modal ── */}
      <Modal visible={showScan} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📷 Receipt Scanner</Text>
            <TouchableOpacity onPress={() => setShowScan(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.ocrInfo}>
              <Text style={styles.ocrInfoTitle}>Powered by Google ML Kit OCR</Text>
              <Text style={styles.ocrInfoSub}>Free · On-device · No server upload · English, Sinhala, Tamil</Text>
            </View>
            <TouchableOpacity style={[styles.ocrBtn, scanning && { opacity: 0.6 }]} onPress={handleScan} disabled={scanning}>
              {scanning
                ? <><ActivityIndicator color="#fff" /><Text style={styles.ocrBtnText}>  Scanning receipt…</Text></>
                : <Text style={styles.ocrBtnText}>📷  Upload or Take Photo</Text>
              }
            </TouchableOpacity>
            {ocrResult && <ExpenseForm onSave={() => saveExpense(form)} />}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.md },
  title: { fontFamily: FONTS.display, fontSize: 28, color: colors.text },
  headerBtns: { flexDirection: 'row', gap: 8 },
  scanBtn: { backgroundColor: colors.purple, borderRadius: RADIUS.md, paddingVertical: 9, paddingHorizontal: 14 },
  scanBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  addBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, paddingVertical: 9, paddingHorizontal: 16 },
  addBtnText: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 13 },
  overCard: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg },
  overLabel: { fontSize: 10, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 6 },
  overAmt: { fontFamily: FONTS.mono, fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 12 },
  pbarWrap: { height: 5, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginTop: 4 },
  pbarFill: { height: '100%', borderRadius: 5 },
  section: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 11, color: colors.gold, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catIcon: { fontSize: 20, marginRight: 12, width: 28 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catLabel: { fontSize: 13, color: colors.text, fontFamily: FONTS.medium },
  catAmt: { fontFamily: FONTS.mono, fontSize: 12, fontWeight: '700' },
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.el, borderRadius: RADIUS.md, padding: 11, marginBottom: 6, borderLeftWidth: 3 },
  txnIcon: { fontSize: 18, marginRight: 12 },
  txnDesc: { fontSize: 13, color: colors.text, fontFamily: FONTS.medium },
  txnMeta: { fontSize: 11, color: colors.soft, fontFamily: FONTS.regular, marginTop: 2 },
  txnAmt: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', color: colors.red },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 16, fontFamily: FONTS.regular },
  // Modal
  modalRoot: { flex: 1, backgroundColor: colors.bg, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 22, color: colors.text },
  closeBtn: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: colors.soft, fontSize: 16 },
  label: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  row2: { flexDirection: 'row' },
  pickerWrap: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 4 },
  picker: { color: colors.text, height: 50 },
  saveBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  saveBtnText: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 15 },
  ocrInfo: { backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', borderRadius: RADIUS.md, padding: 14, marginBottom: 16, alignItems: 'center' },
  ocrInfoTitle: { fontSize: 13, color: colors.purple, fontFamily: FONTS.semiBold },
  ocrInfoSub: { fontSize: 11, color: colors.muted, fontFamily: FONTS.regular, marginTop: 4, textAlign: 'center' },
  ocrBtn: { backgroundColor: colors.purple, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  ocrBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  ocrBadge: { backgroundColor: 'rgba(39,174,96,0.1)', borderWidth: 1, borderColor: 'rgba(39,174,96,0.3)', borderRadius: RADIUS.md, padding: 10, marginBottom: 14 },
  ocrBadgeText: { color: colors.green, fontSize: 13, fontFamily: FONTS.semiBold, textAlign: 'center' } });
