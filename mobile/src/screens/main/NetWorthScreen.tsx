// mobile/src/screens/main/NetWorthScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

const fmt = (n: number) => Math.round(n || 0).toLocaleString('en-LK');
const fmtK = (n: number) => Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`;
const ASSET_CATS = ['Cash & Bank', 'Fixed Deposits', 'Shares / Investments', 'Real Estate', 'Vehicle', 'Gold & Jewellery', 'EPF / ETF', 'Business Assets', 'Other'];
const LIAB_CATS = ['Home Loan', 'Vehicle Loan', 'Leasing', 'Personal Loan', 'Credit Card', 'Student Loan', 'Other'];
export default function NetWorthScreen() {
  const { colors } = useThemeStore();
  const s = getStyles(colors);
  const COLOR_LIST = [colors.green, colors.teal, colors.blue, colors.purple, colors.gold, colors.orange, colors.red];
  const [assets, setAssets] = useState<any[]>([]);
  const [liabs, setLiabs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mType, setMType] = useState<'asset' | 'liability'>('asset');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Cash & Bank', value: '', color: colors.green });
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const [aR, lR] = await Promise.all([api.get('/assets'), api.get('/liabilities')]);
      setAssets(aR.data.assets || []); setLiabs(lR.data.liabilities || []);
    } catch { } setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalA = assets.reduce((s, x) => s + x.value, 0);
  const totalL = liabs.reduce((s, x) => s + x.value, 0);
  const nw = totalA - totalL;

  const openAdd = (type: 'asset' | 'liability') => {
    const { colors } = useThemeStore();
    const s = getStyles(colors);
    setMType(type);
    setForm({ name: '', category: type === 'asset' ? 'Cash & Bank' : 'Home Loan', value: '', color: colors.green });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.value) { Alert.alert('Required', 'Fill name and value'); return; }
    setSaving(true);
    try {
      await api.post(mType === 'asset' ? '/assets' : '/liabilities', { name: form.name, category: form.category, value: Number(form.value), color: form.color });
      setShowModal(false); load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  const remove = (id: number, endpoint: string) =>
    Alert.alert('Remove?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await api.delete(`/${endpoint}/${id}`); load(); } }]);

  const ItemSection = ({ title, items, type, total, color }: any) => (
    <View style={s.section}>
      <View style={s.sectionHdr}>
        <Text style={[s.sectionLbl, { color }]}>{title} · LKR {fmtK(total)}</Text>
        <TouchableOpacity style={[s.addBtn, { borderColor: color }]} onPress={() => openAdd(type)}>
          <Text style={[s.addBtnTxt, { color }]}>+  Add</Text>
        </TouchableOpacity>
      </View>
      {items.map((item: any) => (
        <View key={item.id} style={[s.row, { borderLeftColor: item.color || color }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowName}>{item.name}</Text>
            <Text style={s.rowCat}>{item.category}</Text>
          </View>
          <Text style={[s.rowVal, { color }]}>LKR {fmtK(item.value)}</Text>
          <TouchableOpacity style={s.xBtn} onPress={() => remove(item.id, type === 'asset' ? 'assets' : 'liabilities')}>
            <Text style={s.xTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {!items.length && <Text style={s.empty}>No {type === 'asset' ? 'assets' : 'liabilities'} yet. Tap '+ Add'.</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}>
        <View style={s.hero}>
          <Text style={s.heroLbl}>TOTAL NET WORTH</Text>
          <Text style={[s.heroVal, { color: nw >= 0 ? colors.gold : colors.red }]}>LKR {fmt(nw)}</Text>
          <View style={s.heroRow}>
            {[['ASSETS', totalA, colors.green], ['LIABILITIES', totalL, colors.red], ['DEBT RATIO', totalA > 0 ? ((totalL / totalA) * 100).toFixed(1) + '%' : '0%', colors.orange]].map(([l, v, c]) => (
              <View key={l as string}>
                <Text style={s.heroSubLbl}>{l as string}</Text>
                <Text style={[s.heroSubVal, { color: c as string }]}>{typeof v === 'number' ? `LKR ${fmtK(v)}` : v as string}</Text>
              </View>
            ))}
          </View>
          {totalA + totalL > 0 && (
            <View style={{ flexDirection: 'row', height: 6, borderRadius: 6, overflow: 'hidden', marginTop: 16 }}>
              <View style={{ flex: totalA, backgroundColor: colors.green }} />
              <View style={{ flex: totalL, backgroundColor: colors.red }} />
            </View>
          )}
        </View>
        <ItemSection title="ASSETS" items={assets} type="asset" total={totalA} color={colors.green} />
        <ItemSection title="LIABILITIES" items={liabs} type="liability" total={totalL} color={colors.red} />
        <View style={[s.section, { backgroundColor: 'rgba(29,184,168,0.06)', borderColor: 'rgba(29,184,168,0.25)' }]}>
          <Text style={[s.sectionLbl, { color: colors.teal, marginBottom: 10 }]}>💡 NET WORTH TIPS</Text>
          {['Update EPF balance quarterly from EPF portal', 'Revalue property annually at current market price', 'Record vehicle at current market value (not purchase)', 'Track gold jewellery at 22K gram rate', 'Review and close unused credit lines to reduce liabilities'].map(t => (
            <Text key={t} style={{ color: colors.soft, fontSize: 12, fontFamily: FONTS.regular, marginBottom: 5 }}>• {t}</Text>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add {mType === 'asset' ? 'Asset' : 'Liability'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={s.closeBtn}><Text style={{ color: colors.soft, fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>NAME *</Text>
            <TextInput style={s.inp} value={form.name} onChangeText={v => setF('name', v)} placeholder={mType === 'asset' ? 'e.g. NSB Fixed Deposit' : 'e.g. HNB Home Loan'} placeholderTextColor={colors.muted} />
            <Text style={s.lbl}>CATEGORY</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={form.category} onValueChange={v => setF('category', v)} style={s.picker} dropdownIconColor={colors.soft}>
                {(mType === 'asset' ? ASSET_CATS : LIAB_CATS).map(c => <Picker.Item key={c} label={c} value={c} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
              </Picker>
            </View>
            <Text style={s.lbl}>{mType === 'asset' ? 'CURRENT VALUE' : 'OUTSTANDING AMOUNT'} (LKR) *</Text>
            <TextInput style={[s.inp, { fontFamily: FONTS.mono, fontSize: 18 }]} value={form.value} onChangeText={v => setF('value', v)} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" />
            <Text style={s.lbl}>COLOUR TAG</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {COLOR_LIST.map(col => (
                <TouchableOpacity key={col} onPress={() => setF('color', col)}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col, borderWidth: form.color === col ? 3 : 0, borderColor: '#fff' }} />
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: mType === 'asset' ? colors.green : colors.red }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>✓  Add {mType === 'asset' ? 'Asset' : 'Liability'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  hero: { backgroundColor: '#0D2040', margin: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: '#1F3555' },
  heroLbl: { fontSize: 10, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 6 },
  heroVal: { fontFamily: FONTS.mono, fontSize: 38, fontWeight: '800', marginBottom: 16 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroSubLbl: { fontSize: 9, color: colors.muted, fontFamily: FONTS.bold, letterSpacing: 1 },
  heroSubVal: { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', marginTop: 3 },
  section: { backgroundColor: colors.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.lg },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLbl: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1.5 },
  addBtn: { borderWidth: 1, borderRadius: RADIUS.sm, paddingVertical: 5, paddingHorizontal: 12 },
  addBtnTxt: { fontSize: 12, fontFamily: FONTS.bold },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.el, borderRadius: RADIUS.md, padding: 12, marginBottom: 6, borderLeftWidth: 3 },
  rowName: { fontSize: 13, color: colors.text, fontFamily: FONTS.medium },
  rowCat: { fontSize: 11, color: colors.soft, fontFamily: FONTS.regular, marginTop: 2 },
  rowVal: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', marginRight: 10 },
  xBtn: { backgroundColor: 'rgba(224,82,82,0.15)', borderRadius: 6, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: colors.red, fontSize: 11, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: 16, fontFamily: FONTS.regular },
  modal: { flex: 1, backgroundColor: colors.bg, padding: SPACING.xl },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 22, color: colors.text },
  closeBtn: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  lbl: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  inp: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  pickerWrap: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden' },
  picker: { color: colors.text, height: 50 },
  saveBtn: { borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  saveTxt: { color: '#fff', fontFamily: FONTS.bold, fontSize: 15 }
});
