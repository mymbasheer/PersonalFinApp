// mobile/src/screens/main/ToolsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import { api } from '../../services/api';
import { FONTS, SPACING, RADIUS, CEB_SLABS_SINGLE, GOLD_KARAT } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

const fmt = (n: number) => Math.round(n).toLocaleString('en-LK');
const TABS = ['⚡ CEB', '💱 Currency', '🥇 Gold', '🚗 Rev. Lic.'];

export default function ToolsScreen() {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const [tab, setTab] = useState(0);
  const [fxData, setFxData] = useState<any>(null);
  const [goldData, setGoldData] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    api.get('/market/summary').then(r => {
      setFxData(r.data.fx);
      setGoldData(r.data.gold);
    }).catch(() => { }).finally(() => setLiveLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>🇱🇰 LK Tools</Text>
        {liveLoading
          ? <ActivityIndicator size="small" color={colors.gold} />
          : <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>{fxData?.live ? 'Live' : 'Indicative'}</Text></View>
        }
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView>
        {tab === 0 && <CEBTab />}
        {tab === 1 && <FXTab fxData={fxData} loading={liveLoading} />}
        {tab === 2 && <GoldTab goldData={goldData} loading={liveLoading} />}
        {tab === 3 && <VehicleTab />}
      </ScrollView>
    </View>
  );
}

