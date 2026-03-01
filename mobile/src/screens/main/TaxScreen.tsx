// mobile/src/screens/main/TaxScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../store/authStore';
import { calcAPIT } from '../../utils/tax';
import { COLORS, FONTS, SPACING, RADIUS, TAX_SLABS_2025 } from '../../utils/constants';

const fmt = (n: number) => Math.round(n).toLocaleString('en-LK');

export default function TaxScreen() {
  const { user } = useAuthStore();
  const [monthly, setMonthly] = useState(user?.monthly_gross || 150000);
  const [tab, setTab] = useState<'calc' | 'guide'>('calc');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const annual = monthly * 12;
  const tax = calcAPIT(annual);
  const eff = annual > 0 ? (tax / annual * 100) : 0;

  const IRD_ITEMS = [
    { k:'epf',  l:'EPF Registration confirmed',      d:'From HR dept or EPF portal — mandatory' },
    { k:'stmt', l:'EPF Annual Statement received',    d:'Issued by Dept. of Labour by March 31' },
    { k:'cert', l:'Employer APIT certificate',        d:'Your employer must issue by end of March' },
    { k:'bank', l:'Bank interest certificates (WHT)',d:'10% WHT certs from all your banks' },
    { k:'other',l:'Other income documents ready',    d:'Rental, freelance, dividend statements' },
    { k:'f177', l:'Form 177 (Tax Return) completed', d:'Available at ird.gov.lk or IRD office' },
    { k:'sub',  l:'Return submitted by Nov 30',       d:'Late filing: LKR 50,000 or 10% of tax' },
  ];
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <ScrollView style={styles.root}>
      <Text style={styles.title}>Tax & IRD</Text>
      <Text style={styles.sub}>Inland Revenue (Amendment) Act No. 2 of 2025</Text>

      <View style={styles.tabBar}>
        {([['calc', '🔢 APIT Calculator'], ['guide', '📋 IRD Return Guide']] as const).map(([t, l]) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'calc' ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MONTHLY GROSS (LKR)</Text>
          <Text style={styles.bigNum}>{monthly.toLocaleString('en-LK')}</Text>
          <Text style={styles.annualLine}>Annual: LKR {fmt(annual)}</Text>
          <Slider
            style={{ height: 40 }}
            minimumValue={50000} maximumValue={800000} step={5000}
            value={monthly} onValueChange={setMonthly}
            minimumTrackTintColor={COLORS.gold}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.gold}
          />
          <View style={styles.grid3}>
            {[
              ['Monthly APIT', fmt(tax / 12), COLORS.red],
              ['Annual APIT',  fmt(tax),       COLORS.orange],
              ['Eff. Rate',    eff.toFixed(1) + '%', COLORS.gold],
              ['EPF (8%)',     fmt(monthly * .08), COLORS.purple],
              ['Net/month',    fmt(monthly - tax/12 - monthly * .08), COLORS.teal],
              ['Annual Net',   fmt((monthly - tax/12 - monthly*.08)*12), COLORS.green],
            ].map(([l, v, c]) => (
              <View key={l as string} style={styles.miniCard}>
                <Text style={styles.miniLabel}>{l as string}</Text>
                <Text style={[styles.miniVal, { color: c as string }]}>{v as string}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.slabHeader}>2025 TAX SLABS — YOUR POSITION</Text>
          {TAX_SLABS_2025.map(s => {
            const cur = annual > s.from && annual <= (s.to === Infinity ? annual + 1 : s.to);
            return (
              <View key={s.from} style={[styles.slabRow, cur && styles.slabActive]}>
                <Text style={styles.slabRange}>LKR {fmt(s.from)} – {s.to === Infinity ? 'Above' : fmt(s.to)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {cur && <View style={styles.youBadge}><Text style={styles.youText}>YOU</Text></View>}
                  <Text style={[styles.slabRate, { color: s.rate === 0 ? COLORS.teal : cur ? COLORS.gold : COLORS.soft }]}>{s.rate}%</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.changesGrid}>
            <Text style={[styles.slabHeader, { marginTop: 18 }]}>KEY 2025 CHANGES</Text>
            {[
              ['Tax-Free Threshold', 'LKR 1.8M/year (LKR 150K/mo)'],
              ['WHT on Bank Interest', '10% (was 5%, from Apr 2025)'],
              ['Capital Gains Tax', '15% on qualifying disposals'],
              ['Personal Relief', 'LKR 3M per annum'],
              ['EPF Employee', '8% of gross salary'],
              ['IRD Filing Deadline', 'November 30 annually'],
            ].map(([k, v]) => (
              <View key={k} style={styles.changeRow}>
                <Text style={styles.changeKey}>{k}</Text>
                <Text style={styles.changeVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.guideHeader}>
            <View>
              <Text style={styles.cardTitle}>IRD Filing Checklist</Text>
              <Text style={styles.guideSubtitle}>FY 2025/26 · Due November 30, 2026</Text>
            </View>
            <Text style={[styles.bigNum, { fontSize: 28 }]}>{done}/{IRD_ITEMS.length}</Text>
          </View>
          <View style={styles.pbarWrap}>
            <View style={[styles.pbarFill, {
              width: `${(done / IRD_ITEMS.length) * 100}%`,
              backgroundColor: done === IRD_ITEMS.length ? COLORS.green : COLORS.gold
            }]} />
          </View>

          {IRD_ITEMS.map(item => (
            <TouchableOpacity
              key={item.k}
              style={[styles.checkRow, checked[item.k] && styles.checkRowDone]}
              onPress={() => setChecked(c => ({ ...c, [item.k]: !c[item.k] }))}
            >
              <View style={[styles.checkbox, checked[item.k] && styles.checkboxDone]}>
                {checked[item.k] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>{item.l}</Text>
                <Text style={styles.checkSub}>{item.d}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>⚠️ IRD Penalties</Text>
            <Text style={styles.warnText}>
              • Late filing: LKR 50,000 or 10% of tax payable (whichever is higher){'\n'}
              • Quarterly advance payments required for self-employed{'\n'}
              • Life insurance relief: up to LKR 100,000 per year deductible{'\n'}
              • NRFC/RFC accounts: special tax treatment applies
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  title:         { fontFamily: FONTS.display, fontSize: 28, color: COLORS.text, padding: SPACING.xl, paddingBottom: 4 },
  sub:           { fontSize: 13, color: COLORS.soft, fontFamily: FONTS.regular, paddingHorizontal: SPACING.xl, marginBottom: 16 },
  tabBar:        { flexDirection: 'row', gap: 4, marginHorizontal: SPACING.xl, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 8, borderWidth: 1, borderColor: COLORS.border },
  tabBtn:        { flex: 1, padding: 9, borderRadius: RADIUS.md, alignItems: 'center' },
  tabActive:     { backgroundColor: COLORS.gold },
  tabText:       { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.medium },
  tabTextActive: { color: COLORS.bg, fontFamily: FONTS.bold },
  card:          { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  cardLabel:     { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 4 },
  cardTitle:     { fontFamily: FONTS.display, fontSize: 18, color: COLORS.text },
  bigNum:        { fontFamily: FONTS.mono, fontSize: 34, fontWeight: '800', color: COLORS.gold },
  annualLine:    { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.regular, marginBottom: 8 },
  grid3:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  miniCard:      { flex: 1, minWidth: 100, backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  miniLabel:     { fontSize: 10, color: COLORS.muted, fontFamily: FONTS.semiBold },
  miniVal:       { fontFamily: FONTS.mono, fontSize: 15, fontWeight: '700', marginTop: 4 },
  slabHeader:    { fontSize: 11, color: COLORS.gold, fontFamily: FONTS.bold, letterSpacing: 1.5, marginTop: 18, marginBottom: 10 },
  slabRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.el, borderRadius: RADIUS.sm, padding: 11, marginBottom: 5, borderWidth: 1, borderColor: COLORS.border },
  slabActive:    { borderColor: 'rgba(212,168,67,0.6)', backgroundColor: 'rgba(212,168,67,0.1)' },
  slabRange:     { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.mono },
  slabRate:      { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700' },
  youBadge:      { backgroundColor: COLORS.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  youText:       { fontSize: 9, color: COLORS.bg, fontFamily: FONTS.bold },
  changesGrid:   {},
  changeRow:     { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.el, borderRadius: RADIUS.sm, padding: 10, marginBottom: 5, borderWidth: 1, borderColor: COLORS.border },
  changeKey:     { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.medium, flex: 1 },
  changeVal:     { fontSize: 12, color: COLORS.text, fontFamily: FONTS.semiBold, flex: 1, textAlign: 'right' },
  guideHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  guideSubtitle: { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.regular, marginTop: 2 },
  pbarWrap:      { height: 6, backgroundColor: COLORS.border, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  pbarFill:      { height: '100%', borderRadius: 6 },
  checkRow:      { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  checkRowDone:  { borderColor: 'rgba(39,174,96,0.4)', backgroundColor: 'rgba(39,174,96,0.06)' },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxDone:  { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkLabel:    { fontSize: 13, color: COLORS.text, fontFamily: FONTS.semiBold },
  checkSub:      { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.regular, marginTop: 2 },
  warnBox:       { backgroundColor: 'rgba(240,100,30,0.08)', borderWidth: 1, borderColor: 'rgba(240,100,30,0.3)', borderRadius: RADIUS.md, padding: 14, marginTop: 14 },
  warnTitle:     { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.bold, marginBottom: 8 },
  warnText:      { color: COLORS.soft, fontSize: 12, fontFamily: FONTS.regular, lineHeight: 20 },
});
