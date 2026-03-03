// mobile/src/screens/main/IncomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { calcAPIT } from '../../utils/tax';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';
const fmt = (n: number) => Math.round(n || 0).toLocaleString('en-LK');
export default function IncomeScreen() {
  const { colors } = useThemeStore();
  const s = getStyles(colors);
  const { user } = useAuthStore();
  const [srcs, setSrcs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ incType: 'Monthly Salary', desc: '', amount: '', frequency: 'Monthly', taxable: true });
  const load = useCallback(async () => { try { const r = await api.get('/income'); setSrcs(r.data.sources || []); } catch { } setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const totalMo = srcs.reduce((a: number, s: any) => a + (s.frequency === 'Monthly' ? s.amount : s.frequency === 'Annual' ? s.amount / 12 : s.amount * 4.33), 0);
  const save = async () => {
    if (!form.desc || !form.amount) { Alert.alert('Required', 'Fill description and amount'); return; }
    setSaving(true);
    try { await api.post('/income', { ...form, amount: Number(form.amount) }); setShowAdd(false); load(); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };
  return (
    <View style={s.root}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}>
        <View style={s.header}><Text style={s.title}>Income Sources</Text><TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}><Text style={s.addBtnText}>+  Add</Text></TouchableOpacity></View>
        <View style={s.statsRow}>
          {[['TOTAL/MONTH', `LKR ${fmt(totalMo)}`, colors.teal], ['ANNUAL GROSS', `LKR ${fmt(totalMo * 12)}`, colors.text], ['APIT/MONTH', `LKR ${fmt(calcAPIT(totalMo * 12) / 12)}`, colors.red]].map(([l, v, c]) => (
            <View key={l as string} style={s.statCard}><Text style={s.statL}>{l as string}</Text><Text style={[s.statV, { color: c as string }]}>{v as string}</Text></View>
          ))}
        </View>
        {srcs.map(inc => (
          <View key={inc.id} style={s.card}>
            <View style={s.cardTop}>
              <View><Text style={s.incType}>{inc.inc_type}</Text><Text style={s.incDesc}>{inc.description}</Text><View style={s.badges}><View style={s.badge}><Text style={s.badgeText}>{inc.frequency}</Text></View><View style={[s.badge, { borderColor: inc.taxable ? colors.orange : colors.green }]}><Text style={[s.badgeText, { color: inc.taxable ? colors.orange : colors.green }]}>{inc.taxable ? 'TAXABLE' : 'TAX-EXEMPT'}</Text></View></View></View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.incAmt}>LKR {fmt(inc.amount)}</Text>
                <Text style={s.incFreq}>per {(inc.frequency || 'month').toLowerCase().replace('monthly', 'month').replace('annual', 'year')}</Text>
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => Alert.alert(
                    'Remove Income Source',
                    'Are you sure you want to remove this income source?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                          await api.delete(`/income/${inc.id}`);
                          load();
                        } },
                    ],
                    { cancelable: true }
                  )}
                >
                  <Text style={s.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {!srcs.length && <View style={s.card}><Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', padding: 16, fontFamily: FONTS.regular }}>No income sources. Tap '+ Add' to get started.</Text></View>}
      </ScrollView>
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}><Text style={s.modalTitle}>Add Income Source</Text><TouchableOpacity onPress={() => setShowAdd(false)} style={s.closeBtn}><Text style={s.closeTxt}>✕</Text></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.label}>INCOME TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.incType} onValueChange={v => setForm(f => ({ ...f, incType: v }))} style={s.picker} dropdownIconColor={colors.soft}>{['Monthly Salary', 'Freelance / Contract', 'Business Income', 'Rental Income', 'Investment Returns', 'Pension', 'Other'].map(o => <Picker.Item key={o} label={o} value={o} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}</Picker></View>
            <Text style={s.label}>DESCRIPTION *</Text>
            <TextInput style={s.input} value={form.desc} onChangeText={v => setForm(f => ({ ...f, desc: v }))} placeholder="e.g. Rental – Colombo 03" placeholderTextColor={colors.muted} />
            <Text style={s.label}>AMOUNT (LKR) *</Text>
            <TextInput style={[s.input, { fontFamily: FONTS.mono, fontSize: 18 }]} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" />
            <Text style={s.label}>FREQUENCY</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))} style={s.picker} dropdownIconColor={colors.soft}>{['Monthly', 'Annual', 'Weekly', 'One-time'].map(o => <Picker.Item key={o} label={o} value={o} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}</Picker></View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color={colors.bg} /> : <Text style={s.saveTxt}>✓  Add Income Source</Text>}</TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl },
  title: { fontFamily: FONTS.display, fontSize: 28, color: colors.text }, addBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, paddingVertical: 9, paddingHorizontal: 16 },
  addBtnText: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 13 }, statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: SPACING.xl, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  statL: { fontSize: 9, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1 }, statV: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.green },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' }, incType: { fontSize: 11, color: colors.muted, fontFamily: FONTS.semiBold, letterSpacing: 0.5 },
  incDesc: { fontFamily: FONTS.display, fontSize: 18, color: colors.text, marginTop: 2 }, badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { borderWidth: 1, borderColor: colors.blue, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.blue, fontSize: 10, fontFamily: FONTS.bold }, incAmt: { fontFamily: FONTS.mono, fontSize: 20, fontWeight: '700', color: colors.green },
  incFreq: { fontSize: 11, color: colors.muted, fontFamily: FONTS.regular, marginTop: 2 },
  removeBtn: { marginTop: 8, backgroundColor: 'rgba(224,82,82,0.15)', borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)', borderRadius: RADIUS.sm, paddingVertical: 4, paddingHorizontal: 10 },
  removeBtnText: { color: colors.red, fontSize: 11, fontFamily: FONTS.medium },
  modal: { flex: 1, backgroundColor: colors.bg, padding: SPACING.xl }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 22, color: colors.text }, closeBtn: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: colors.soft, fontSize: 16 }, label: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  pickerWrap: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden' },
  picker: { color: colors.text, height: 50 }, saveBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  saveTxt: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 15 } });
