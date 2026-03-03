// mobile/src/screens/main/InsuranceScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

const fmt = (n: number) => Math.round(n || 0).toLocaleString('en-LK');
const daysUntil = (d: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
const INS_TYPES = ['Life Insurance', 'Health Insurance', 'Motor Insurance', 'Home Insurance', 'Endowment / Investment', 'Pension Plan', 'Other'];
const PROVIDERS = ['AIA Insurance', 'Ceylinco Life', 'Union Assurance', 'Sri Lanka Insurance', 'HNB Assurance', 'Softlogic Life', 'Allianz Insurance', 'LOLC Insurance', 'Commercial Insurance', 'Other'];
export default function InsuranceScreen() {
  const { colors } = useThemeStore();
  const s = getStyles(colors);
  const COLORS_LIST = [colors.blue, colors.green, colors.purple, colors.teal, colors.gold, colors.orange];
  const [policies, setPolicies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ insType: 'Life Insurance', provider: 'AIA Insurance', policyName: '', premium: '', frequency: 'Monthly', coverage: '', renewalDate: '', color: colors.blue });
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try { const r = await api.get('/insurance'); setPolicies(r.data.policies || []); } catch { } setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalMonthly = policies.filter(p => p.status === 'Active').reduce((s, p) => {
    return s + (p.frequency === 'Monthly' ? p.premium : p.frequency === 'Annual' ? p.premium / 12 : p.frequency === 'Quarterly' ? p.premium / 3 : p.premium);
  }, 0);
  const totalCoverage = policies.filter(p => p.status === 'Active').reduce((s, p) => s + p.coverage, 0);

  const save = async () => {
    if (!form.insType || !form.premium) { Alert.alert('Required', 'Select type and enter premium'); return; }
    setSaving(true);
    try {
      await api.post('/insurance', { insType: form.insType, provider: form.provider, policyName: form.policyName, premium: Number(form.premium), frequency: form.frequency, coverage: Number(form.coverage) || 0, renewalDate: form.renewalDate, color: form.color });
      setShowAdd(false); load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  const toggleStatus = async (p: any) => {
    await api.put(`/insurance/${p.id}`, { status: p.status === 'Active' ? 'Lapsed' : 'Active' });
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}>
        <View style={s.header}>
          <Text style={s.title}>Insurance</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}><Text style={s.addBtnTxt}>+  Add Policy</Text></TouchableOpacity>
        </View>
        {policies.length > 0 && (
          <View style={s.summary}>
            {[['MONTHLY COST', `LKR ${fmt(totalMonthly)}`, colors.orange], ['TOTAL COVERAGE', `LKR ${(totalCoverage / 1e6).toFixed(1)}M`, colors.green], ['POLICIES', `${policies.filter(p => p.status === 'Active').length} active`, colors.text]].map(([l, v, c]) => (
              <View key={l as string}><Text style={s.sumLbl}>{l as string}</Text><Text style={[s.sumVal, { color: c as string }]}>{v as string}</Text></View>
            ))}
          </View>
        )}
        {policies.map(p => {
          const dl = daysUntil(p.renewal_date);
          const urgent = dl !== null && dl <= 30 && dl >= 0;
          const overdue = dl !== null && dl < 0;
          return (
            <View key={p.id} style={[s.card, { borderLeftColor: p.color || colors.blue, opacity: p.status === 'Lapsed' ? 0.6 : 1 }]}>
              <View style={s.cardTop}>
                <View style={[s.typeIcon, { backgroundColor: (p.color || colors.blue) + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{p.ins_type === 'Life Insurance' ? '🛡' : p.ins_type === 'Health Insurance' ? '🏥' : p.ins_type === 'Motor Insurance' ? '🚗' : p.ins_type === 'Home Insurance' ? '🏠' : '💼'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.policyName}>{p.policy_name || p.ins_type}</Text>
                  <Text style={s.provider}>{p.provider}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                    <View style={[s.badge, { borderColor: p.status === 'Active' ? colors.green : colors.muted }]}>
                      <Text style={[s.badgeTxt, { color: p.status === 'Active' ? colors.green : colors.muted }]}>{p.status}</Text>
                    </View>
                    <View style={[s.badge, { borderColor: colors.blue }]}>
                      <Text style={[s.badgeTxt, { color: colors.blue }]}>{p.ins_type}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.premium, { color: p.color || colors.blue }]}>LKR {fmt(p.premium)}</Text>
                  <Text style={s.freq}>/{p.frequency?.toLowerCase() || 'month'}</Text>
                  {p.coverage > 0 && <Text style={s.coverage}>Cover: LKR {fmt(p.coverage)}</Text>}
                </View>
              </View>
              {p.renewal_date && (
                <View style={[s.renewalBadge, { backgroundColor: overdue ? 'rgba(224,82,82,0.1)' : urgent ? 'rgba(245,158,11,0.1)' : 'rgba(29,184,168,0.08)', borderColor: overdue ? colors.red : urgent ? colors.orange : colors.teal }]}>
                  <Text style={[s.renewalTxt, { color: overdue ? colors.red : urgent ? colors.orange : colors.teal }]}>
                    {overdue ? '⚠ Renewal overdue' : urgent ? `🔔 Renews in ${dl} days` : ` Renewal: ${p.renewal_date}`}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleStatus(p)}>
                  <Text style={s.actionTxt}>{p.status === 'Active' ? 'Mark Lapsed' : 'Mark Active'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(224,82,82,0.3)' }]} onPress={() => Alert.alert('Remove Policy?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await api.delete(`/insurance/${p.id}`); load(); } }])}>
                  <Text style={[s.actionTxt, { color: colors.red }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {!policies.length && (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🛡</Text>
            <Text style={s.emptyTxt}>No insurance policies tracked.</Text>
            <Text style={s.emptySub}>Track life, health, motor and home insurance — never miss a renewal.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add Insurance Policy</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.closeBtn}><Text style={{ color: colors.soft, fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>INSURANCE TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.insType} onValueChange={v => setF('insType', v)} style={s.picker} dropdownIconColor={colors.soft}>{INS_TYPES.map(t => <Picker.Item key={t} label={t} value={t} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}</Picker></View>
            <Text style={s.lbl}>PROVIDER</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.provider} onValueChange={v => setF('provider', v)} style={s.picker} dropdownIconColor={colors.soft}>{PROVIDERS.map(p => <Picker.Item key={p} label={p} value={p} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}</Picker></View>
            <Text style={s.lbl}>POLICY NAME / NUMBER</Text>
            <TextInput style={s.inp} value={form.policyName} onChangeText={v => setF('policyName', v)} placeholder="e.g. AIA Platinum Life 2024" placeholderTextColor={colors.muted} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>PREMIUM (LKR) *</Text>
                <TextInput style={[s.inp, { fontFamily: FONTS.mono }]} value={form.premium} onChangeText={v => setF('premium', v)} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lbl}>FREQUENCY</Text>
                <View style={s.pickerWrap}><Picker selectedValue={form.frequency} onValueChange={v => setF('frequency', v)} style={[s.picker, { height: 47 }]} dropdownIconColor={colors.soft}>{['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'].map(f => <Picker.Item key={f} label={f} value={f} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}</Picker></View>
              </View>
            </View>
            <Text style={s.lbl}>COVERAGE AMOUNT (LKR)</Text>
            <TextInput style={[s.inp, { fontFamily: FONTS.mono }]} value={form.coverage} onChangeText={v => setF('coverage', v)} placeholder="e.g. 5000000" placeholderTextColor={colors.muted} keyboardType="numeric" />
            <Text style={s.lbl}>RENEWAL DATE (YYYY-MM-DD)</Text>
            <TextInput style={s.inp} value={form.renewalDate} onChangeText={v => setF('renewalDate', v)} placeholder="2026-12-01" placeholderTextColor={colors.muted} />
            <Text style={s.lbl}>COLOUR TAG</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {COLORS_LIST.map(col => (
                <TouchableOpacity key={col} onPress={() => setF('color', col)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col, borderWidth: form.color === col ? 3 : 0, borderColor: '#fff' }} />
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={s.saveTxt}>✓  Add Policy</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl },
  title: { fontFamily: FONTS.display, fontSize: 28, color: colors.text },
  addBtn: { backgroundColor: colors.blue, borderRadius: RADIUS.md, paddingVertical: 9, paddingHorizontal: 16 },
  addBtnTxt: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  summary: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg },
  sumLbl: { fontSize: 9, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1 },
  sumVal: { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg, borderLeftWidth: 4 },
  cardTop: { flexDirection: 'row' },
  typeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  policyName: { fontFamily: FONTS.display, fontSize: 16, color: colors.text },
  provider: { fontSize: 12, color: colors.soft, fontFamily: FONTS.regular, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  badgeTxt: { fontSize: 9, fontFamily: FONTS.bold },
  premium: { fontFamily: FONTS.mono, fontSize: 16, fontWeight: '800' },
  freq: { fontSize: 11, color: colors.muted, fontFamily: FONTS.regular },
  coverage: { fontSize: 11, color: colors.teal, fontFamily: FONTS.semiBold, marginTop: 3 },
  renewalBadge: { borderWidth: 1, borderRadius: RADIUS.sm, padding: 8, marginTop: 10 },
  renewalTxt: { fontSize: 12, fontFamily: FONTS.semiBold },
  actionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, paddingVertical: 5, paddingHorizontal: 12 },
  actionTxt: { color: colors.soft, fontSize: 11, fontFamily: FONTS.medium },
  emptyCard: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl * 1.5, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  emptyTxt: { color: colors.text, fontSize: 16, fontFamily: FONTS.semiBold, marginBottom: 8 },
  emptySub: { color: colors.muted, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 20 },
  modal: { flex: 1, backgroundColor: colors.bg, padding: SPACING.xl },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 22, color: colors.text },
  closeBtn: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  lbl: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  inp: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  pickerWrap: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden' },
  picker: { color: colors.text, height: 50 },
  saveBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  saveTxt: { color: colors.bg, fontFamily: FONTS.bold, fontSize: 15 }
});
