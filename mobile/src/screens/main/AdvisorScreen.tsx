// mobile/src/screens/main/AdvisorScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { calcAPIT } from '../../utils/tax';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

interface Message { role: 'user'|'assistant'; content: string; }

const QUICK_PROMPTS = [
  'How much should I invest in an emergency fund?',
  'Explain IRD APIT 2025 slabs in simple terms',
  'Should I pay off my loan early or invest?',
  'How do I open a fixed deposit in Sri Lanka?',
  'What is the best way to save for a house in LK?',
  'How to reduce my APIT tax legally?',
];

export default function AdvisorScreen() {
  const { colors } = useThemeStore();
  const s = getStyles(colors);
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role:'assistant', content:`Hello ${user?.first_name||''}! 👋\n\nI'm your AI Financial Advisor, powered by Claude. I can help you with:\n\n• IRD 2025 APIT tax planning\n• Sri Lanka investment options\n• Budget optimisation advice\n• EPF / ETF strategies\n• Loan vs invest decisions\n• CEB, vehicle licence, gold market info\n\nWhat would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const gross = user?.monthly_gross || 0;
  const annual = gross * 12;
  const tax = calcAPIT(annual);

  const buildContext = () =>
    `You are a knowledgeable Sri Lanka personal finance advisor. The user's profile:
- Name: ${user?.first_name} ${user?.last_name}
- Occupation: ${user?.occupation}
- District: ${user?.district}
- Monthly Gross: LKR ${Math.round(gross).toLocaleString('en-LK')}
- Annual Gross: LKR ${Math.round(annual).toLocaleString('en-LK')}
- Annual APIT Tax: LKR ${Math.round(tax).toLocaleString('en-LK')}
- EPF Monthly (8%): LKR ${Math.round(gross*0.08).toLocaleString('en-LK')}
- Net Monthly: LKR ${Math.round(gross-tax/12-gross*0.08).toLocaleString('en-LK')}

Context: Sri Lanka financial system, IRD 2025 tax rates, CBSL regulations, Colombo Stock Exchange, NSB/BoC/HNB products, LankaPay ecosystem. Be specific, practical, and use Sri Lanka LKR amounts. Keep answers concise (3-5 paragraphs max). Always caveat that this is general advice only.`;

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg: Message = { role:'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const resp = await api.post('/advisor/chat', {
        messages: updated.map(m=>({ role:m.role, content:m.content })),
        context: buildContext() });
      setMessages(prev=>[...prev, { role:'assistant', content: resp.data.reply }]);
    } catch (e:any) {
      setMessages(prev=>[...prev, { role:'assistant', content:`Sorry, I couldn't connect to the advisor. Please check your internet connection and try again.\n\nError: ${e.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>✦ AI Advisor</Text>
          <Text style={s.sub}>Powered by Claude · Sri Lanka Finance Expert</Text>
        </View>
        <TouchableOpacity style={s.clearBtn} onPress={()=>setMessages([{role:'assistant',content:'Chat cleared. How can I help you today?'}])}>
          <Text style={s.clearTxt}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={{padding:SPACING.lg}} onContentSizeChange={()=>scrollRef.current?.scrollToEnd({animated:true})}>
        {messages.map((m,i)=>(
          <View key={i} style={[s.bubble, m.role==='user'?s.userBubble:s.aiBubble]}>
            {m.role==='assistant'&&<Text style={s.aiLabel}>✦ Advisor</Text>}
            <Text style={[s.bubbleTxt,m.role==='user'?s.userTxt:s.aiTxt]}>{m.content}</Text>
          </View>
        ))}
        {loading&&(
          <View style={s.aiBubble}>
            <Text style={s.aiLabel}>✦ Advisor</Text>
            <View style={{flexDirection:'row',gap:4,paddingVertical:4}}>
              {[0,1,2].map(i=><View key={i} style={[s.dot,{opacity:.3+i*.25}]}/>)}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={s.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:SPACING.lg,gap:8}}>
          {QUICK_PROMPTS.map(p=>(
            <TouchableOpacity key={p} style={s.quickBtn} onPress={()=>send(p)}>
              <Text style={s.quickTxt} numberOfLines={1}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.inp}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about tax, investments, budgeting…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={500}
          onSubmitEditing={()=>send()}
        />
        <TouchableOpacity style={[s.sendBtn,(!input.trim()||loading)&&{opacity:0.5}]} onPress={()=>send()} disabled={!input.trim()||loading}>
          {loading?<ActivityIndicator size="small" color={colors.bg}/>:<Text style={s.sendTxt}>→</Text>}
        </TouchableOpacity>
      </View>

      <Text style={s.disclaimer}>General advice only. Consult a licensed financial advisor for personalised recommendations.</Text>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root:      { flex:1, backgroundColor:colors.bg },
  header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', padding:SPACING.xl, paddingBottom:SPACING.md },
  title:     { fontFamily:FONTS.display, fontSize:26, color:colors.text },
  sub:       { fontSize:12, color:colors.soft, fontFamily:FONTS.regular, marginTop:2 },
  clearBtn:  { borderWidth:1, borderColor:colors.border, borderRadius:RADIUS.sm, paddingVertical:5, paddingHorizontal:12 },
  clearTxt:  { color:colors.soft, fontSize:12, fontFamily:FONTS.medium },
  chat:      { flex:1, backgroundColor:colors.bg },
  bubble:    { maxWidth:'88%', borderRadius:RADIUS.lg, padding:SPACING.lg, marginBottom:12 },
  aiBubble:  { alignSelf:'flex-start', backgroundColor:colors.card, borderWidth:1, borderColor:'rgba(212,168,67,0.2)', borderBottomLeftRadius:4 },
  userBubble:{ alignSelf:'flex-end', backgroundColor:'rgba(212,168,67,0.15)', borderWidth:1, borderColor:'rgba(212,168,67,0.3)', borderBottomRightRadius:4 },
  aiLabel:   { fontSize:10, color:colors.gold, fontFamily:FONTS.bold, letterSpacing:1, marginBottom:6 },
  bubbleTxt: { fontSize:13, fontFamily:FONTS.regular, lineHeight:20 },
  aiTxt:     { color:colors.text },
  userTxt:   { color:colors.text },
  dot:       { width:8, height:8, borderRadius:4, backgroundColor:colors.gold },
  quickRow:  { paddingVertical:SPACING.sm },
  quickBtn:  { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:RADIUS.lg, paddingVertical:7, paddingHorizontal:14, maxWidth:220 },
  quickTxt:  { color:colors.soft, fontSize:12, fontFamily:FONTS.regular },
  inputRow:  { flexDirection:'row', gap:8, padding:SPACING.lg, paddingTop:0 },
  inp:       { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:RADIUS.lg, padding:12, color:colors.text, fontSize:14, fontFamily:FONTS.regular, maxHeight:120 },
  sendBtn:   { width:44, height:44, backgroundColor:colors.gold, borderRadius:22, alignItems:'center', justifyContent:'center', alignSelf:'flex-end' },
  sendTxt:   { color:colors.bg, fontSize:20, fontWeight:'700' },
  disclaimer:{ textAlign:'center', color:colors.muted, fontSize:10, fontFamily:FONTS.regular, paddingHorizontal:SPACING.xl, paddingBottom:SPACING.sm } });
