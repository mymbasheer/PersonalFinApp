// mobile/src/screens/main/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { calcAPIT } from '../../utils/tax';
import { COLORS, FONTS, SPACING, RADIUS, EXPENSE_CATEGORIES } from '../../utils/constants';

const fmt  = (n: number) => Math.round(n).toLocaleString('en-LK');
const fmtK = (n: number) => Math.abs(n) >= 1e6 ? `${(n/1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `${(n/1e3).toFixed(1)}K` : `${Math.round(n)}`;
const today = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const [data, setData]         = useState<any>(null);
  const [market, setMarket]     = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const [summary, mkt] = await Promise.all([
        api.get(`/transactions/summary?month=${today()}`),
        api.get('/market/summary').catch(() => null),
      ]);
      setData(summary.data);
      setMarket(mkt?.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const gross   = user?.monthly_gross || 0;
  const annual  = gross * 12;
  const tax     = calcAPIT(annual) / 12;
  const epf     = gross * 0.08;
  const net     = gross - tax - epf;
  const spent   = data?.totalExpense || 0;
  const gold24k = market?.gold?.lkrPerGram?.['24K'];
  const usdLkr  = market?.fx?.usdToLkr;

  const QUICK_ACTIONS = [
    { icon: '▼', label: 'Expenses',   screen: 'Expenses'  },
    { icon: '▲', label: 'Income',     screen: 'Income'    },
    { icon: '📷', label: 'Scan',       screen: 'Expenses'  },
    { icon: '⚡', label: 'CEB Bill',   screen: 'LK Tools'  },
    { icon: '💱', label: 'Currency',   screen: 'LK Tools'  },
    { icon: '🥇', label: 'Gold',       screen: 'LK Tools'  },
    { icon: '💎', label: 'Net Worth',  screen: 'NetWorth'  },
    { icon: '◎',  label: 'Tax',        screen: 'Tax'       },
    { icon: '🛡', label: 'Insurance',  screen: 'Insurance' },
    { icon: '📄', label: 'Reports',    screen: 'Reports'   },
    { icon: '🔔', label: 'Reminders',  screen: 'Reminders' },
    { icon: '✦',  label: 'Advisor',    screen: 'Advisor'   },
  ];

  if (loading) return (
    <View style={styles.loadWrap}><ActivityIndicator size="large" color={COLORS.gold} /></View>
  );

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Text style={styles.heroGreet}>Good day, <Text style={{ color: COLORS.gold }}>{user?.first_name} 👋</Text></Text>
        <Text style={styles.heroSub}>{user?.occupation} · {user?.district}</Text>
        <View style={styles.heroStats}>
          {[
            ['GROSS',   `LKR ${fmtK(gross)}`,    COLORS.text],
            ['NET/MO',  `LKR ${fmtK(net)}`,       COLORS.teal],
            ['APIT/MO', `LKR ${fmtK(tax)}`,       COLORS.orange],
          ].map(([l, v, col]) => (
            <View key={l as string} style={styles.heroStat}>
              <Text style={styles.heroStatL}>{l as string}</Text>
              <Text style={[styles.heroStatV, { color: col as string }]}>{v as string}</Text>
            </View>
          ))}
        </View>
        {/* Live market bar */}
        <View style={styles.marketBar}>
          <Text style={styles.marketItem}>🥇 {gold24k ? `LKR ${fmtK(gold24k)}/g` : '—'}</Text>
          <Text style={styles.marketDivider}>|</Text>
          <Text style={styles.marketItem}>💱 LKR {usdLkr ? usdLkr.toFixed(2) : '—'} / USD</Text>
          {market?.fx?.live && <View style={styles.liveDot} />}
        </View>
      </View>

      {/* ── Stat cards ── */}
      <View style={styles.statGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => nav.navigate('Expenses')}>
          <Text style={styles.statLabel}>SPENT THIS MONTH</Text>
          <Text style={[styles.statVal, { color: COLORS.teal }]}>LKR {fmtK(spent)}</Text>
          <Text style={styles.statSub}>of LKR {fmtK(gross * 0.6)} est. budget</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => nav.navigate('Reminders')}>
          <Text style={styles.statLabel}>REMINDERS</Text>
          <Text style={[styles.statVal, { color: COLORS.orange }]}>View all</Text>
          <Text style={styles.statSub}>Tap to check due dates</Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.qaBtn}
              onPress={() => nav.navigate(a.screen)}
            >
              <Text style={styles.qaIcon}>{a.icon}</Text>
              <Text style={styles.qaLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Recent Transactions ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => nav.navigate('Expenses')}>
            <Text style={{ color: COLORS.gold, fontSize: 12, fontFamily: FONTS.semiBold }}>View all →</Text>
          </TouchableOpacity>
        </View>
        {(data?.byCat || []).slice(0, 5).map((item: any) => {
          const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category) || EXPENSE_CATEGORIES[11];
          return (
            <View key={item.category} style={[styles.txnRow, { borderLeftColor: cat.color }]}>
              <Text style={styles.txnIcon}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnLabel}>{cat.label}</Text>
                <Text style={styles.txnSub}>This month</Text>
              </View>
              <Text style={[styles.txnAmt, { color: COLORS.red }]}>−LKR {fmt(item.total)}</Text>
            </View>
          );
        })}
        {(!data?.byCat?.length) && (
          <Text style={styles.emptyText}>No transactions this month. Add your first expense!</Text>
        )}
      </View>

      {/* ── Footer ── */}
      <Text style={styles.footer}>PersonalFinApp v4.0 · IRD 2025 Compliant · CBSL · LankaPay</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  loadWrap:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  hero:         { backgroundColor: '#0D2040', margin: SPACING.xl, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: '#1F3555' },
  heroGreet:    { fontFamily: FONTS.display, fontSize: 24, color: COLORS.text, marginBottom: 4 },
  heroSub:      { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.soft, marginBottom: 16 },
  heroStats:    { flexDirection: 'row', gap: 20 },
  heroStat:     {},
  heroStatL:    { fontSize: 9, color: COLORS.muted, fontFamily: FONTS.semiBold, letterSpacing: 1 },
  heroStatV:    { fontFamily: FONTS.mono, fontSize: 15, fontWeight: '700', marginTop: 3 },
  marketBar:    { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  marketItem:   { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.mono },
  marketDivider:{ color: COLORS.muted, marginHorizontal: 10 },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green, marginLeft: 8 },
  statGrid:     { flexDirection: 'row', gap: 12, marginHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  statCard:     { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  statLabel:    { fontSize: 9, color: COLORS.muted, fontFamily: FONTS.bold, letterSpacing: 1 },
  statVal:      { fontFamily: FONTS.mono, fontSize: 17, fontWeight: '700', marginVertical: 5 },
  statSub:      { fontSize: 11, color: COLORS.soft, fontFamily: FONTS.regular },
  section:      { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 11, color: COLORS.gold, fontFamily: FONTS.bold, letterSpacing: 1.5, marginBottom: 14 },
  qaGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qaBtn:        { width: '22%', backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  qaIcon:       { fontSize: 20, marginBottom: 4 },
  qaLabel:      { fontSize: 10, color: COLORS.soft, fontFamily: FONTS.medium, textAlign: 'center' },
  txnRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.el, borderRadius: RADIUS.md, padding: 12, marginBottom: 6, borderLeftWidth: 3 },
  txnIcon:      { fontSize: 18, marginRight: 12 },
  txnLabel:     { fontSize: 13, color: COLORS.text, fontFamily: FONTS.medium },
  txnSub:       { fontSize: 11, color: COLORS.soft, fontFamily: FONTS.regular, marginTop: 2 },
  txnAmt:       { fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700' },
  emptyText:    { color: COLORS.muted, fontSize: 13, textAlign: 'center', padding: 16, fontFamily: FONTS.regular },
  footer:       { textAlign: 'center', color: COLORS.muted, fontSize: 10, fontFamily: FONTS.regular, padding: SPACING.xl },
  orange:       { color: COLORS.orange },
});
