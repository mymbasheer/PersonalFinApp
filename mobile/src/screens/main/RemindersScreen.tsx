// mobile/src/screens/main/RemindersScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, Switch, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { notifications } from '../../services/notifications';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const fmt = (n:number) => Math.round(n||0).toLocaleString('en-LK');
const daysUntil = (d:string) => d ? Math.ceil((new Date(d).getTime()-Date.now())/86400000) : null;
const REM_TYPES = ['bill','loan_emi','insurance_renewal','tax','subscription','other'];
const ICONS_MAP: Record<string,string> = {bill:'⚡',loan_emi:'🏦',insurance_renewal:'🛡',tax:'📋',subscription:'📱',other:'🔔'};
const RECURRING = ['Monthly','Quarterly','Semi-Annual','Annual','One-time'];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title:'', reminderType:'bill', dueDate:'', amount:'', recurring:'Monthly', icon:'🔔', color:COLORS.gold });
  const setF = (k:string,v:any) => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    try { const r = await api.get('/reminders'); setReminders(r.data.reminders||[]); } catch {} setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const toggle = async (rem:any) => {
    await api.put(`/reminders/${rem.id}`, { enabled: !rem.enabled });
    load();
  };

  const save = async () => {
    if (!form.title||!form.dueDate){Alert.alert('Required','Fill title and due date');return;}
    setSaving(true);
    try {
      await api.post('/reminders', { title:form.title, reminderType:form.reminderType, dueDate:form.dueDate, amount:Number(form.amount)||0, recurring:form.recurring, icon:ICONS_MAP[form.reminderType]||form.icon, color:form.color });
      // Schedule local notification
      const dl = daysUntil(form.dueDate)||0;
      if (dl<=3) await notifications.scheduleLocal({ title:`Reminder: ${form.title}`, body:`Due: ${form.dueDate}${Number(form.amount)>0?` · LKR ${fmt(Number(form.amount))}`:''}`, date: new Date(form.dueDate) });
      setShowAdd(false); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const grouped = {
    overdue:  reminders.filter(r=> r.enabled && (daysUntil(r.due_date)||0)<0),
    today:    reminders.filter(r=> r.enabled && daysUntil(r.due_date)===0),
    thisWeek: reminders.filter(r=> r.enabled && (daysUntil(r.due_date)||0)>0 && (daysUntil(r.due_date)||0)<=7),
    upcoming: reminders.filter(r=> r.enabled && (daysUntil(r.due_date)||0)>7),
    disabled: reminders.filter(r=> !r.enabled),
  };

  const ReminderCard = ({rem}:{rem:any}) => {
    const dl = daysUntil(rem.due_date);
    const isOverdue = (dl||0)<0, isToday = dl===0, isUrgent = (dl||0)<=3&&(dl||0)>=0;
    const statusColor = isOverdue?COLORS.red:isToday?COLORS.red:isUrgent?COLORS.orange:COLORS.green;
    const statusText = isOverdue?`${Math.abs(dl||0)}d overdue`:isToday?'DUE TODAY':isUrgent?`Due in ${dl}d`:`Due in ${dl}d`;
    return (
      <View style={[s.remCard,{borderLeftColor:rem.color||COLORS.gold}]}>
        <View style={s.remTop}>
          <Text style={{fontSize:22,marginRight:12}}>{rem.icon||'🔔'}</Text>
          <View style={{flex:1}}>
            <Text style={s.remTitle}>{rem.title}</Text>
            <Text style={s.remDate}>{rem.due_date} · {rem.recurring}</Text>
          </View>
          <Switch value={!!rem.enabled} onValueChange={()=>toggle(rem)} trackColor={{false:COLORS.border,true:COLORS.gold+'60'}} thumbColor={rem.enabled?COLORS.gold:COLORS.muted}/>
        </View>
        <View style={s.remBottom}>
          {rem.amount>0&&<Text style={s.remAmt}>LKR {fmt(rem.amount)}</Text>}
          <View style={[s.statusBadge,{backgroundColor:statusColor+'15',borderColor:statusColor+'40'}]}>
            <Text style={[s.statusTxt,{color:statusColor}]}>{statusText}</Text>
          </View>
          <TouchableOpacity onPress={()=>Alert.alert('Remove?','',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:async()=>{await api.del(`/reminders/${rem.id}`);load();}}])} style={s.xBtn}>
            <Text style={s.xTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const Group = ({title,items,color}:{title:string,items:any[],color:string}) => items.length>0?(
    <View style={{marginBottom:8}}>
      <Text style={[s.groupLbl,{color}]}>{title} ({items.length})</Text>
      {items.map(r=><ReminderCard key={r.id} rem={r}/>)}
    </View>
  ):null;

  return (
    <View style={{flex:1,backgroundColor:COLORS.bg}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.header}>
          <Text style={s.title}>Reminders</Text>
          <TouchableOpacity style={s.addBtn} onPress={()=>setShowAdd(true)}><Text style={s.addBtnTxt}>+  Add</Text></TouchableOpacity>
        </View>
        <View style={s.container}>
          <Group title="⚠ OVERDUE" items={grouped.overdue} color={COLORS.red}/>
          <Group title="🔴 DUE TODAY" items={grouped.today} color={COLORS.red}/>
          <Group title="🟡 THIS WEEK" items={grouped.thisWeek} color={COLORS.orange}/>
          <Group title="🟢 UPCOMING" items={grouped.upcoming} color={COLORS.green}/>
          <Group title="⚫ DISABLED" items={grouped.disabled} color={COLORS.muted}/>
          {!reminders.length&&(
            <View style={s.emptyCard}>
              <Text style={{fontSize:32,textAlign:'center',marginBottom:8}}>🔔</Text>
              <Text style={s.emptyTxt}>No reminders set.</Text>
              <Text style={s.emptySub}>Add reminders for bills, EMIs, insurance renewals and tax deadlines.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add Reminder</Text>
            <TouchableOpacity onPress={()=>setShowAdd(false)} style={s.closeBtn}><Text style={{color:COLORS.soft,fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>REMINDER TYPE</Text>
            <View style={s.pickerWrap}><Picker selectedValue={form.reminderType} onValueChange={v=>setF('reminderType',v)} style={s.picker} dropdownIconColor={COLORS.soft}>{REM_TYPES.map(t=><Picker.Item key={t} label={`${ICONS_MAP[t]||'🔔'}  ${t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}`} value={t} color={COLORS.text}/>)}</Picker></View>
            <Text style={s.lbl}>TITLE *</Text>
            <TextInput style={s.inp} value={form.title} onChangeText={v=>setF('title',v)} placeholder="e.g. CEB Electricity Bill" placeholderTextColor={COLORS.muted}/>
            <Text style={s.lbl}>DUE DATE (YYYY-MM-DD) *</Text>
            <TextInput style={s.inp} value={form.dueDate} onChangeText={v=>setF('dueDate',v)} placeholder="2026-04-15" placeholderTextColor={COLORS.muted}/>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1}}>
                <Text style={s.lbl}>AMOUNT (LKR)</Text>
                <TextInput style={[s.inp,{fontFamily:FONTS.mono}]} value={form.amount} onChangeText={v=>setF('amount',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
              </View>
              <View style={{flex:1}}>
                <Text style={s.lbl}>RECURRING</Text>
                <View style={s.pickerWrap}><Picker selectedValue={form.recurring} onValueChange={v=>setF('recurring',v)} style={[s.picker,{height:47}]} dropdownIconColor={COLORS.soft}>{RECURRING.map(r=><Picker.Item key={r} label={r} value={r} color={COLORS.text}/>)}</Picker></View>
              </View>
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              {saving?<ActivityIndicator color={COLORS.bg}/>:<Text style={s.saveTxt}>🔔  Set Reminder</Text>}
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
  addBtn:{backgroundColor:COLORS.gold,borderRadius:RADIUS.md,paddingVertical:9,paddingHorizontal:16},
  addBtnTxt:{color:COLORS.bg,fontFamily:FONTS.bold,fontSize:13},
  container:{paddingHorizontal:SPACING.xl,paddingBottom:SPACING.xl},
  groupLbl:{fontSize:11,fontFamily:FONTS.bold,letterSpacing:1.5,marginBottom:8,marginTop:4},
  remCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.lg,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:8,borderLeftWidth:4},
  remTop:{flexDirection:'row',alignItems:'center',marginBottom:8},
  remTitle:{fontSize:14,color:COLORS.text,fontFamily:FONTS.semiBold},
  remDate:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:2},
  remBottom:{flexDirection:'row',alignItems:'center',gap:8},
  remAmt:{fontFamily:FONTS.mono,fontSize:13,fontWeight:'700',color:COLORS.text,marginRight:'auto'},
  statusBadge:{borderWidth:1,borderRadius:10,paddingHorizontal:8,paddingVertical:2},
  statusTxt:{fontSize:10,fontFamily:FONTS.bold},
  xBtn:{backgroundColor:'rgba(224,82,82,0.12)',borderRadius:6,width:26,height:26,alignItems:'center',justifyContent:'center'},
  xTxt:{color:COLORS.red,fontSize:11,fontWeight:'700'},
  emptyCard:{backgroundColor:COLORS.card,borderRadius:RADIUS.xl,padding:SPACING.xl*1.5,borderWidth:1,borderColor:COLORS.border,alignItems:'center'},
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
