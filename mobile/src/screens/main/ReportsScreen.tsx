// mobile/src/screens/main/ReportsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { exportService } from '../../services/exports';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string|null>(null);

  const run = async (key: string, fn: ()=>Promise<void>) => {
    setLoading(key);
    try { await fn(); }
    catch(e:any){ Alert.alert('Export Failed', e.message||'Please try again.'); }
    finally { setLoading(null); }
  };

  const reports = [
    {
      id:'monthly_pdf', icon:'📄', color:COLORS.red, title:'Monthly Summary PDF',
      sub:'Income, expenses, APIT, EPF — professional formatted report',
      badge:'PDF',
      action: async () => {
        const [txns, budgets] = await Promise.all([
          api.get('/transactions?limit=500').then(r=>r.data.transactions||[]),
          api.get('/budgets').then(r=>r.data||{}).catch(()=>({})),
        ]);
        await exportService.monthlyPDF(user, txns, budgets);
      },
    },
    {
      id:'tax_pdf', icon:'◎', color:COLORS.orange, title:'Annual Tax Report PDF',
      sub:'IRD 2025 APIT calculation, slabs, EPF/ETF, WHT, CGT',
      badge:'PDF',
      action: () => exportService.taxPDF(user),
    },
    {
      id:'txn_excel', icon:'📊', color:COLORS.green, title:'Transactions Excel',
      sub:'Full transaction history with category, method, notes',
      badge:'XLSX',
      action: async () => {
        const txns = await api.get('/transactions?limit=1000').then(r=>r.data.transactions||[]);
        await exportService.transactionsXLS(user, txns);
      },
    },
    {
      id:'budget_excel', icon:'📈', color:COLORS.blue, title:'Budget vs Actual Excel',
      sub:'Category-wise budget analysis with variance and status',
      badge:'XLSX',
      action: async () => {
        const [txns, budgets] = await Promise.all([
          api.get('/transactions?limit=1000').then(r=>r.data.transactions||[]),
          api.get('/budgets').then(r=>r.data||{}).catch(()=>({})),
        ]);
        await exportService.budgetXLS(user, txns, budgets);
      },
    },
    {
      id:'loans_excel', icon:'🏦', color:COLORS.purple, title:'Loan Amortisation Excel',
      sub:'Full repayment schedule for all tracked loans',
      badge:'XLSX',
      action: async () => {
        const debts = await api.get('/debts').then(r=>r.data.debts||[]);
        if (!debts.length) { Alert.alert('No loans', 'Add loans in the Debts section first.'); return; }
        await exportService.loansXLS(debts);
      },
    },
    {
      id:'networth_pdf', icon:'💎', color:COLORS.gold, title:'Net Worth Statement PDF',
      sub:'Assets, liabilities, net worth snapshot',
      badge:'PDF',
      action: async () => {
        const [assets, liabs] = await Promise.all([
          api.get('/assets').then(r=>r.data.assets||[]),
          api.get('/liabilities').then(r=>r.data.liabilities||[]),
        ]);
        await exportService.networthPDF(user, assets, liabs);
      },
    },
  ];

  return (
    <ScrollView style={s.root}>
      <Text style={s.title}>Reports & Export</Text>
      <Text style={s.sub}>Professional formatted reports · PDF & Excel · IRD 2025 compliant</Text>

      <View style={s.infoBox}>
        <Text style={s.infoTitle}>📦 Export Libraries</Text>
        <Text style={s.infoText}>• PDF: react-native-html-to-pdf (free){'\n'}• Excel: SheetJS/xlsx (free){'\n'}• Files saved to Downloads folder{'\n'}• Share via WhatsApp, Email, Drive</Text>
      </View>

      {reports.map(r => (
        <TouchableOpacity
          key={r.id}
          style={[s.card, { borderLeftColor: r.color }]}
          onPress={() => run(r.id, r.action)}
          disabled={!!loading}
        >
          <View style={s.cardLeft}>
            <Text style={s.cardIcon}>{r.icon}</Text>
            <View style={s.cardText}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Text style={s.cardTitle}>{r.title}</Text>
                <View style={[s.badge,{backgroundColor:r.color+'20',borderColor:r.color+'50'}]}>
                  <Text style={[s.badgeTxt,{color:r.color}]}>{r.badge}</Text>
                </View>
              </View>
              <Text style={s.cardSub}>{r.sub}</Text>
            </View>
          </View>
          <View style={[s.exportBtn,{backgroundColor:r.color}]}>
            {loading===r.id
              ? <ActivityIndicator size="small" color="#fff"/>
              : <Text style={s.exportBtnTxt}>↓</Text>
            }
          </View>
        </TouchableOpacity>
      ))}

      <View style={s.disclaimerBox}>
        <Text style={s.disclaimerTxt}>
          ⚖️ These reports are for personal reference only. For official IRD submissions, consult a licensed tax advisor or chartered accountant.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  title:         { fontFamily: FONTS.display, fontSize: 28, color: COLORS.text, padding: SPACING.xl, paddingBottom: 4 },
  sub:           { fontSize: 13, color: COLORS.soft, fontFamily: FONTS.regular, paddingHorizontal: SPACING.xl, marginBottom: 16 },
  infoBox:       { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  infoTitle:     { fontSize: 12, color: COLORS.teal, fontFamily: FONTS.bold, marginBottom: 8 },
  infoText:      { fontSize: 12, color: COLORS.soft, fontFamily: FONTS.regular, lineHeight: 20 },
  card:          { backgroundColor: COLORS.card, marginHorizontal: SPACING.xl, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  cardLeft:      { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon:      { fontSize: 26, marginTop: 2 },
  cardText:      { flex: 1 },
  cardTitle:     { fontSize: 14, color: COLORS.text, fontFamily: FONTS.semiBold },
  cardSub:       { fontSize: 11, color: COLORS.soft, fontFamily: FONTS.regular, marginTop: 3, lineHeight: 16 },
  badge:         { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  badgeTxt:      { fontSize: 9, fontFamily: FONTS.bold },
  exportBtn:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  exportBtnTxt:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  disclaimerBox: { backgroundColor: 'rgba(212,168,67,0.06)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.2)', borderRadius: RADIUS.lg, margin: SPACING.xl, padding: SPACING.lg },
  disclaimerTxt: { fontSize: 11, color: COLORS.muted, fontFamily: FONTS.regular, lineHeight: 18 },
});
