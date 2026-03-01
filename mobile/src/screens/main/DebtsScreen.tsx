// mobile/src/screens/main/DebtsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const fmt = (n:number) => Math.round(n||0).toLocaleString('en-LK');
const DEBT_TYPES = ['Home Loan','Vehicle Loan','Personal Loan','Leasing','Credit Card','Student Loan','Business Loan','Gold Loan','Other'];
const LENDERS = ['HNB','Sampath Bank','BOC','Commercial Bank','People\'s Bank','NSB','Seylan Bank','NDB','DFCC','Pan Asia','Hatton National','Finance Company','Other'];

export default function DebtsScreen() {
  const [debts, setDebts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', lender:'HNB', debtType:'Personal Loan', balance:'', emi:'', interestRate:'', monthsRemaining:'', color:COLORS.red });
  const setF = (k:string,v:any) => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    try { const r = await api.get('/debts'); setDebts(r.data.debts||[]); } catch {} setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const totalDebt = debts.reduce((s,d)=>s+d.balance,0);
  const totalEMI  = debts.reduce((s,d)=>s+d.emi,0);

  const save = async () => {
    if (!form.name||!form.balance){Alert.alert('Required','Fill name and balance');return;}
    setSaving(true);
    try {
      await api.post('/debts', { name:form.name, lender:form.lender, debtType:form.debtType, balance:Number(form.balance), emi:Number(form.emi)||0, interestRate:Number(form.interestRate)||0, monthsRemaining:Number(form.monthsRemaining)||0, color:form.color });
      setShowAdd(false); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const calcPayoff = (d:any) => {
    if (!d.emi||d.emi<=0) return '—';
    const m = Math.ceil(d.balance/d.emi);
    return m > 120 ? `${(m/12).toFixed(1)} yrs` : `${m} months`;
  };

  const amortRow = (d:any) => {
    const r = (d.interest_rate||0)/100/12;
    if (r===0) return { interest:0, principal:d.emi, balance:Math.max(0,d.balance-d.emi) };
    const interest = d.balance * r;
    const principal = Math.min(d.emi-interest, d.balance);
    return { interest:Math.round(interest), principal:Math.round(principal), balance:Math.max(0,d.balance-principal) };
  };

  return (
    <View style={{flex:1,backgroundColor:COLORS.bg}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.header}>
          <Text style={s.title}>Debts & Loans</Text>
          <TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnTxt}>+  Add Loan</Text></TouchableOpacity>
        </View>
        {debts.length>0&&(
          <View style={s.summary}>
            {[['TOTAL DEBT',`LKR ${fmt(totalDebt)}`,COLORS.red],['TOTAL EMI/MO',`LKR ${fmt(totalEMI)}`,COLORS.orange],['LOANS',`${debts.length}`,COLORS.text]].map(([l,v,c])=>(
              <View key={l as string}><Text style={s.sumLbl}>{l as string}</Text><Text style={[s.sumVal,{color:c as string}]}>{v as string}</Text></View>
            ))}
          </View>
        )}
        {debts.map(d=>{
          const next = amortRow(d);
          const pct = d.balance>0&&d.months_remaining>0?Math.min(100,((d.total_months-d.months_remaining)/Math.max(d.total_months,1))*100):0;
          return (
            <View key={d.id} style={[s.card,{borderLeftColor:d.color||COLORS.red}]}>
              <View style={s.cardTop}>
                <View style={{flex:1}}>
                  <Text style={s.debtName}>{d.name}</Text>
                  <Text style={s.debtLender}>{d.lender} · {d.debt_type}</Text>
                  {d.interest_rate>0&&<Text style={s.debtRate}>{d.interest_rate}% p.a.</Text>}
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={[s.balance,{color:d.color||COLORS.red}]}>LKR {fmt(d.balance)}</Text>
                  {d.emi>0&&<Text style={s.emi}>EMI: LKR {fmt(d.emi)}/mo</Text>}
                  {d.months_remaining>0&&<Text style={s.payoff}>~{calcPayoff(d)} to payoff</Text>}
                </View>
              </View>
              {d.total_months>0&&(
                <>
                  <View style={s.pbarWrap}><View style={[s.pbarFill,{width:`${pct}%`,backgroundColor:pct>80?COLORS.green:pct>40?COLORS.orange:d.color||COLORS.red}]}/></View>
                  <Text style={s.progress}>{pct.toFixed(0)}% paid off · {d.months_remaining} months remaining</Text>
                </>
              )}
              {d.emi>0&&d.interest_rate>0&&(
                <View style={s.amortRow}>
                  <Text style={s.amortLbl}>Next EMI breakdown:</Text>
                  <Text style={s.amortTxt}>Interest: LKR {fmt(next.interest)} | Principal: LKR {fmt(next.principal)}</Text>
                </View>
              )}
              <TouchableOpacity style={s.removeBtn} onPress={()=>Alert.alert('Remove Debt?','',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:async()=>{await api.del(`/debts/${d.id}`);load();}}])}>
                <Text style={s.removeTxt}>Remove Loan</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        {!debts.length&&(
          <View style={s.emptyCard}>
            <Text style={{fontSize:32,textAlign:'center',marginBottom:8}}>💳</Text>
            <Text style={s.emptyTxt}>No debts tracked.</Text>
            <Text style={s.emptySub}>Track home loans, vehicle leases, credit cards and personal loans to manage your debt-to-income ratio.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add Loan / Debt</Text>
            <TouchableOpacity onPress={()=>setShowAdd(false)} style={s.closeBtn}><Text style={{color:COLORS.soft,fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>LOAN NAME *</Text>
            <TextInput style={s.inp} value={form.name} onChangeText={v=>setF('name',v)} placeholder="e.g. HNB Home Loan" placeholderTextColor={COLORS.muted}/>
            <Text style={s.lbl}>LOAN TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.debtType} onValueChange={v=>setF('debtType',v)} style={s.picker} dropdownIconColor={COLORS.soft}>{DEBT_TYPES.map(t=><Picker.Item key={t} label={t} value={t} color={COLORS.text}/>)}</Picker></View>
            <Text style={s.lbl}>LENDER / BANK</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.lender} onValueChange={v=>setF('lender',v)} style={s.picker} dropdownIconColor={COLORS.soft}>{LENDERS.map(l=><Picker.Item key={l} label={l} value={l} color={COLORS.text}/>)}</Picker></View>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1}}>
                <Text style={s.lbl}>OUTSTANDING BALANCE (LKR) *</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.balance} onChangeText={v=>setF('balance',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.lbl}>MONTHLY EMI (LKR)</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.emi} onChangeText={v=>setF('emi',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
            </View>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1}}>
                <Text style={s.lbl}>INTEREST RATE (% p.a.)</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.interestRate} onChangeText={v=>setF('interestRate',v)} placeholder="12" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.lbl}>MONTHS REMAINING</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.monthsRemaining} onChangeText={v=>setF('monthsRemaining',v)} placeholder="36" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
            </View>
            <TouchableOpacity style={[s.saveBtn,{backgroundColor:COLORS.red}]} onPress={save} disabled={saving}>
              {saving?<ActivityIndicator color="#fff"/>:<Text style={s.saveTxt}>✓  Add Loan</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.xl},
  title:{fontFamily:FONTS.display,fontSize:28,color:COLORS.text},
  addBtn:{backgroundColor:COLORS.red,borderRadius:RADIUS.md,paddingVertical:9,paddingHorizontal:16},
  addBtnTxt:{color:'#fff',fontFamily:FONTS.bold,fontSize:13},
  summary:{flexDirection:'row',justifyContent:'space-around',backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.lg,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg},
  sumLbl:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1},
  sumVal:{fontFamily:FONTS.mono,fontSize:14,fontWeight:'700',marginTop:4},
  card:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg,borderLeftWidth:4},
  cardTop:{flexDirection:'row',marginBottom:12},
  debtName:{fontFamily:FONTS.display,fontSize:18,color:COLORS.text},
  debtLender:{fontSize:12,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:2},
  debtRate:{fontSize:11,color:COLORS.orange,fontFamily:FONTS.semiBold,marginTop:3},
  balance:{fontFamily:FONTS.mono,fontSize:17,fontWeight:'800'},
  emi:{fontSize:12,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:3},
  payoff:{fontSize:11,color:COLORS.teal,fontFamily:FONTS.semiBold,marginTop:2},
  pbarWrap:{height:5,backgroundColor:COLORS.border,borderRadius:5,overflow:'hidden',marginBottom:5},
  pbarFill:{height:'100%',borderRadius:5},
  progress:{fontSize:11,color:COLORS.muted,fontFamily:FONTS.regular},
  amortRow:{backgroundColor:COLORS.el,borderRadius:RADIUS.sm,padding:10,marginTop:8},
  amortLbl:{fontSize:10,color:COLORS.muted,fontFamily:FONTS.semiBold,marginBottom:3},
  amortTxt:{fontSize:12,color:COLORS.soft,fontFamily:FONTS.mono},
  removeBtn:{marginTop:12,alignSelf:'flex-start',paddingVertical:4,paddingHorizontal:10,borderWidth:1,borderColor:'rgba(224,82,82,0.3)',borderRadius:RADIUS.sm},
  removeTxt:{color:COLORS.red,fontSize:11,fontFamily:FONTS.medium},
  emptyCard:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.xl*1.5,borderWidth:1,borderColor:COLORS.border,alignItems:'center'},
  emptyTxt:{color:COLORS.text,fontSize:16,fontFamily:FONTS.semiBold,marginBottom:8},
  emptySub:{color:COLORS.muted,fontSize:13,fontFamily:FONTS.regular,textAlign:'center',lineHeight:20},
  modal:{flex:1,backgroundColor:COLORS.bg,padding:SPACING.xl},
  modalHdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},
  modalTitle:{fontFamily:FONTS.display,fontSize:22,color:COLORS.text},
  closeBtn:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.sm,width:32,height:32,alignItems:'center',justifyContent:'center'},
  lbl:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.semiBold,letterSpacing:1,marginBottom:6,marginTop:12},
  inp:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:12,color:COLORS.text,fontSize:14,fontFamily:FONTS.regular},
  pickerWrap:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,overflow:'hidden'},
  picker:{color:COLORS.text,height:50},
  saveBtn:{borderRadius:RADIUS.md,padding:14,alignItems:'center',marginTop:20,marginBottom:32},
  saveTxt:{color:'#fff',fontFamily:FONTS.bold,fontSize:15},
});
