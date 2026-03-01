// mobile/src/screens/main/IncomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { calcAPIT } from '../../utils/tax';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';
const fmt = (n:number) => Math.round(n||0).toLocaleString('en-LK');
export default function IncomeScreen() {
  const { user } = useAuthStore();
  const [srcs, setSrcs] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ incType:'Monthly Salary', desc:'', amount:'', frequency:'Monthly', taxable:true });
  const load = useCallback(async () => { try { const r = await api.get('/income'); setSrcs(r.data.sources||[]); } catch{} setRefreshing(false); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const totalMo = srcs.reduce((a:number,s:any) => a + (s.frequency==='Monthly'?s.amount:s.frequency==='Annual'?s.amount/12:s.amount*4.33), 0);
  const save = async () => {
    if (!form.desc || !form.amount) { Alert.alert('Required','Fill description and amount'); return; }
    setSaving(true);
    try { await api.post('/income', {...form, amount: Number(form.amount)}); setShowAdd(false); load(); }
    catch(e:any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };
  return (
    <View style={s.root}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.header}><Text style={s.title}>Income Sources</Text><TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnText}>+  Add</Text></TouchableOpacity></View>
        <View style={s.statsRow}>
          {[['TOTAL/MONTH',`LKR ${fmt(totalMo)}`,COLORS.teal],['ANNUAL GROSS',`LKR ${fmt(totalMo*12)}`,COLORS.text],['APIT/MONTH',`LKR ${fmt(calcAPIT(totalMo*12)/12)}`,COLORS.red]].map(([l,v,c])=>(
            <View key={l as string} style={s.statCard}><Text style={s.statL}>{l as string}</Text><Text style={[s.statV,{color:c as string}]}>{v as string}</Text></View>
          ))}
        </View>
        {srcs.map(inc => (
          <View key={inc.id} style={s.card}>
            <View style={s.cardTop}>
              <View><Text style={s.incType}>{inc.inc_type}</Text><Text style={s.incDesc}>{inc.description}</Text><View style={s.badges}><View style={s.badge}><Text style={s.badgeText}>{inc.frequency}</Text></View><View style={[s.badge,{borderColor:inc.taxable?COLORS.orange:COLORS.green}]}><Text style={[s.badgeText,{color:inc.taxable?COLORS.orange:COLORS.green}]}>{inc.taxable?'TAXABLE':'TAX-EXEMPT'}</Text></View></View></View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={s.incAmt}>LKR {fmt(inc.amount)}</Text>
                <Text style={s.incFreq}>per {(inc.frequency||'month').toLowerCase().replace('monthly','month').replace('annual','year')}</Text>
                <TouchableOpacity style={s.removeBtn} onPress={async()=>{if(!confirm('Remove?'))return;await api.del(`/income/${inc.id}`);load();}}>
                  <Text style={s.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {!srcs.length && <View style={s.card}><Text style={{color:COLORS.muted,fontSize:13,textAlign:'center',padding:16,fontFamily:FONTS.regular}}>No income sources. Tap '+ Add' to get started.</Text></View>}
      </ScrollView>
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}><Text style={s.modalTitle}>Add Income Source</Text><TouchableOpacity onPress={()=>setShowAdd(false)} style={s.closeBtn}><Text style={s.closeTxt}>✕</Text></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.label}>INCOME TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.incType} onValueChange={v=>setForm(f=>({...f,incType:v}))} style={s.picker} dropdownIconColor={COLORS.soft}>{['Monthly Salary','Freelance / Contract','Business Income','Rental Income','Investment Returns','Pension','Other'].map(o=><Picker.Item key={o} label={o} value={o} color={COLORS.text}/>)}</Picker></View>
            <Text style={s.label}>DESCRIPTION *</Text>
            <TextInput style={s.input} value={form.desc} onChangeText={v=>setForm(f=>({...f,desc:v}))} placeholder="e.g. Rental – Colombo 03" placeholderTextColor={COLORS.muted}/>
            <Text style={s.label}>AMOUNT (LKR) *</Text>
            <TextInput style={[s.input,{fontFamily:FONTS.mono,fontSize:18}]} value={form.amount} onChangeText={v=>setForm(f=>({...f,amount:v}))} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
            <Text style={s.label}>FREQUENCY</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.frequency} onValueChange={v=>setForm(f=>({...f,frequency:v}))} style={s.picker} dropdownIconColor={COLORS.soft}>{['Monthly','Annual','Weekly','One-time'].map(o=><Picker.Item key={o} label={o} value={o} color={COLORS.text}/>)}</Picker></View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>{saving?<ActivityIndicator color={COLORS.bg}/>:<Text style={s.saveTxt}>✓  Add Income Source</Text>}</TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.bg}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.xl},
  title:{fontFamily:FONTS.display,fontSize:28,color:COLORS.text}, addBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,paddingVertical:9,paddingHorizontal:16},
  addBtnText:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:13}, statsRow:{flexDirection:'row',gap:8,marginHorizontal:SPACING.xl,marginBottom:16},
  statCard:{flex:1,backgroundColor:COLORS.card,borderRadius:RADIUS.md,padding:12,borderWidth:1,borderColor:COLORS.border},
  statL:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1}, statV:{fontFamily:FONTS.mono,fontSize:13,fontWeight:'700',marginTop:4},
  card:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.lg,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:12,borderLeftWidth:4,borderLeftColor:COLORS.green},
  cardTop:{flexDirection:'row',justifyContent:'space-between'}, incType:{fontSize:11,color:COLORS.muted,fontFamily:FONTS.semiBold,letterSpacing:0.5},
  incDesc:{fontFamily:FONTS.display,fontSize:18,color:COLORS.text,marginTop:2}, badges:{flexDirection:'row',gap:6,marginTop:8},
  badge:{borderWidth:1,borderColor:COLORS.blue,borderRadius:10,paddingHorizontal:8,paddingVertical:2},
  badgeText:{color:COLORS.blue,fontSize:10,fontFamily:FONTS.bold}, incAmt:{fontFamily:FONTS.mono,fontSize:20,fontWeight:'700',color:COLORS.green},
  incFreq:{fontSize:11,color:COLORS.muted,fontFamily:FONTS.regular,marginTop:2},
  removeBtn:{marginTop:8,backgroundColor:'rgba(224,82,82,0.15)',borderWidth:1,borderColor:'rgba(224,82,82,0.3)',borderRadius:RADIUS.sm,paddingVertical:4,paddingHorizontal:10},
  removeBtnText:{color:COLORS.red,fontSize:11,fontFamily:FONTS.medium},
  modal:{flex:1,backgroundColor:COLORS.bg,padding:SPACING.xl}, modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},
  modalTitle:{fontFamily:FONTS.display,fontSize:22,color:COLORS.text}, closeBtn:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.sm,width:32,height:32,alignItems:'center',justifyContent:'center'},
  closeTxt:{color:COLORS.soft,fontSize:16}, label:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.semiBold,letterSpacing:1,marginBottom:6,marginTop:12},
  input:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:12,color:COLORS.text,fontSize:14,fontFamily:FONTS.regular},
  pickerWrap:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,overflow:'hidden'},
  picker:{color:COLORS.text,height:50}, saveBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,padding:14,alignItems:'center',marginTop:20,marginBottom:32},
  saveTxt:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:15},
});
