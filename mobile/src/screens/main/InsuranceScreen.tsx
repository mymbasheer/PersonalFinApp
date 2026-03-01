// mobile/src/screens/main/InsuranceScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const fmt = (n:number) => Math.round(n||0).toLocaleString('en-LK');
const daysUntil = (d:string) => d ? Math.ceil((new Date(d).getTime()-Date.now())/86400000) : null;
const INS_TYPES = ['Life Insurance','Health Insurance','Motor Insurance','Home Insurance','Endowment / Investment','Pension Plan','Other'];
const PROVIDERS = ['AIA Insurance','Ceylinco Life','Union Assurance','Sri Lanka Insurance','HNB Assurance','Softlogic Life','Allianz Insurance','LOLC Insurance','Commercial Insurance','Other'];
const COLORS_LIST = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.teal, COLORS.gold, COLORS.orange];

export default function InsuranceScreen() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ insType:'Life Insurance', provider:'AIA Insurance', policyName:'', premium:'', frequency:'Monthly', coverage:'', renewalDate:'', color:COLORS.blue });
  const setF = (k:string,v:any) => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    try { const r = await api.get('/insurance'); setPolicies(r.data.policies||[]); } catch {} setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const totalMonthly = policies.filter(p=>p.status==='Active').reduce((s,p)=>{
    return s + (p.frequency==='Monthly'?p.premium:p.frequency==='Annual'?p.premium/12:p.frequency==='Quarterly'?p.premium/3:p.premium);
  }, 0);
  const totalCoverage = policies.filter(p=>p.status==='Active').reduce((s,p)=>s+p.coverage,0);

  const save = async () => {
    if (!form.insType||!form.premium){Alert.alert('Required','Select type and enter premium');return;}
    setSaving(true);
    try {
      await api.post('/insurance', { insType:form.insType, provider:form.provider, policyName:form.policyName, premium:Number(form.premium), frequency:form.frequency, coverage:Number(form.coverage)||0, renewalDate:form.renewalDate, color:form.color });
      setShowAdd(false); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const toggleStatus = async (p:any) => {
    await api.put(`/insurance/${p.id}`, { status: p.status==='Active'?'Lapsed':'Active' });
    load();
  };

  return (
    <View style={{flex:1,backgroundColor:COLORS.bg}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.header}>
          <Text style={s.title}>Insurance</Text>
          <TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnTxt}>+  Add Policy</Text></TouchableOpacity>
        </View>
        {policies.length>0&&(
          <View style={s.summary}>
            {[['MONTHLY COST',`LKR ${fmt(totalMonthly)}`,COLORS.orange],['TOTAL COVERAGE',`LKR ${(totalCoverage/1e6).toFixed(1)}M`,COLORS.green],['POLICIES',`${policies.filter(p=>p.status==='Active').length} active`,COLORS.text]].map(([l,v,c])=>(
              <View key={l as string}><Text style={s.sumLbl}>{l as string}</Text><Text style={[s.sumVal,{color:c as string}]}>{v as string}</Text></View>
            ))}
          </View>
        )}
        {policies.map(p=>{
          const dl = daysUntil(p.renewal_date);
          const urgent = dl!==null&&dl<=30&&dl>=0;
          const overdue = dl!==null&&dl<0;
          return (
            <View key={p.id} style={[s.card,{borderLeftColor:p.color||COLORS.blue,opacity:p.status==='Lapsed'?0.6:1}]}>
              <View style={s.cardTop}>
                <View style={[s.typeIcon,{backgroundColor:(p.color||COLORS.blue)+'20'}]}>
                  <Text style={{fontSize:20}}>{p.ins_type==='Life Insurance'?'🛡':p.ins_type==='Health Insurance'?'🏥':p.ins_type==='Motor Insurance'?'🚗':p.ins_type==='Home Insurance'?'🏠':'💼'}</Text>
                </View>
                <View style={{flex:1,marginLeft:12}}>
                  <Text style={s.policyName}>{p.policy_name||p.ins_type}</Text>
                  <Text style={s.provider}>{p.provider}</Text>
                  <View style={{flexDirection:'row',gap:6,marginTop:5}}>
                    <View style={[s.badge,{borderColor:p.status==='Active'?COLORS.green:COLORS.muted}]}>
                      <Text style={[s.badgeTxt,{color:p.status==='Active'?COLORS.green:COLORS.muted}]}>{p.status}</Text>
                    </View>
                    <View style={[s.badge,{borderColor:COLORS.blue}]}>
                      <Text style={[s.badgeTxt,{color:COLORS.blue}]}>{p.ins_type}</Text>
                    </View>
                  </View>
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={[s.premium,{color:p.color||COLORS.blue}]}>LKR {fmt(p.premium)}</Text>
                  <Text style={s.freq}>/{p.frequency?.toLowerCase()||'month'}</Text>
                  {p.coverage>0&&<Text style={s.coverage}>Cover: LKR {fmt(p.coverage)}</Text>}
                </View>
              </View>
              {p.renewal_date&&(
                <View style={[s.renewalBadge,{backgroundColor:overdue?'rgba(224,82,82,0.1)':urgent?'rgba(245,158,11,0.1)':'rgba(29,184,168,0.08)',borderColor:overdue?COLORS.red:urgent?COLORS.orange:COLORS.teal}]}>
                  <Text style={[s.renewalTxt,{color:overdue?COLORS.red:urgent?COLORS.orange:COLORS.teal}]}>
                    {overdue?'⚠ Renewal overdue':urgent?`🔔 Renews in ${dl} days`:` Renewal: ${p.renewal_date}`}
                  </Text>
                </View>
              )}
              <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:10}}>
                <TouchableOpacity style={s.actionBtn} onPress={()=>toggleStatus(p)}>
                  <Text style={s.actionTxt}>{p.status==='Active'?'Mark Lapsed':'Mark Active'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn,{borderColor:'rgba(224,82,82,0.3)'}]} onPress={()=>Alert.alert('Remove Policy?','',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:async()=>{await api.del(`/insurance/${p.id}`);load();}}])}>
                  <Text style={[s.actionTxt,{color:COLORS.red}]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {!policies.length&&(
          <View style={s.emptyCard}>
            <Text style={{fontSize:32,textAlign:'center',marginBottom:8}}>🛡</Text>
            <Text style={s.emptyTxt}>No insurance policies tracked.</Text>
            <Text style={s.emptySub}>Track life, health, motor and home insurance — never miss a renewal.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add Insurance Policy</Text>
            <TouchableOpacity onPress={()=>setShowAdd(false)} style={s.closeBtn}><Text style={{color:COLORS.soft,fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>INSURANCE TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.insType} onValueChange={v=>setF('insType',v)} style={s.picker} dropdownIconColor={COLORS.soft}>{INS_TYPES.map(t=><Picker.Item key={t} label={t} value={t} color={COLORS.text}/>)}</Picker></View>
            <Text style={s.lbl}>PROVIDER</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.provider} onValueChange={v=>setF('provider',v)} style={s.picker} dropdownIconColor={COLORS.soft}>{PROVIDERS.map(p=><Picker.Item key={p} label={p} value={p} color={COLORS.text}/>)}</Picker></View>
            <Text style={s.lbl}>POLICY NAME / NUMBER</Text>
            <TextInput style={s.inp} value={form.policyName} onChangeText={v=>setF('policyName',v)} placeholder="e.g. AIA Platinum Life 2024" placeholderTextColor={COLORS.muted}/>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1}}>
                <Text style={s.lbl}>PREMIUM (LKR) *</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.premium} onChangeText={v=>setF('premium',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.lbl}>FREQUENCY</Text>
                <View style={s.pickerWrap}><Picker selectedValue={form.frequency} onValueChange={v=>setF('frequency',v)} style={[s.picker,{height:47}]} dropdownIconColor={COLORS.soft}>{['Monthly','Quarterly','Semi-Annual','Annual'].map(f=><Picker.Item key={f} label={f} value={f} color={COLORS.text}/>)}</Picker></View>
              </View>
            </View>
            <Text style={s.lbl}>COVERAGE AMOUNT (LKR)</Text>
            <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.coverage} onChangeText={v=>setF('coverage',v)} placeholder="e.g. 5000000" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
            <Text style={s.lbl}>RENEWAL DATE (YYYY-MM-DD)</Text>
            <TextInput style={s.inp} value={form.renewalDate} onChangeText={v=>setF('renewalDate',v)} placeholder="2026-12-01" placeholderTextColor={COLORS.muted}/>
            <Text style={s.lbl}>COLOUR TAG</Text>
            <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
              {COLORS_LIST.map(col=>(
                <TouchableOpacity key={col} onPress={()=>setF('color',col)} style={{width:30,height:30,borderRadius:15,backgroundColor:col,borderWidth:form.color===col?3:0,borderColor:'#fff'}}/>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving?<ActivityIndicator color={COLORS.bg}/>:<Text style={s.saveTxt}>✓  Add Policy</Text>}
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
  addBtn:{backgroundColor:COLORS.blue,borderRadius:RADIUS.md,paddingVertical:9,paddingHorizontal:16},
  addBtnTxt:{color:'#fff',fontFamily:FONTS.bold,fontSize:13},
  summary:{flexDirection:'row',justifyContent:'space-around',backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.lg,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg},
  sumLbl:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1},
  sumVal:{fontFamily:FONTS.mono,fontSize:14,fontWeight:'700',marginTop:4},
  card:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg,borderLeftWidth:4},
  cardTop:{flexDirection:'row'},
  typeIcon:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  policyName:{fontFamily:FONTS.display,fontSize:16,color:COLORS.text},
  provider:{fontSize:12,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:2},
  badge:{borderWidth:1,borderRadius:10,paddingHorizontal:7,paddingVertical:1},
  badgeTxt:{fontSize:9,fontFamily:FONTS.bold},
  premium:{fontFamily:FONTS.mono,fontSize:16,fontWeight:'800'},
  freq:{fontSize:11,color:COLORS.muted,fontFamily:FONTS.regular},
  coverage:{fontSize:11,color:COLORS.teal,fontFamily:FONTS.semiBold,marginTop:3},
  renewalBadge:{borderWidth:1,borderRadius:RADIUS.sm,padding:8,marginTop:10},
  renewalTxt:{fontSize:12,fontFamily:FONTS.semiBold},
  actionBtn:{borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.sm,paddingVertical:5,paddingHorizontal:12},
  actionTxt:{color:COLORS.soft,fontSize:11,fontFamily:FONTS.medium},
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
  saveBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,padding:14,alignItems:'center',marginTop:20,marginBottom:32},
  saveTxt:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:15},
});
