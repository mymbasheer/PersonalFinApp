// mobile/src/screens/main/GoalsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const fmt = (n:number) => Math.round(n||0).toLocaleString('en-LK');
const fmtK = (n:number) => n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(0)}K`:`${Math.round(n)}`;
const ICONS = ['🎯','🏠','🏡','🚗','✈','🎓','💍','👶','🛡','💰','🏖','📱','💎','🌍'];
const GOAL_COLORS = [COLORS.blue, COLORS.green, COLORS.gold, COLORS.purple, COLORS.teal, COLORS.orange, COLORS.pink];

export default function GoalsScreen() {
  const [goals, setGoals]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showTopUp, setShowTopUp] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [topUpAmt, setTopUpAmt] = useState('');
  const [form, setForm] = useState({ name:'', icon:'🎯', target:'', saved:'0', color:COLORS.blue, deadline:'' });
  const setF = (k:string,v:any) => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    try { const r = await api.get('/goals'); setGoals(r.data.goals||[]); } catch {} setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const totalTarget = goals.reduce((s,g)=>s+g.target,0);
  const totalSaved  = goals.reduce((s,g)=>s+g.saved,0);

  const save = async () => {
    if (!form.name||!form.target){Alert.alert('Required','Fill name and target amount');return;}
    setSaving(true);
    try {
      await api.post('/goals', { name:form.name, icon:form.icon, target:Number(form.target), saved:Number(form.saved)||0, color:form.color, deadline:form.deadline });
      setShowAdd(false); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const topUp = async (goal:any) => {
    if (!topUpAmt||Number(topUpAmt)<=0){Alert.alert('Invalid','Enter a positive amount');return;}
    setSaving(true);
    try {
      await api.put(`/goals/${goal.id}`, { saved: goal.saved + Number(topUpAmt) });
      setShowTopUp(null); setTopUpAmt(''); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const remove = (id:number) => Alert.alert('Delete Goal?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await api.delete(`/goals/${id}`);load();}}]);

  const daysLeft = (dl:string) => {
    if(!dl) return null;
    const d = Math.ceil((new Date(dl).getTime()-Date.now())/86400000);
    return d;
  };

  return (
    <View style={{flex:1,backgroundColor:COLORS.bg}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.header}>
          <Text style={s.title}>Savings Goals</Text>
          <TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnTxt}>+  New Goal</Text></TouchableOpacity>
        </View>
        {goals.length>0&&(
          <View style={s.summary}>
            <View><Text style={s.sumLbl}>TOTAL TARGET</Text><Text style={[s.sumVal,{color:COLORS.gold}]}>LKR {fmtK(totalTarget)}</Text></View>
            <View style={s.divider}/>
            <View><Text style={s.sumLbl}>TOTAL SAVED</Text><Text style={[s.sumVal,{color:COLORS.green}]}>LKR {fmtK(totalSaved)}</Text></View>
            <View style={s.divider}/>
            <View><Text style={s.sumLbl}>OVERALL</Text><Text style={[s.sumVal,{color:COLORS.teal}]}>{totalTarget>0?((totalSaved/totalTarget)*100).toFixed(0):0}%</Text></View>
          </View>
        )}
        {goals.map(goal=>{
          const pct = goal.target>0?Math.min(100,(goal.saved/goal.target)*100):0;
          const remaining = goal.target - goal.saved;
          const dl = daysLeft(goal.deadline);
          return (
            <View key={goal.id} style={[s.card,{borderLeftColor:goal.color||COLORS.blue}]}>
              <View style={s.cardTop}>
                <View style={[s.iconCircle,{backgroundColor:(goal.color||COLORS.blue)+'20'}]}>
                  <Text style={s.iconTxt}>{goal.icon||'🎯'}</Text>
                </View>
                <View style={{flex:1,marginLeft:12}}>
                  <Text style={s.goalName}>{goal.name}</Text>
                  {goal.deadline&&<Text style={s.goalDeadline}>{dl!==null&&dl<0?'⚠ Overdue':dl===0?'🔴 Due today':`${dl} days left`} · {goal.deadline}</Text>}
                </View>
                <TouchableOpacity onPress={()=>remove(goal.id)} style={s.xBtn}><Text style={s.xTxt}>✕</Text></TouchableOpacity>
              </View>
              <View style={s.pbarWrap}>
                <View style={[s.pbarFill,{width:`${pct}%`,backgroundColor:goal.color||COLORS.blue}]}/>
              </View>
              <View style={s.cardBottom}>
                <View>
                  <Text style={s.savedLbl}>SAVED</Text>
                  <Text style={[s.savedVal,{color:goal.color||COLORS.blue}]}>LKR {fmt(goal.saved)}</Text>
                </View>
                <Text style={[s.pctTxt,{color:goal.color||COLORS.blue}]}>{pct.toFixed(0)}%</Text>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={s.savedLbl}>REMAINING</Text>
                  <Text style={s.remVal}>LKR {fmt(Math.max(0,remaining))}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.targetLbl}>Target: LKR {fmt(goal.target)}</Text>
                <TouchableOpacity style={[s.topUpBtn,{borderColor:goal.color||COLORS.blue}]} onPress={()=>{setShowTopUp(goal);setTopUpAmt('');}}>
                  <Text style={[s.topUpTxt,{color:goal.color||COLORS.blue}]}>+ Top Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {!goals.length&&(
          <View style={s.emptyCard}>
            <Text style={{fontSize:32,textAlign:'center',marginBottom:8}}>🎯</Text>
            <Text style={s.emptyTxt}>No savings goals yet.</Text>
            <Text style={s.emptySub}>Set a goal — house, car, education, holiday or emergency fund.</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>New Savings Goal</Text>
            <TouchableOpacity onPress={()=>setShowAdd(false)} style={s.closeBtn}><Text style={{color:COLORS.soft,fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>GOAL ICON</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8}}>
              {ICONS.map(ic=>(
                <TouchableOpacity key={ic} style={[s.iconBtn,form.icon===ic&&{backgroundColor:COLORS.gold+'20',borderColor:COLORS.gold}]} onPress={()=>setF('icon',ic)}>
                  <Text style={{fontSize:20}}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.lbl}>GOAL NAME *</Text>
            <TextInput style={s.inp} value={form.name} onChangeText={v=>setF('name',v)} placeholder="e.g. House Down Payment" placeholderTextColor={COLORS.muted}/>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1}}>
                <Text style={s.lbl}>TARGET (LKR) *</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.target} onChangeText={v=>setF('target',v)} placeholder="500000" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.lbl}>ALREADY SAVED</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.saved} onChangeText={v=>setF('saved',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
            </View>
            <Text style={s.lbl}>DEADLINE (YYYY-MM-DD)</Text>
            <TextInput style={s.inp} value={form.deadline} onChangeText={v=>setF('deadline',v)} placeholder="2026-12-31" placeholderTextColor={COLORS.muted}/>
            <Text style={s.lbl}>COLOUR</Text>
            <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
              {GOAL_COLORS.map(col=>(
                <TouchableOpacity key={col} onPress={()=>setF('color',col)} style={{width:30,height:30,borderRadius:15,backgroundColor:col,borderWidth:form.color===col?3:0,borderColor:'#fff'}}/>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving?<ActivityIndicator color={COLORS.bg}/>:<Text style={s.saveTxt}>✓  Create Goal</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Top Up Modal */}
      <Modal visible={!!showTopUp} animationType="fade" transparent>
        <View style={s.overlay}>
          <View style={s.overlayBox}>
            <Text style={s.modalTitle}>{showTopUp?.icon} Top Up — {showTopUp?.name}</Text>
            <Text style={[s.lbl,{marginTop:16}]}>AMOUNT TO ADD (LKR)</Text>
            <TextInput style={[s.inp,{fontFamily:FONTS.mono,fontSize:20,marginBottom:16}]} value={topUpAmt} onChangeText={setTopUpAmt} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric" autoFocus/>
            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity style={[s.saveBtn,{flex:1,backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border}]} onPress={()=>setShowTopUp(null)}>
                <Text style={{color:COLORS.soft,fontFamily:FONTS.bold}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn,{flex:2}]} onPress={()=>topUp(showTopUp)} disabled={saving}>
                {saving?<ActivityIndicator color={COLORS.bg}/>:<Text style={s.saveTxt}>+ Add Savings</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.xl},
  title:{fontFamily:FONTS.display,fontSize:28,color:COLORS.text},
  addBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,paddingVertical:9,paddingHorizontal:16},
  addBtnTxt:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:13},
  summary:{flexDirection:'row',justifyContent:'space-around',backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.lg,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg},
  sumLbl:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1},
  sumVal:{fontFamily:FONTS.mono,fontSize:15,fontWeight:'700',marginTop:4},
  divider:{width:1,backgroundColor:COLORS.border},
  card:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg,borderLeftWidth:4},
  cardTop:{flexDirection:'row',alignItems:'center',marginBottom:12},
  iconCircle:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  iconTxt:{fontSize:22},
  goalName:{fontFamily:FONTS.display,fontSize:18,color:COLORS.text},
  goalDeadline:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:2},
  xBtn:{backgroundColor:'rgba(224,82,82,0.12)',borderRadius:6,width:28,height:28,alignItems:'center',justifyContent:'center'},
  xTxt:{color:COLORS.red,fontSize:11,fontWeight:'700'},
  pbarWrap:{height:6,backgroundColor:COLORS.border,borderRadius:6,overflow:'hidden',marginBottom:12},
  pbarFill:{height:'100%',borderRadius:6},
  cardBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:4},
  savedLbl:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1},
  savedVal:{fontFamily:FONTS.mono,fontSize:15,fontWeight:'700',marginTop:2},
  pctTxt:{fontFamily:FONTS.mono,fontSize:22,fontWeight:'800'},
  remVal:{fontFamily:FONTS.mono,fontSize:13,fontWeight:'700',color:COLORS.soft,marginTop:2},
  targetLbl:{fontSize:11,color:COLORS.muted,fontFamily:FONTS.regular},
  topUpBtn:{borderWidth:1,borderRadius:RADIUS.sm,paddingVertical:5,paddingHorizontal:12},
  topUpTxt:{fontSize:12,fontFamily:FONTS.bold},
  emptyCard:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.xl*1.5,borderWidth:1,borderColor:COLORS.border,alignItems:'center'},
  emptyTxt:{color:COLORS.text,fontSize:16,fontFamily:FONTS.semiBold,marginBottom:8},
  emptySub:{color:COLORS.muted,fontSize:13,fontFamily:FONTS.regular,textAlign:'center'},
  modal:{flex:1,backgroundColor:COLORS.bg,padding:SPACING.xl},
  modalHdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},
  modalTitle:{fontFamily:FONTS.display,fontSize:22,color:COLORS.text},
  closeBtn:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.sm,width:32,height:32,alignItems:'center',justifyContent:'center'},
  lbl:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.semiBold,letterSpacing:1,marginBottom:6,marginTop:12},
  inp:{backgroundColor:COLORS.el,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:12,color:COLORS.text,fontSize:14,fontFamily:FONTS.regular},
  iconBtn:{width:40,height:40,borderRadius:10,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.el},
  saveBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,padding:14,alignItems:'center',marginTop:20,marginBottom:16},
  saveTxt:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:15},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:SPACING.xl},
  overlayBox:{backgroundColor:COLORS.card,borderRadius:RADIUS.xl,padding:SPACING.xl,borderWidth:1,borderColor:COLORS.border},
});
