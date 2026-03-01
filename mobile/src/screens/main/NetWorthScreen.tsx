// mobile/src/screens/main/NetWorthScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/constants';

const fmt  = (n: number) => Math.round(n||0).toLocaleString('en-LK');
const fmtK = (n: number) => Math.abs(n)>=1e6?`${(n/1e6).toFixed(2)}M`:Math.abs(n)>=1e3?`${(n/1e3).toFixed(1)}K`:`${Math.round(n)}`;
const ASSET_CATS  = ['Cash & Bank','Fixed Deposits','Shares / Investments','Real Estate','Vehicle','Gold & Jewellery','EPF / ETF','Business Assets','Other'];
const LIAB_CATS   = ['Home Loan','Vehicle Loan','Leasing','Personal Loan','Credit Card','Student Loan','Other'];
const COLOR_LIST  = [COLORS.green, COLORS.teal, COLORS.blue, COLORS.purple, COLORS.gold, COLORS.orange, COLORS.red];

export default function NetWorthScreen() {
  const [assets,   setAssets]   = useState<any[]>([]);
  const [liabs,    setLiabs]    = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [mType,    setMType]    = useState<'asset'|'liability'>('asset');
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ name:'', category:'Cash & Bank', value:'', color: COLORS.green });
  const setF = (k:string,v:any) => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    try {
      const [aR, lR] = await Promise.all([api.get('/assets'), api.get('/liabilities')]);
      setAssets(aR.data.assets||[]); setLiabs(lR.data.liabilities||[]);
    } catch {} setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const totalA = assets.reduce((s,x)=>s+x.value,0);
  const totalL = liabs.reduce((s,x)=>s+x.value,0);
  const nw = totalA - totalL;

  const openAdd = (type:'asset'|'liability') => {
    setMType(type);
    setForm({ name:'', category: type==='asset'?'Cash & Bank':'Home Loan', value:'', color: COLORS.green });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name||!form.value){Alert.alert('Required','Fill name and value');return;}
    setSaving(true);
    try {
      await api.post(mType==='asset'?'/assets':'/liabilities', { name:form.name, category:form.category, value:Number(form.value), color:form.color });
      setShowModal(false); load();
    } catch(e:any){Alert.alert('Error',e.message);} finally{setSaving(false);}
  };

  const remove = (id:number, endpoint:string) =>
    Alert.alert('Remove?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:async()=>{await api.del(`/${endpoint}/${id}`);load();}}]);

  const ItemSection = ({title,items,type,total,color}:any) => (
    <View style={s.section}>
      <View style={s.sectionHdr}>
        <Text style={[s.sectionLbl,{color}]}>{title} · LKR {fmtK(total)}</Text>
        <TouchableOpacity style={[s.addBtn,{borderColor:color}]} onPress={()=>openAdd(type)}>
          <Text style={[s.addBtnTxt,{color}]}>+  Add</Text>
        </TouchableOpacity>
      </View>
      {items.map((item:any)=>(
        <View key={item.id} style={[s.row,{borderLeftColor:item.color||color}]}>
          <View style={{flex:1}}>
            <Text style={s.rowName}>{item.name}</Text>
            <Text style={s.rowCat}>{item.category}</Text>
          </View>
          <Text style={[s.rowVal,{color}]}>LKR {fmtK(item.value)}</Text>
          <TouchableOpacity style={s.xBtn} onPress={()=>remove(item.id,type==='asset'?'assets':'liabilities')}>
            <Text style={s.xTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {!items.length && <Text style={s.empty}>No {type==='asset'?'assets':'liabilities'} yet. Tap '+ Add'.</Text>}
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:COLORS.bg}}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor={COLORS.gold}/>}>
        <View style={s.hero}>
          <Text style={s.heroLbl}>TOTAL NET WORTH</Text>
          <Text style={[s.heroVal,{color:nw>=0?COLORS.gold:COLORS.red}]}>LKR {fmt(nw)}</Text>
          <View style={s.heroRow}>
            {[['ASSETS',totalA,COLORS.green],['LIABILITIES',totalL,COLORS.red],['DEBT RATIO',totalA>0?((totalL/totalA)*100).toFixed(1)+'%':'0%',COLORS.orange]].map(([l,v,c])=>(
              <View key={l as string}>
                <Text style={s.heroSubLbl}>{l as string}</Text>
                <Text style={[s.heroSubVal,{color:c as string}]}>{typeof v==='number'?`LKR ${fmtK(v)}`:v as string}</Text>
              </View>
            ))}
          </View>
          {totalA+totalL>0 && (
            <View style={{flexDirection:'row',height:6,borderRadius:6,overflow:'hidden',marginTop:16}}>
              <View style={{flex:totalA,backgroundColor:COLORS.green}}/>
              <View style={{flex:totalL,backgroundColor:COLORS.red}}/>
            </View>
          )}
        </View>
        <ItemSection title="ASSETS" items={assets} type="asset" total={totalA} color={COLORS.green}/>
        <ItemSection title="LIABILITIES" items={liabs} type="liability" total={totalL} color={COLORS.red}/>
        <View style={[s.section,{backgroundColor:'rgba(29,184,168,0.06)',borderColor:'rgba(29,184,168,0.25)'}]}>
          <Text style={[s.sectionLbl,{color:COLORS.teal,marginBottom:10}]}>💡 NET WORTH TIPS</Text>
          {['Update EPF balance quarterly from EPF portal','Revalue property annually at current market price','Record vehicle at current market value (not purchase)','Track gold jewellery at 22K gram rate','Review and close unused credit lines to reduce liabilities'].map(t=>(
            <Text key={t} style={{color:COLORS.soft,fontSize:12,fontFamily:FONTS.regular,marginBottom:5}}>• {t}</Text>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHdr}>
            <Text style={s.modalTitle}>Add {mType==='asset'?'Asset':'Liability'}</Text>
            <TouchableOpacity onPress={()=>setShowModal(false)} style={s.closeBtn}><Text style={{color:COLORS.soft,fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.lbl}>NAME *</Text>
            <TextInput style={s.inp} value={form.name} onChangeText={v=>setF('name',v)} placeholder={mType==='asset'?'e.g. NSB Fixed Deposit':'e.g. HNB Home Loan'} placeholderTextColor={COLORS.muted}/>
            <Text style={s.lbl}>CATEGORY</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={form.category} onValueChange={v=>setF('category',v)} style={s.picker} dropdownIconColor={COLORS.soft}>
                {(mType==='asset'?ASSET_CATS:LIAB_CATS).map(c=><Picker.Item key={c} label={c} value={c} color={COLORS.text}/>)}
              </Picker>
            </View>
            <Text style={s.lbl}>{mType==='asset'?'CURRENT VALUE':'OUTSTANDING AMOUNT'} (LKR) *</Text>
            <TextInput style={[s.inp,{fontFamily:FONTS.mono,fontSize:18}]} value={form.value} onChangeText={v=>setF('value',v)} placeholder="0" placeholderTextColor={COLORS.muted} keyboardType="numeric"/>
            <Text style={s.lbl}>COLOUR TAG</Text>
            <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
              {COLOR_LIST.map(col=>(
                <TouchableOpacity key={col} onPress={()=>setF('color',col)}
                  style={{width:30,height:30,borderRadius:15,backgroundColor:col,borderWidth:form.color===col?3:0,borderColor:'#fff'}}/>
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn,{backgroundColor:mType==='asset'?COLORS.green:COLORS.red}]} onPress={save} disabled={saving}>
              {saving?<ActivityIndicator color="#fff"/>:<Text style={s.saveTxt}>✓  Add {mType==='asset'?'Asset':'Liability'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  hero:{backgroundColor:'#0D2040',margin:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.xl,borderWidth:1,borderColor:'#1F3555'},
  heroLbl:{fontSize:10,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1.5,marginBottom:6},
  heroVal:{fontFamily:FONTS.mono,fontSize:38,fontWeight:'800',marginBottom:16},
  heroRow:{flexDirection:'row',justifyContent:'space-between'},
  heroSubLbl:{fontSize:9,color:COLORS.muted,fontFamily:FONTS.bold,letterSpacing:1},
  heroSubVal:{fontFamily:FONTS.mono,fontSize:14,fontWeight:'700',marginTop:3},
  section:{backgroundColor:COLORS.card,marginHorizontal:SPACING.xl,borderRadius:RADIUS.xl,padding:SPACING.lg,borderWidth:1,borderColor:COLORS.border,marginBottom:SPACING.lg},
  sectionHdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  sectionLbl:{fontSize:11,fontFamily:FONTS.bold,letterSpacing:1.5},
  addBtn:{borderWidth:1,borderRadius:RADIUS.sm,paddingVertical:5,paddingHorizontal:12},
  addBtnTxt:{fontSize:12,fontFamily:FONTS.bold},
  row:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.el,borderRadius:RADIUS.md,padding:12,marginBottom:6,borderLeftWidth:3},
  rowName:{fontSize:13,color:COLORS.text,fontFamily:FONTS.medium},
  rowCat:{fontSize:11,color:COLORS.soft,fontFamily:FONTS.regular,marginTop:2},
  rowVal:{fontFamily:FONTS.mono,fontSize:13,fontWeight:'700',marginRight:10},
  xBtn:{backgroundColor:'rgba(224,82,82,0.15)',borderRadius:6,width:26,height:26,alignItems:'center',justifyContent:'center'},
  xTxt:{color:COLORS.red,fontSize:11,fontWeight:'700'},
  empty:{color:COLORS.muted,fontSize:13,textAlign:'center',padding:16,fontFamily:FONTS.regular},
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