// ── CEB Bill Estimator ──────────────────────────
function CEBTab() {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const [units, setUnits] = useState(120);
  const [phase, setPhase] = useState<'single' | 'three'>('single');

  const calcBill = (u: number) => {
    const slabs = CEB_SLABS_SINGLE;
    const slab = slabs.find(s => u <= s.max) || slabs[slabs.length - 1];
    const rate = phase === 'three' ? slab.rate * 1.1 : slab.rate;
    const energy = u * rate;
    const subtotal = energy + slab.fixed;
    const levy = subtotal * 0.02;
    return { energy, fixed: slab.fixed, levy, total: subtotal + levy, rate };
  };
  const bill = calcBill(units);

  return (
    <View style={styles.toolCard}>
      <Text style={styles.toolTitle}>⚡ CEB Electricity Estimator</Text>
      <Text style={styles.toolSub}>2025 Domestic Tariff Schedule</Text>

      <View style={styles.phaseRow}>
        {(['single', 'three'] as const).map(p => (
          <TouchableOpacity key={p} style={[styles.phaseBtn, phase === p && styles.phaseBtnActive]} onPress={() => setPhase(p)}>
            <Text style={[styles.phaseBtnText, phase === p && styles.phaseBtnTextActive]}>{p === 'single' ? 'Single Phase' : 'Three Phase'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>MONTHLY USAGE</Text>
      <Text style={styles.bigVal}>{units} kWh</Text>
      <View style={styles.sliderRow}>
        {[30, 60, 90, 120, 150, 180, 250, 300, 400, 500].map(v => (
          <TouchableOpacity key={v} style={[styles.unitBtn, units === v && styles.unitBtnActive]} onPress={() => setUnits(v)}>
            <Text style={[styles.unitBtnText, units === v && styles.unitBtnTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, { fontFamily: FONTS.mono }]}
        value={String(units)}
        onChangeText={v => setUnits(Number(v) || 0)}
        keyboardType="numeric"
        placeholder="Enter units"
        placeholderTextColor={colors.muted}
      />

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>ESTIMATED BILL</Text>
        <Text style={styles.resultBig}>LKR {fmt(bill.total)}</Text>
        {[
          ['Energy Charge', `${units} kWh × LKR ${bill.rate.toFixed(2)}`, bill.energy, colors.orange],
          ['Fixed Charge', 'Based on consumption slab', bill.fixed, colors.blue],
          ['Govt. Levy (2%)', 'Applied on subtotal', bill.levy, colors.purple],
        ].map(([l, s, v, col]) => (
          <View key={l as string} style={styles.billRow}>
            <View><Text style={styles.billLabel}>{l as string}</Text><Text style={styles.billSub}>{s as string}</Text></View>
            <Text style={[styles.billAmt, { color: col as string }]}>LKR {fmt(v as number)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 {units > 120 ? 'You\'re in a high tariff slab. Reducing below 120 kWh saves significantly.' : 'You\'re in a lower tariff slab. Good consumption!'}
        </Text>
      </View>

      <Text style={styles.slabHeader}>TARIFF SLABS (SINGLE PHASE)</Text>
      {CEB_SLABS_SINGLE.map(s => (
        <View key={s.max} style={[styles.slabRow, units <= s.max && units > (CEB_SLABS_SINGLE[CEB_SLABS_SINGLE.indexOf(s) - 1]?.max || 0) && styles.slabActive]}>
          <Text style={styles.slabRange}>0–{s.max} kWh</Text>
          <Text style={styles.slabRate}>LKR {s.rate.toFixed(2)}/unit + LKR {s.fixed} fixed</Text>
        </View>
      ))}
    </View>
  );
}

// ── Currency Converter ──────────────────────────
function FXTab({ fxData, loading }: { fxData: any, loading: boolean }) {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const rates = fxData?.rates || { LKR: 1, USD: 0.00331, GBP: 0.00261, EUR: 0.00305, AED: 0.01215, SGD: 0.00445, AUD: 0.00514 };
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('LKR');
  const [to, setTo] = useState('USD');
  const currencies = Object.keys(rates);
  const NAMES: Record<string, string> = { LKR: 'Sri Lankan Rupee', USD: 'US Dollar', GBP: 'British Pound', EUR: 'Euro', AED: 'UAE Dirham', SGD: 'Singapore Dollar', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', JPY: 'Japanese Yen', INR: 'Indian Rupee', MYR: 'Malaysian Ringgit', QAR: 'Qatari Riyal', SAR: 'Saudi Riyal' };
  const SYMS: Record<string, string> = { LKR: 'Rs ', USD: '$', GBP: '£', EUR: '€', AED: 'د.إ ', SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥', INR: '₹', MYR: 'RM ', QAR: '﷼', SAR: '﷼' };

  const convert = () => {
    const a = Number(amount) || 0;
    const lkrAmt = a / (rates[from] || 1);
    return lkrAmt * (rates[to] || 1);
  };
  const rate = (rates[to] || 1) / (rates[from] || 1);

  return (
    <View style={styles.toolCard}>
      <Text style={styles.toolTitle}>💱 Currency Converter</Text>
      <Text style={styles.toolSub}>{fxData?.live ? `✓ Live rates · ${fxData.source}` : '⚠ Indicative rates (offline)'}</Text>

      <Text style={styles.label}>AMOUNT</Text>
      <TextInput style={[styles.input, { fontFamily: FONTS.mono, fontSize: 18 }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="1000" placeholderTextColor={colors.muted} />

      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>FROM</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={from} onValueChange={setFrom} style={styles.picker} dropdownIconColor={colors.soft}>
              {currencies.map(c => <Picker.Item key={c} label={`${c} — ${NAMES[c] || c}`} value={c} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
            </Picker>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>TO</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={to} onValueChange={setTo} style={styles.picker} dropdownIconColor={colors.soft}>
              {currencies.map(c => <Picker.Item key={c} label={`${c} — ${NAMES[c] || c}`} value={c} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>{SYMS[from] || ''}{Number(amount).toLocaleString()} {from} =</Text>
        <Text style={styles.resultBig}>{SYMS[to] || ''}{convert().toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</Text>
        <Text style={styles.rateText}>1 {from} = {rate.toFixed(6)} {to}</Text>
      </View>

      <Text style={styles.slabHeader}>LKR 1,000 QUICK RATES</Text>
      {['USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'INR', 'MYR'].map(c => (
        <TouchableOpacity key={c} style={styles.qRateRow} onPress={() => { setFrom('LKR'); setTo(c); setAmount('1000'); }}>
          <Text style={styles.qRateCurr}>{c}</Text>
          <Text style={styles.qRateName}>{NAMES[c] || c}</Text>
          <Text style={styles.qRateVal}>{SYMS[c] || ''}{(1000 * (rates[c] || 0)).toFixed(3)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Gold Price Calculator ──────────────────────
function GoldTab({ goldData, loading }: { goldData: any, loading: boolean }) {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const prices = goldData?.lkrPerGram || { '24K': 26800, '22K': 24567, '18K': 20100 };
  const [grams, setGrams] = useState('10');
  const [karat, setKarat] = useState('22K');
  const karats = Object.keys(GOLD_KARAT);

  const totalVal = (Number(grams) || 0) * (prices[karat] || 0);

  return (
    <View style={styles.toolCard}>
      <Text style={styles.toolTitle}>🥇 Gold Price Calculator</Text>
      <Text style={styles.toolSub}>{goldData?.live ? `✓ Live · USD ${goldData.usdPerOz?.toFixed(0)}/oz · ${goldData.source}` : '⚠ Indicative rates'}</Text>

      <View style={styles.goldQuickRow}>
        {['24K', '22K', '18K'].map(k => (
          <View key={k} style={styles.goldQuickCard}>
            <Text style={styles.goldQuickKarat}>{k}</Text>
            <Text style={styles.goldQuickPrice}>LKR {(prices[k] || 0).toLocaleString('en-LK')}</Text>
            <Text style={styles.goldQuickSub}>per gram</Text>
          </View>
        ))}
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>SOVEREIGN (8g, 22K)</Text>
        <Text style={styles.resultBig}>LKR {((prices['22K'] || 0) * 8).toLocaleString('en-LK')}</Text>
      </View>

      <Text style={styles.slabHeader}>CALCULATE VALUE</Text>
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>WEIGHT (grams)</Text>
          <TextInput style={[styles.input, { fontFamily: FONTS.mono }]} value={grams} onChangeText={setGrams} keyboardType="numeric" placeholder="10" placeholderTextColor={colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>KARAT</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={karat} onValueChange={setKarat} style={styles.picker} dropdownIconColor={colors.soft}>
              {karats.map(k => <Picker.Item key={k} label={k} value={k} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
            </Picker>
          </View>
        </View>
      </View>
      <View style={[styles.resultBox, { backgroundColor: 'rgba(212,168,67,0.1)', borderColor: 'rgba(212,168,67,0.3)' }]}>
        <Text style={styles.resultLabel}>{grams}g of {karat} gold =</Text>
        <Text style={[styles.resultBig, { color: colors.gold }]}>LKR {fmt(totalVal)}</Text>
        <Text style={styles.rateText}>@ LKR {fmt(prices[karat] || 0)}/g</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📌 Sri Lanka Gold Market Info</Text>
        <Text style={styles.infoSub}>• SLSI SLS 196 hallmarking standard applies</Text>
        <Text style={styles.infoSub}>• Import duty: 15% + VAT 18%</Text>
        <Text style={styles.infoSub}>• Capital Gains Tax: 15% (from April 2025)</Text>
        <Text style={styles.infoSub}>• Typical pawn rate: ~75% of market value</Text>
      </View>
    </View>
  );
}

// ── Vehicle Revenue Licence ─────────────────────
function VehicleTab() {
  const { colors } = useThemeStore();
  const styles = getStyles(colors);
  const [vType, setVType] = useState('Car');
  const [cc, setCc] = useState('1600');
  const [year, setYear] = useState('2018');
  const [province, setProvince] = useState('Western');

  const PROVINCES: Record<string, number> = { Western: 0.15, Central: 0.10, Southern: 0.05, Northern: 0.05, Eastern: 0.05, 'North Western': 0.05, 'North Central': 0.05, Uva: 0.05, Sabaragamuwa: 0.05 };
  const calcFee = () => {
    const c = Number(cc), y = Number(year), age = new Date().getFullYear() - y;
    let base = 0;
    if (vType === 'Car' || vType === 'SUV/4WD') {
      const mult = vType === 'SUV/4WD' ? 1.2 : 1;
      if (c <= 1000) base = 6000; else if (c <= 1600) base = 8500; else if (c <= 2000) base = 12000;
      else if (c <= 2500) base = 18000; else if (c <= 3000) base = 25000; else base = 35000;
      base *= mult;
    } else if (vType === 'Motorcycle') {
      if (c <= 125) base = 1200; else if (c <= 200) base = 2500; else base = 4000;
    } else if (vType === 'Three-Wheeler') {
      base = 2800;
    } else {
      base = 9000;
    }
    const ageMult = age > 20 ? 0.75 : age > 10 ? 0.85 : 1;
    const afterAge = base * ageMult;
    const provSurch = afterAge * (PROVINCES[province] || 0.05);
    const subtotal = afterAge + provSurch;
    const vat = subtotal * 0.18;
    return { base, ageMult, afterAge, provSurch, vat, total: subtotal + vat };
  };
  const fee = calcFee();

  return (
    <View style={styles.toolCard}>
      <Text style={styles.toolTitle}>🚗 Revenue Licence Calculator</Text>
      <Text style={styles.toolSub}>Department of Motor Traffic · 2025 Rates</Text>

      <Text style={styles.label}>VEHICLE TYPE</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={vType} onValueChange={setVType} style={styles.picker} dropdownIconColor={colors.soft}>
          {['Car', 'SUV/4WD', 'Motorcycle', 'Three-Wheeler', 'Van/Lorry'].map(v => <Picker.Item key={v} label={v} value={v} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
        </Picker>
      </View>
      {vType !== 'Three-Wheeler' && (
        <>
          <Text style={styles.label}>ENGINE CAPACITY (cc)</Text>
          <TextInput style={[styles.input, { fontFamily: FONTS.mono }]} value={cc} onChangeText={setCc} keyboardType="numeric" placeholder="1600" placeholderTextColor={colors.muted} />
        </>
      )}
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>YEAR OF MANUFACTURE</Text>
          <TextInput style={[styles.input, { fontFamily: FONTS.mono }]} value={year} onChangeText={setYear} keyboardType="numeric" placeholder="2018" placeholderTextColor={colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>PROVINCE</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={province} onValueChange={setProvince} style={styles.picker} dropdownIconColor={colors.soft}>
              {Object.keys(PROVINCES).map(p => <Picker.Item key={p} label={p} value={p} color={Platform.OS === 'android' ? '#000000' : colors.text} />)}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>ANNUAL LICENCE FEE</Text>
        <Text style={[styles.resultBig, { color: colors.teal }]}>LKR {fmt(fee.total)}</Text>
        {[
          ['Base Licence Fee', fee.base],
          [`Age Discount (${((1 - fee.ageMult) * 100).toFixed(0)}%)`, fee.base - fee.afterAge, true],
          [`${province} Surcharge`, fee.provSurch],
          ['VAT (18%)', fee.vat],
        ].map(([l, v, neg]) => (
          <View key={l as string} style={styles.billRow}>
            <Text style={styles.billLabel}>{l as string}</Text>
            <Text style={[styles.billAmt, neg ? { color: colors.green } : {}]}>{neg ? '−' : ''}LKR {fmt(Math.abs(v as number))}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📋 Renewal Guide</Text>
        <Text style={styles.infoSub}>• Deadline: December 31 each year</Text>
        <Text style={styles.infoSub}>• Required: Insurance cert + emission test + previous licence</Text>
        <Text style={styles.infoSub}>• Pay via: LankaPay, HNB, Sampath, BOC, DMT online</Text>
        <Text style={styles.infoSub}>• Office: Your province's DMT office</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.md },
  title: { fontFamily: FONTS.display, fontSize: 26, color: colors.text },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  liveText: { color: colors.green, fontSize: 11, fontFamily: FONTS.semiBold },
  tabBar: { flexDirection: 'row', gap: 4, marginHorizontal: SPACING.xl, marginBottom: SPACING.lg, backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 8, borderWidth: 1, borderColor: colors.border },
  tabBtn: { flex: 1, padding: 9, borderRadius: RADIUS.md, alignItems: 'center' },
  tabActive: { backgroundColor: colors.gold },
  tabText: { fontSize: 11, color: colors.soft, fontFamily: FONTS.medium },
  tabTextActive: { color: colors.bg, fontFamily: FONTS.bold },
  toolCard: { backgroundColor: colors.card, margin: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: colors.border },
  toolTitle: { fontFamily: FONTS.display, fontSize: 22, color: colors.text, marginBottom: 4 },
  toolSub: { fontSize: 12, color: colors.soft, fontFamily: FONTS.regular, marginBottom: 20 },
  label: { fontSize: 11, color: colors.soft, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, padding: 12, color: colors.text, fontSize: 14, fontFamily: FONTS.regular },
  row2: { flexDirection: 'row' },
  pickerWrap: { backgroundColor: colors.el, borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md, overflow: 'hidden' },
  picker: { color: colors.text, height: 50 },
  phaseRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  phaseBtn: { flex: 1, padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  phaseBtnActive: { borderColor: colors.orange, backgroundColor: 'rgba(245,158,11,0.15)' },
  phaseBtnText: { color: colors.soft, fontSize: 13, fontFamily: FONTS.medium },
  phaseBtnTextActive: { color: colors.orange, fontFamily: FONTS.bold },
  bigVal: { fontFamily: FONTS.mono, fontSize: 32, fontWeight: '800', color: colors.orange, marginVertical: 8 },
  sliderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  unitBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.sm, paddingVertical: 5, paddingHorizontal: 10 },
  unitBtnActive: { borderColor: colors.orange, backgroundColor: 'rgba(245,158,11,0.15)' },
  unitBtnText: { color: colors.soft, fontSize: 12, fontFamily: FONTS.mono },
  unitBtnTextActive: { color: colors.orange },
  resultBox: { backgroundColor: 'rgba(29,184,168,0.08)', borderWidth: 1, borderColor: 'rgba(29,184,168,0.3)', borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: 16, marginBottom: 8 },
  resultLabel: { fontSize: 11, color: colors.muted, fontFamily: FONTS.semiBold, letterSpacing: 1, marginBottom: 4 },
  resultBig: { fontFamily: FONTS.mono, fontSize: 30, fontWeight: '800', color: colors.teal, marginBottom: 12 },
  rateText: { fontSize: 12, color: colors.muted, fontFamily: FONTS.regular, marginTop: 4 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  billLabel: { fontSize: 13, color: colors.text, fontFamily: FONTS.medium },
  billSub: { fontSize: 11, color: colors.muted, fontFamily: FONTS.regular },
  billAmt: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', color: colors.orange },
  tipBox: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.md, padding: 12, marginTop: 12 },
  tipText: { color: colors.orange, fontSize: 12, fontFamily: FONTS.regular },
  slabHeader: { fontSize: 11, color: colors.gold, fontFamily: FONTS.bold, letterSpacing: 1.5, marginTop: 18, marginBottom: 10 },
  slabRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.el, borderRadius: RADIUS.sm, padding: 10, marginBottom: 5, borderWidth: 1, borderColor: colors.border },
  slabActive: { borderColor: colors.orange, backgroundColor: 'rgba(245,158,11,0.12)' },
  slabRange: { color: colors.soft, fontSize: 12, fontFamily: FONTS.mono },
  slabRate: { color: colors.orange, fontSize: 11, fontFamily: FONTS.regular },
  qRateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.el, borderRadius: RADIUS.md, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  qRateCurr: { fontFamily: FONTS.mono, fontWeight: '700', color: colors.text, width: 45 },
  qRateName: { flex: 1, color: colors.soft, fontSize: 12, fontFamily: FONTS.regular },
  qRateVal: { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', color: colors.blue },
  goldQuickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  goldQuickCard: { flex: 1, backgroundColor: colors.el, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  goldQuickKarat: { fontFamily: FONTS.mono, fontWeight: '700', color: colors.gold, fontSize: 14 },
  goldQuickPrice: { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 5 },
  goldQuickSub: { fontSize: 10, color: colors.muted, fontFamily: FONTS.regular, marginTop: 2 },
  infoBox: { backgroundColor: 'rgba(58,141,222,0.08)', borderWidth: 1, borderColor: 'rgba(58,141,222,0.3)', borderRadius: RADIUS.md, padding: 14, marginTop: 14 },
  infoText: { color: colors.blue, fontSize: 13, fontFamily: FONTS.bold, marginBottom: 8 },
  infoSub: { color: colors.soft, fontSize: 12, fontFamily: FONTS.regular, marginBottom: 4 }
});
